import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../api/axios";
import { useCart } from "../../../componets/common/Cartcontext";
import { useToast } from "../../../componets/common/ToastContext";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Checkout = () => {
  const { cart } = useCart();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id;

  // ── Guest guard: toast instead of a separate locked layout ──────────────
  useEffect(() => {
    if (!userId) {
      showToast("Please log in or create an account to checkout", "warning");
      navigate("/login");
    }
  }, [userId]);

  if (!userId) {
    // brief flash before redirect fires; render nothing
    return null;
  }

  const total = cart.reduce(
    (sum, item) => sum + item.sale_price * item.qty,
    0
  );

  const fetchClientSecret = async () => {
    if (!cart.length) throw new Error("Cart is empty");
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
