import { useState } from "react";
import api from "axios";

export default function Checkout() {
  const [amount, setAmount] = useState(10);

  const pay = async () => {
    const res = await api.post(
      "http://localhost:5000/api/payment/create-payment-intent",
      { amount }
    );

    const clientSecret = res.data.clientSecret;

    alert("Client Secret u krijua: " + clientSecret);
  };

  return (
    <div className="container py-5">
      <div className="card shadow-sm border-0 mx-auto" style={{ maxWidth: "500px" }}>
        <div className="card-body p-4">
          <h3 className="card-title mb-4 text-center">
            Checkout
          </h3>

          <div className="mb-3">
            <label className="form-label">Amount (€)</label>

            <input
              type="number"
              className="form-control"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
            />
          </div>

          <button
            className="btn btn-primary w-100"
            onClick={pay}
          >
            Pay with Stripe
          </button>
        </div>
      </div>
    </div>
  );
}