// orderController.js
import * as orderModel from '../models/orderModel.js';

// Function to create a new order
export const createOrder = async (req, res) => {
  const userId = req.user.id; // Get from JWT token, not req.body
  const { items, shippingAddress } = req.body;

  try {
    const { order, orderId, totalAmount } = await orderModel.createOrder(userId, items, shippingAddress);

    res.status(201).json({
      message: 'Order created successfully',
      orderId,
      totalAmount,
      order,
    });
  } catch (error) {
    console.error('Error creating order (controller):', error);
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to get orders by authenticated user
export const getOrdersByUser = async (req, res) => {
  const userId = req.user.id; // Get from JWT token, NOT from params

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
  const userId = req.user.id;
  const { orderId } = req.params;

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
