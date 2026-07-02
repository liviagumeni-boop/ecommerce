const express = require("express");
const pool = require("../config/db");
const upload = require("../middleware/upload");
const path = require("path");
const router = express.Router();

// GET
router.get("/", async (req, res) => {
  try {
    const { search, category, brand, sort } = req.query;

    let query = `
      SELECT
        p.*,
        b.name AS brand_name,
        c.name AS category_name,
        COALESCE(SUM(v.qty), 0) AS qty
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN product_variants v ON v.product_id = p.id
      WHERE 1=1
    `;

    const values = [];

    if (search) {
      values.push(`%${search}%`);
      query += ` AND LOWER(p.name) LIKE LOWER($${values.length})`;
    }

    if (category) {
      values.push(category);
      query += ` AND p.category_id = $${values.length}`;
    }

    if (brand) {
      values.push(brand);
      query += ` AND p.brand_id = $${values.length}`;
    }

    query += ` GROUP BY p.id, b.name, c.name`;

    // sorting
    if (sort === "price_low") query += ` ORDER BY p.sale_price ASC`;
    else if (sort === "price_high") query += ` ORDER BY p.sale_price DESC`;
    else query += ` ORDER BY p.id DESC`;

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      description,
      brand_id,
      category_id,
      purchase_price,
      sale_price,
      in_stock,
      variants,
    } = req.body;

    const image = req.file ? "/uploads/" + req.file.filename : null;

    const result = await pool.query(
      `INSERT INTO products
      (name, description, brand_id, category_id, image, purchase_price, sale_price, in_stock)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        name,
        description,
        brand_id,
        category_id,
        image,
        purchase_price,
        sale_price,
        in_stock,
      ]
    );

    const product = result.rows[0];

    // SAVE VARIANTS
    if (variants) {
      const parsed = JSON.parse(variants);
      for (const v of parsed) {
        if (!v.qty || v.qty <= 0) continue;
        await pool.query(
          `INSERT INTO product_variants (product_id, size, color, memory, qty)
           VALUES ($1, $2, $3, $4, $5)`,
          [product.id, v.size || null, v.color || null, v.memory || null, v.qty]
        );
      }
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      description,
      brand_id,
      category_id,
      purchase_price,
      sale_price,
      in_stock,
      image: currentImage,
    } = req.body;

    const image = req.file
      ? "/uploads/" + req.file.filename
      : currentImage;

    const result = await pool.query(
      `
      UPDATE products
      SET
        name=$1,
        description=$2,
        image=$3,
        brand_id=$4,
        category_id=$5,
        purchase_price=$6,
        sale_price=$7,
        in_stock=$8
      WHERE id=$9
      RETURNING *
      `,
      [
        name,
        description,
        image,
        brand_id,
        category_id,
        purchase_price,
        sale_price,
        in_stock,
        req.params.id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const id = req.params.id;

    console.log("Deleting product id:", id);

    await client.query("BEGIN");

    // 1. Get all variant IDs for this product
    const variantsResult = await client.query(
      "SELECT id FROM product_variants WHERE product_id = $1",
      [id]
    );

    const variantIds = variantsResult.rows.map((v) => v.id);

    // 2. Delete stock entries FIRST (this was causing your error)
    if (variantIds.length > 0) {
      await client.query(
        `DELETE FROM stock_exit_entries 
         WHERE variant_id = ANY($1::int[])`,
        [variantIds]
      );
      console.log("stock_exit_entries deleted");
    }

    // 3. Delete dependent product tables
    await client.query(
      "DELETE FROM product_sizes WHERE product_id = $1",
      [id]
    );

    await client.query(
      "DELETE FROM product_colors WHERE product_id = $1",
      [id]
    );

    await client.query(
      "DELETE FROM product_memory WHERE product_id = $1",
      [id]
    );

    console.log("product child tables deleted");

    // 4. Delete variants
    await client.query(
      "DELETE FROM product_variants WHERE product_id = $1",
      [id]
    );

    console.log("variants deleted");

    // 5. Delete product itself
    const result = await client.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Product deleted successfully",
      product: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");

    console.log("🔥 DELETE ERROR:", err);

    res.status(500).json({
      message: err.message,
      detail: err.detail,
      code: err.code,
    });
  } finally {
    client.release();
  }
});
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q || "";

    const result = await pool.query(
      `
    SELECT
  p.id,
  p.name,
  p.description,
  p.brand_id,
  p.category_id,
  p.image,
  COALESCE(p.sale_price, 0)::float AS sale_price,
  COALESCE(SUM(v.qty), 0)::int AS qty
FROM products p
LEFT JOIN product_variants v ON v.product_id = p.id
WHERE 1=1
GROUP BY p.id
      ORDER BY p.name
      LIMIT 20
      `,
      [`%${q}%`]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;