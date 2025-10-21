// create controller function responses for products
import {findAllProducts,findProductById, createNewProduct, updateProductById,deleteProductById} from '../models/productsModel.js';

// Controller to get all products
export const getAllProducts = async (req, res, next) => {
    try {
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

