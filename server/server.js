require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

// ROUTES
const stockEntryRoutes = require("./routes/stockEntries");

// IMPORTANT
app.use("/api", stockEntryRoutes);

// STRIPE (nëse e do këtu)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Premium Ebook' },
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/success.html',
      cancel_url: 'http://localhost:3000/cancel.html',
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});