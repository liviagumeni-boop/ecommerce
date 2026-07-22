const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const pool = require("../config/db");

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    const result = await pool.query(`
      SELECT
        p.name,
        p.description,
        p.sale_price,
        b.name AS brand_name,
        c.name AS category_name
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN categories c ON c.id = p.category_id
    `);

    const products = result.rows;

    const catalogText = products
      .map(
        (p) =>
          `- ${p.name} | Brand: ${p.brand_name} | Category: ${p.category_name} | Price: €${p.sale_price} | ${p.description}`
      )
      .join("\n");

    const systemInstruction = `You are a shopping assistant for our online store.
Only answer using the product catalog provided below. Do not invent products, prices, or availability.
If the user asks about something not in the catalog, say we don't carry it and suggest something similar if one exists.
Keep answers short and helpful.

Catalog:
${catalogText}`;

   const response = await ai.models.generateContent({
  model: "gemini-3.5-flash",
  contents: message,
  config: {
    systemInstruction,
  },
});

    res.json({
      reply: response.text,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to generate response",
    });
  }
});

module.exports = router;