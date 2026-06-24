require('dotenv').config();
const express = require('express');
// Initialize Stripe with your Secret API Key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());

// Endpoint to start a pre-built Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // Set to 'subscription' for recurring payments
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Premium Ebook', // Name of the product
            },
            unit_amount: 2000, // Amount in cents ($20.00)
          },
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/success.html', // Redirect after success
      cancel_url: 'http://localhost:3000/cancel.html',   // Redirect after cancellation
    });

    // Provide the session URL back to the frontend client
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
