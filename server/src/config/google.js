const pool = require("../config/db");
const { decrypt } = require("../utils/crypto");

let cachedCreds = null;
let cachedAt = 0;
const TTL = 1000 * 60 * 5; // cache for 5 minutes

async function getGoogleCredentials() {
  if (cachedCreds && Date.now() - cachedAt < TTL) {
    return cachedCreds;
  }

  const { rows } = await pool.query(
    `SELECT google_client_id, google_client_secret
     FROM store_settings
     WHERE id = 1`
  );

  const row = rows[0];

  if (!row?.google_client_id || !row?.google_client_secret) {
    throw new Error("Google OAuth credentials not configured in admin panel");
  }

  cachedCreds = {
    clientId: row.google_client_id,
    clientSecret: decrypt(row.google_client_secret),
  };

  cachedAt = Date.now();

  return cachedCreds;
}

// NEW: clears the cache so the next getGoogleCredentials() call
// re-reads fresh values from the DB instead of serving stale ones.
function invalidateGoogleCache() {
  cachedCreds = null;
  cachedAt = 0;
}

module.exports = { getGoogleCredentials, invalidateGoogleCache };