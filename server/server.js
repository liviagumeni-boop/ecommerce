require("dotenv").config();

const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "dummy_key");
const { passport, initGoogleStrategy } = require("./src/services/google.service");

const entriesRoutes = require("./src/router/entries.routes");
const googleRoutes = require("./src/router/google.routes");

const app = express();

app.use(express.json());

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use("/api", entriesRoutes);
app.use("/api/auth", googleRoutes);

// Debug route
app.get("/debug/google", (req, res) => {
  res.json({
    hasGoogleStrategy: !!passport._strategy("google"),
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  });
});

// Stripe Checkout
app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Premium Ebook",
            },
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/success.html",
      cancel_url: "http://localhost:3000/cancel.html",
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    console.log("Initializing Google strategy...");
    await initGoogleStrategy();
    console.log("✅ Google strategy initialized");
  } catch (err) {
    console.error("❌ Google strategy not initialized:");
    console.error(err);
    console.error("Server will still start, but Google login will return 503 until this is fixed.");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();