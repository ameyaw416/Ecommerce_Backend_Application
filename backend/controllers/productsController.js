// create controller function responses for products
import {
  findAllProducts,
  findProductById,
  createNewProduct,
  updateProductById,
  deleteProductById,
  getProductsFiltered,
  bulkCreateProducts
} from '../models/productsModel.js';

// Helper to build pagination links
const buildPageLinks = (req, page, pages) => {
  const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
  const setPage = (p) => { url.searchParams.set('page', String(p)); return url.toString(); };
  const links = {};
  if (page > 1) links.prev = setPage(page - 1);
  if (page < pages) links.next = setPage(page + 1);
  return links;
};

// Controller to get all products
export const getAllProducts = async (req, res, next) => {
  try {
    const filterKeys = [
      'page',
      'limit',
      'search',
      'minPrice',
      'maxPrice',
      'inStock',
      'sortBy',
      'sortDir',
      'created_from',
      'created_to',
    ];

    const hasFilters = Object.keys(req.query || {}).some((key) =>
      filterKeys.includes(key)
    );

    if (hasFilters) {
      return next();
    }

    const products = await findAllProducts();
    res.status(200).json(products);
  } catch (err) {
    next(err);
  }
};

// Controller to get a product by ID
export const getProductById = async (req, res, next) => {
  try {
    const product = await findProductById(req.params.id);
    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    next(err);
  }
};

// Controller to create a new product
export const createProduct = async (req, res, next) => {
  try {
    const newProduct = await createNewProduct(req.body);
    res.status(201).json(newProduct);
  } catch (err) {
    next(err);
  }
};

// Controller to update a product by ID
export const updateProduct = async (req, res, next) => {
  try {
    const updatedProduct = await updateProductById(req.params.id, req.body);
    if (updatedProduct) {
      res.status(200).json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    next(err);
  }
};

// Controller to delete a product by ID
export const deleteProduct = async (req, res, next) => {
  try {
    const deleted = await deleteProductById(req.params.id);
    if (deleted) {
      res.status(200).json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    next(err);
  }
};

// Controller to list products with filtering, pagination, etc.
export const listProducts = async (req, res, next) => {
  try {
    const {
      page, limit, search, minPrice, maxPrice, inStock,
      sortBy, sortDir, created_from, created_to
    } = req.query;

    const result = await getProductsFiltered({
      page, limit, search, minPrice, maxPrice, inStock,
      sortBy, sortDir, created_from, created_to
    });

    const links = buildPageLinks(req, result.pagination.page, result.pagination.pages);

    res.status(200).json({ ...result, links });
  } catch (err) {
    next(err);
  }
};

// Controller to bulk-create multiple products (admin)
export const createBulkProducts = async (req, res, next) => {
  try {
    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Body must be a non-empty array of products' });
    }

    for (const p of items) {
      if (!p?.name || p.price == null || p.stock == null) {
        return res.status(400).json({ error: 'Each product must include name, price, and stock' });
      }
    }

    const created = await bulkCreateProducts(items); // calls the MODEL function
    res.status(201).json({
      message: 'Products created successfully',
      count: created.length,
      products: created,
    });
  } catch (err) {
    console.error('bulkCreateProducts error:', err?.stack || err);
    next(err);
  }
};
