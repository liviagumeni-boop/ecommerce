import { useNavigate } from "react-router-dom";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          width: "400px",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#22c55e" }}>✓ Payment Successful</h1>

        <p>Your order has been paid successfully.</p>

        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            border: "none",
            borderRadius: "10px",
            background: "#5e5cd0",
            color: "white",
            cursor: "pointer",
          }}
        >
          Return Home
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;