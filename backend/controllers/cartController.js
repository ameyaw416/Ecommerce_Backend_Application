// cartController.js
import * as cartModel from '../models/cartModel.js';


// Function to get all items in the cart for a user
export const getCartItems = async (req, res) => {
  const userId = req.user.id;

  try {
    const cartItems = await cartModel.getCartItems(userId);
    res.status(200).json(cartItems);
  } catch (err) {
    console.error('Error fetching cart items:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to add an item to the cart
export const addItemToCart = async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  // Validation
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid product ID or quantity' });
  }

  try {
    const cartItem = await cartModel.addItemToCart(userId, productId, quantity);
    res.status(201).json(cartItem);
  } catch (err) {
    console.error('Error adding item to cart:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to update the quantity of an item in the cart
export const updateCartItemQuantity = async (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.itemId;
  const { quantity } = req.body;

  // Validation
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }

  try {
    const updatedItem = await cartModel.updateCartItemQuantity(userId, itemId, quantity);
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.status(200).json(updatedItem);
  } catch (err) {
    console.error('Error updating cart item quantity:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to remove an item from the cart
export const removeItemFromCart = async (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.itemId;

  try {
    const deletedItem = await cartModel.removeItemFromCart(userId, itemId);
    
    if (!deletedItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.status(200).json({ message: 'Item removed from cart', item: deletedItem });
  } catch (err) {
    console.error('Error removing item from cart:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
