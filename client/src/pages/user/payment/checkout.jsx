import React from "react";
import axios from "../../../api/axios";
import { useCart } from "../../../componets/common/Cartcontext";

const Checkout = () => {
  const { cart } = useCart();

  // TOTAL
  const total = cart.reduce(
    (sum, item) => sum + item.sale_price * item.qty,
    0
  );

  // STRIPE CHECKOUT HANDLER
const handleCheckout = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));

    const res = await axios.post(
      "/payment/create-checkout-session",
      {
        items: cart,
      
      },
      {
        headers: {
          userid: user?.id,   // ✅ THIS IS THE IMPORTANT PART
        },
      }
    );

    window.location.href = res.data.url;
  } catch (err) {
    console.log("Checkout error:", err);
  }
};

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6fb",
        display: "flex",
        justifyContent: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          background: "white",
          borderRadius: "16px",
          padding: "30px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1>Checkout</h1>

        <p style={{ color: "#6b7280", marginBottom: "20px" }}>
          Rishiko porosinë para pagesës
        </p>

        {/* ITEMS */}
        <div style={{ marginBottom: "20px" }}>
          {cart.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <h4 style={{ margin: 0 }}>{item.name}</h4>
                <p style={{ margin: 0, color: "#6b7280", fontSize: "13px" }}>
                  Qty: {item.qty}
                </p>
              </div>

              <strong style={{ color: "#3d99f5" }}>
                €{item.sale_price * item.qty}
              </strong>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "15px 0",
            borderTop: "2px solid #eee",
            marginTop: "10px",
          }}
        >
          <h2>Total</h2>
          <h2 style={{ color: "#5e5cd0" }}>€{total.toFixed(2)}</h2>
        </div>

        {/* BUTTON (UI I PA PREKUR) */}
        <button
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "14px",
            background: "linear-gradient(135deg,#5e5cd0,#3d99f5)",
            border: "none",
            borderRadius: "10px",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          onClick={handleCheckout}
        >
          Pay Now
        </button>
      </div>
    </div>
  );
};

export default Checkout;