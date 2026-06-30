import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../api/axios";
import { useCart } from "../../../componets/common/Cartcontext";
import { useToast } from "../../../componets/common/ToastContext";

// Full-page Material-style spinner shown only while we confirm the session
const Spinner = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f4f6fb",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        width: 56,
        height: 56,
        border: "5px solid #e0e0e0",
        borderTopColor: "#3d99f5",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const CheckoutReturn = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { clearCart } = useCart();
  const ranOnce = useRef(false);

  useEffect(() => {
    // guard against React StrictMode / re-render double-invoke
    if (ranOnce.current) return;
    ranOnce.current = true;

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      showToast("Something went wrong with your payment", "error");
      navigate("/checkout");
      return;
    }

    const confirm = async () => {
      try {
        const res = await axios.get("/payment/session-status", {
          params: { session_id: sessionId },
        });

        const { status, payment_status } = res.data;

        if (status === "complete" && payment_status === "paid") {
          clearCart?.();
          showToast("Payment successful! Your order has been placed.", "success");
          navigate("/");
        } else {
          showToast("Payment was not completed. Please try again.", "error");
          navigate("/checkout");
        }
      } catch (err) {
        showToast("Couldn't confirm your payment. Please contact support.", "error");
        navigate("/checkout");
      }
    };

    confirm();
  }, []);

  return <Spinner />;
};

export default CheckoutReturn;