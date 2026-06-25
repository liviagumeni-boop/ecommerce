import React from "react";
import axios from "../../../api/axios";
import { useCart } from "../../../componets/common/Cartcontext";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Checkout = () => {
  const { cart } = useCart();
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;
  if (!userId) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#f4f6fb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          background: "white",
          padding: 40,
          borderRadius: 12,
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          maxWidth: 400,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ marginBottom: 8 }}>Please log in to continue</h2>
          <p style={{ color: "#666", marginBottom: 24 }}>
            You need an account to complete your purchase.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        
          </div>
        </div>
      </div>
    );
  }
  const total = cart.reduce(
    (sum, item) => sum + item.sale_price * item.qty,
    0
  );

const fetchClientSecret = async () => {
  if (!cart.length) throw new Error("Cart is empty"); // ← add this guard
  const res = await axios.post(
    "/payment/create-checkout-session",
    { items: cart },
    { headers: { userid: userId } }
  );
  return res.data.clientSecret;
};

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", padding: 40 }}>
      <div style={{ maxWidth: 600, margin: "auto", background: "white", padding: 30 }}>
        <h1>Checkout</h1>

        {cart.map((item) => (
          <div key={item.id}>
            {item.name} - €{(item.sale_price * item.qty).toFixed(2)}
          </div>
        ))}

        <h2>Total: €{total.toFixed(2)}</h2>

        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ fetchClientSecret }}
        > 
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
};

export default Checkout;