// creating functions for productsModel.js file
import pool from '../config/db.js';

// Function to find all products
export const findAllProducts = async () => {
  const result = await pool.query('SELECT * FROM products;');
  return result.rows;
};

// Function to find a product by ID
export const findProductById = async (id) => {
  const result = await pool.query('SELECT * FROM products WHERE id = $1;', [id]);
  return result.rows[0];
};

// Function to create a new product
export const createNewProduct = async (product) => {
  const { name, description, price, stock, image_url } = product;

  const result = await pool.query(
    `INSERT INTO products (name, description, price, stock, image_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *;`,
    [name, description, price, stock, image_url]
  );

  return result.rows[0];
};

// Function to update a product by ID
export const updateProductById = async (id, product) => {
  const { name, description, price, stock, image_url } = product;

  const result = await pool.query(
    `UPDATE products
     SET name = $1, description = $2, price = $3, stock = $4, image_url = $5
     WHERE id = $6
     RETURNING *;`,
    [name, description, price, stock, image_url, id]
  );

  return result.rows[0];
};

// Function to delete a product by ID
export const deleteProductById = async (id) => {
  const result = await pool.query(
    'DELETE FROM products WHERE id = $1 RETURNING *;',
    [id]
  );
  return result.rowCount > 0;
};


// Set an exact stock count (e.g., set to 100)
export const setProductStock = async (productId, newStock) => {
  const result = await pool.query(
    `UPDATE products
     SET stock = $1
     WHERE id = $2::uuid
     RETURNING *;`,
    [newStock, productId]
  );
  return result.rows[0] || null;
};

// Change stock by a delta (can be positive or negative)
// Ensures stock never drops below zero.
export const changeProductStock = async (productId, delta) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const selectRes = await client.query(
      'SELECT id, stock FROM products WHERE id = $1::uuid FOR UPDATE;',
      [productId]
    );

    if (selectRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const currentStock = Number(selectRes.rows[0].stock || 0);
    const newStock = currentStock + Number(delta);

    if (newStock < 0) {
      await client.query('ROLLBACK');
      const err = new Error('Insufficient stock for this operation');
      err.code = 'INSUFFICIENT_STOCK';
      throw err;
    }

    const updateRes = await client.query(
      `UPDATE products
       SET stock = $1
       WHERE id = $2::uuid
       RETURNING *;`,
      [newStock, productId]
    );

    await client.query('COMMIT');
    return updateRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};


// List products with filters, search, sort, pagination, price + date range
export const getProductsFiltered = async ({
  page = 1,
  limit = 10,
  search = '',
  minPrice = null,
  maxPrice = null,
  inStock = null, // 'true' | 'false' | boolean
  sortBy = 'created_at',
  sortDir = 'desc',
  created_from = null,
  created_to = null,
}) => {
  const allowedSort = new Set(['created_at', 'name', 'price', 'stock']);
  const dir = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const sortCol = allowedSort.has(sortBy) ? sortBy : 'created_at';

  const where = [];
  const params = [];
  let idx = 1;

  if (search) {
    where.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  if (minPrice != null) {
    where.push(`price >= $${idx}`);
    params.push(Number(minPrice));
    idx++;
  }

  if (maxPrice != null) {
    where.push(`price <= $${idx}`);
    params.push(Number(maxPrice));
    idx++;
  }

  if (inStock === 'true' || inStock === true) {
    where.push(`stock > 0`);
  } else if (inStock === 'false' || inStock === false) {
    where.push(`stock = 0`);
  }

  if (created_from) {
    where.push(`created_at >= $${idx}`);
    params.push(new Date(created_from));
    idx++;
  }

  if (created_to) {
    where.push(`created_at < $${idx}`);
    params.push(new Date(created_to));
    idx++;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
  const pageNum = Math.max(1, Number(page) || 1);
  const offset = (pageNum - 1) * limitNum;

  const q = `
    SELECT id, name, description, price, stock, image_url, created_at,
           COUNT(*) OVER() AS total_count
    FROM products
    ${whereSql}
    ORDER BY ${sortCol} ${dir}
    LIMIT $${idx} OFFSET $${idx + 1};
  `;
  params.push(limitNum, offset);

  const res = await pool.query(q, params);

  const total = res.rows.length ? Number(res.rows[0].total_count) : 0;
  const pages = Math.max(1, Math.ceil(total / limitNum));

  return {
    data: res.rows.map(({ total_count, ...r }) => r),
    pagination: { page: pageNum, limit: limitNum, total, pages },
  };
};
