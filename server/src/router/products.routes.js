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
        c.name AS category_name
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN categories c ON c.id = p.category_id
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

    // sorting
    if (sort === "price_low") query += ` ORDER BY p.sale_price ASC`;
    else if (sort === "price_high") query += ` ORDER BY p.sale_price DESC`;
    else query += ` ORDER BY p.id DESC`;

    const result = await pool.query(query, values);

    const products = result.rows;

    // 🔥 ADD OPTIONS FOR EACH PRODUCT
    for (let p of products) {
      const sizes = await pool.query(
        "SELECT size FROM product_sizes WHERE product_id=$1",
        [p.id]
      );

      const colors = await pool.query(
        "SELECT color FROM product_colors WHERE product_id=$1",
        [p.id]
      );

      const memory = await pool.query(
        "SELECT memory FROM product_memory WHERE product_id=$1",
        [p.id]
      );

      p.sizes = sizes.rows.map((s) => s.size);
      p.colors = colors.rows.map((c) => c.color);
      p.memory = memory.rows.map((m) => m.memory);
    }

    res.json(products);
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
      qty,
      purchase_price,
      sale_price,
      in_stock,
      sizes,
      colors,
      memory,
    } = req.body;

    const image = req.file ? "/uploads/" + req.file.filename : null;

    const result = await pool.query(
      `INSERT INTO products
      (name, description, brand_id, category_id, image, qty, purchase_price, sale_price, in_stock)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        name,
        description,
        brand_id,
        category_id,
        image,
        qty,
        purchase_price,
        sale_price,
        in_stock,
      ]
    );

    const product = result.rows[0];

    // SAVE OPTIONS
    if (sizes?.length) {
      for (let s of JSON.parse(sizes)) {
        await pool.query(
          "INSERT INTO product_sizes(product_id, size) VALUES($1,$2)",
          [product.id, s]
        );
      }
    }

    if (colors?.length) {
      for (let c of JSON.parse(colors)) {
        await pool.query(
          "INSERT INTO product_colors(product_id, color) VALUES($1,$2)",
          [product.id, c]
        );
      }
    }

    if (memory?.length) {
      for (let m of JSON.parse(memory)) {
        await pool.query(
          "INSERT INTO product_memory(product_id, memory) VALUES($1,$2)",
          [product.id, m]
        );
      }
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      brand_id,
      category_id,
      qty,
      stock,
      purchase_price,
      sale_price,
      in_stock,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE products
      SET
        name=$1,
        description=$2,
        image=$3,
        brand_id=$4,
        category_id=$5,
        qty=$6,
        stock=$7,
        purchase_price=$8,
        sale_price=$9,
        in_stock=$10
      WHERE id=$11
      RETURNING *
      `,
      [
        name,
        description,
        image,
        brand_id,
        category_id,
        qty,
        stock,
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
  try {
    const id = req.params.id;

    // delete child tables first
    await pool.query("DELETE FROM product_sizes WHERE product_id = $1", [id]);
   await pool.query("DELETE FROM product_colors WHERE product_id = $1", [id]);
    await pool.query("DELETE FROM product_memory WHERE product_id = $1", [id]);

    // then delete product
    await pool.query("DELETE FROM products WHERE id = $1", [id]);

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.log("DELETE ERROR:", err);

    res.status(500).json({
      message: err.message,
      detail: err.detail,
      code: err.code,
    });
  }
});

module.exports = router;