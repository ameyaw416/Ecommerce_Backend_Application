// controllers/orderController.js
import * as orderModel from '../models/orderModel.js';


// Function to create a new order
export const createOrder = async (req, res) => {
  const userId = req.user?.id; // Get from JWT token, not req.body
  const { items, shippingAddress } = req.body;

  try {
    const { order, orderId, totalAmount } = await orderModel.createOrder(userId, items, shippingAddress);

    //Fetch hydrated order with items aggregated
    const fullOrder = await orderModel.getOrderById(orderId, userId);

    res.status(201).json({
      message: 'Order created successfully',
      orderId,
      totalAmount,
      order: fullOrder || order, // fallback to header if for some reason the join returns null
    });
  } catch (error) {
    console.error('Error creating order (controller):', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Function to get all orders (admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.getAllOrders();
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching all orders (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to get orders by authenticated user
export const getOrdersByUser = async (req, res) => {
  const userId = req.user?.id; // Get from JWT token, NOT from params

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const orders = await orderModel.getOrdersByUser(userId);
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to get a specific order by ID
export const getOrderById = async (req, res) => {
  const userId = req.user?.id;
  const { orderId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const order = await orderModel.getOrderById(orderId, userId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin: update order status
export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!status || typeof status !== 'string') {
    return res.status(400).json({ error: 'Status is required and must be a string' });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
  }

  try {
    const updated = await orderModel.updateOrderStatus(orderId, status);
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json({ message: 'Order status updated', order: updated });
  } catch (error) {
    console.error('Error updating order status:', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Internal server error' });
  }
};