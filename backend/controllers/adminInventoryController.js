import * as productModel from '../models/productsModel.js';

// Admin controller to get all products
export const adminGetProducts = async (req, res) => {
  try {
    const products = await productModel.getAllProducts();
    res.status(200).json(products);
  } catch (err) {
    console.error('Error fetching products (admin):', err?.stack || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin controller to adjust stock by delta
export const adminAdjustStock = async (req, res) => {
  const { id } = req.params;
  const { delta } = req.body;

  // Validate delta
  if (delta == null || isNaN(Number(delta)) || !Number.isInteger(Number(delta))) {
    return res
      .status(400)
      .json({ error: 'delta is required and must be an integer (positive or negative)' });
  }

  try {
    // Update stock using delta (relative change)
    const updated = await productModel.changeProductStock(id, Number(delta));

    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({
      message: `Stock adjusted by ${delta}`,
      product: updated,
    });
  } catch (err) {
    if (err.code === 'INSUFFICIENT_STOCK') {
      return res.status(409).json({ error: 'Insufficient stock for this operation' });
    }

    console.error('Error adjusting stock (admin):', err?.stack || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
