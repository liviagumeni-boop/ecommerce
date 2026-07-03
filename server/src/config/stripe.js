const Stripe = require("stripe");
const pool = require("./db");
const { decrypt } = require("../utils/crypto");

let cachedClient = null;
let cachedAt = 0;
const TTL = 60_000; // 1 min — re-checks DB after admin updates the key

async function getStripeClient() {
  if (cachedClient && Date.now() - cachedAt < TTL) {
    return cachedClient;
  }

  const { rows } = await pool.query(
    `SELECT stripe_secret_key FROM store_settings WHERE id = 1`
  );

  const encryptedKey = rows[0]?.stripe_secret_key;
  if (!encryptedKey) {
    throw new Error("Stripe secret key not configured in admin panel");
  }

  const secretKey = decrypt(encryptedKey);
  cachedClient = new Stripe(secretKey);
  cachedAt = Date.now();

  return cachedClient;
}

function invalidateStripeCache() {
  cachedClient = null;
}

module.exports = { getStripeClient, invalidateStripeCache };