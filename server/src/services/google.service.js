const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("../config/db");
const { getGoogleCredentials } = require("../config/google");

const verifyCallback = async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;

    let user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      const newUser = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING *",
        [profile.displayName, email, null, "user"]
      );

      return done(null, newUser.rows[0]);
    }

    return done(null, user.rows[0]);
  } catch (err) {
    return done(err, null);
  }
};

async function initGoogleStrategy() {
  try {
    console.log("STEP 1 - initGoogleStrategy started");

    const { clientId, clientSecret } = await getGoogleCredentials();

    console.log(
      "STEP 2 - credentials loaded:",
      clientId,
      clientSecret ? "OK" : "NO SECRET"
    );

    if (!clientId || !clientSecret) {
      throw new Error("Missing Google credentials");
    }

    if (passport._strategy("google")) {
      passport.unuse("google");
    }

    passport.use(
      "google",
      new GoogleStrategy(
        {
          clientID: clientId,
          clientSecret: clientSecret,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        verifyCallback
      )
    );

    console.log("STEP 3 - Google strategy registered");
  } catch (err) {
    console.log("❌ initGoogleStrategy FAILED:");
    console.log(err.message);
    throw err;
  }
}

module.exports = { passport, initGoogleStrategy };