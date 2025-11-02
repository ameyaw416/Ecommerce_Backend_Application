import * as paymentModel from '../models/paymentModel.js';
import pool from '../config/db.js';
// If you later add Stripe: import Stripe from 'stripe'; const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ensureOrderOwnedAndTotal = async (orderId, userId) => {
  const q = `
    SELECT id, user_id, total_amount, status
    FROM orders
    WHERE id = $1::uuid
  `;
  const r = await pool.query(q, [orderId]);
  if (!r.rows.length) return { error: 'Order not found' };
  const o = r.rows[0];
  if (o.user_id !== userId) return { error: 'Forbidden' };
  if (o.status === 'cancelled') return { error: 'Order cancelled' };
  return { order: o };
};

// POST /api/payments/intents
export const createPaymentIntent = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { orderId, provider = 'mock' } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const { order, error } = await ensureOrderOwnedAndTotal(orderId, userId);
    if (error) return res.status(400).json({ error });

    // Create a DB record first
    const payment = await paymentModel.createPaymentRecord({
      orderId,
      userId,
      provider,
      amount: Number(order.total_amount || 0),
      currency: 'GHS',
      metadata: { order_status: order.status }
    });

    // Provider switch
    if (provider === 'mock') {
      // Simulate a “client secret” and immediate success path
      const providerPaymentId = `mock_${payment.id}`;
      await paymentModel.attachProviderPaymentId(payment.id, providerPaymentId);
      // For mock, we don't actually charge; client “confirms” immediately
      return res.status(201).json({
        message: 'Mock payment intent created',
        payment: {
          id: payment.id,
          provider: 'mock',
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          provider_client_secret: `mock_secret_${payment.id}` // pretend client secret
        }
      });
    }

    // Example (keep for future): Stripe
    // if (provider === 'stripe') {
    //   const pi = await stripe.paymentIntents.create({
    //     amount: Math.round(Number(order.total_amount) * 100),
    //     currency: 'ghs',
    //     metadata: { orderId, userId }
    //   });
    //   await paymentModel.attachProviderPaymentId(payment.id, pi.id);
    //   return res.status(201).json({
    //     message: 'Stripe payment intent created',
    //     payment: { id: payment.id, provider: 'stripe', amount: payment.amount, currency: payment.currency, status: payment.status, client_secret: pi.client_secret }
    //   });
    // }

    return res.status(400).json({ error: 'Unsupported provider' });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/mock/confirm   (ONLY for mock provider)
export const confirmMockPayment = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { paymentId, success = true } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!paymentId) return res.status(400).json({ error: 'paymentId is required' });

    const payment = await paymentModel.getPaymentById(paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
    if (payment.provider !== 'mock') return res.status(400).json({ error: 'Not a mock payment' });
    if (payment.status !== 'pending' && payment.status !== 'requires_action') {
      return res.status(400).json({ error: 'Payment not in confirmable state' });
    }

    const newStatus = success ? 'succeeded' : 'failed';
    const updated = await paymentModel.updatePaymentStatus(paymentId, newStatus, { confirmed_at: new Date().toISOString() });

    // If succeeded -> move order to 'processing' (or 'paid') and record in status history if you keep it
    if (newStatus === 'succeeded') {
      await pool.query(`UPDATE orders SET status = 'processing' WHERE id = $1::uuid`, [payment.order_id]);
      // optional: insert into order_status_history here if you have helper
    }

    return res.status(200).json({ message: `Payment ${newStatus}`, payment: updated });
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/order/:orderId
export const getPaymentsForOrder = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { order, error } = await ensureOrderOwnedAndTotal(orderId, userId);
    if (error) return res.status(400).json({ error });

    const rows = await paymentModel.getPaymentsByOrder(order.id);
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/user/
export const getPaymentsForUser = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const rows = await paymentModel.getPaymentsByUser(userId);
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/admin/all (admins only)
export const getAllPayments = async (req, res, next) => {
  try {
    const rows = await paymentModel.getAllPayments();
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};
