import React, { useState } from "react";
import { FaTrash, FaPlus, FaMinus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../componets/common/Cartcontext";
import api from "../../../api/axios";
const Cart = () => {
  const navigate = useNavigate();

  const { cart, increaseQty, decreaseQty, removeFromCart } = useCart();

  const [shippingType, setShippingType] = useState("standard");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

 const [couponData, setCouponData] = useState(null);
const [couponError, setCouponError] = useState("");

const applyCoupon = async () => {
  try {
    setCouponError("");

    const code = coupon.trim().toUpperCase();

    const res = await api.get(`/coupons/${code}`);

    setCouponData(res.data);
  } catch (err) {
    setCouponData(null);
    setCouponError(err.response?.data?.message || "Invalid coupon");
  }
};
const subtotal = cart.reduce(
  (sum, item) =>
    sum + (Number(item.sale_price) || 0) * item.qty,
  0
);

const discountAmount = couponData
  ? (subtotal * couponData.discount_percent) / 100
  : 0;

  const shipping =
    shippingType === "express"
      ? 10
      : shippingType === "standard"
        ? 5
        : 0;

  const total = subtotal - discountAmount + shipping;

  const freeShippingLeft = Math.max(100 - subtotal, 0);

  return (
    <div style={{ padding: 30, background: "#f4f6fb", minHeight: "100vh" }}>

      <h2>Cart</h2>

      {/* FREE SHIPPING */}
      <div
        style={{
          background: "#111827",
          color: "white",
          padding: 12,
          borderRadius: 10,
          marginBottom: 15,
        }}
      >
        {freeShippingLeft > 0
          ? `Add $${freeShippingLeft.toFixed(2)} for FREE shipping`
          : "FREE shipping active"}
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

        {/* LEFT */}
        <div className="card p-3">

          <table className="table align-middle">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Brand</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {cart.map((item) => (
                <tr key={item.id}>

                  <td>
                <img
  src={
    item.image
      ? `http://localhost:5000${item.image}`
      : "https://placehold.co/400x300?text=No+Image"
  }
  style={{
    width: 60,
    height: 60,
    objectFit: "cover",
    borderRadius: 8,
  }}
/>
                  </td>

             <td>{item.name}</td>
<td>{item.brand_name}</td>

<td>
  {item.selectedSize ? (
    <span className="badge bg-primary">
      {item.selectedSize}
    </span>
  ) : (
    "-"
  )}
</td>
                  <td>
                    <button onClick={() => decreaseQty(item.id)}>
                      <FaMinus />
                    </button>

                    <span style={{ margin: "0 10px" }}>{item.qty}</span>

                    <button onClick={() => increaseQty(item.id)}>
                      <FaPlus />
                    </button>
                  </td>

              <td>€{item.sale_price}</td>
<td>€{item.sale_price * item.qty}</td>

                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <FaTrash />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

          {/* COUPON */}
          <div className="mt-3 p-3 border rounded">

            <h6>Discount Code</h6>
<input
  className="form-control"
  value={coupon}
  onChange={(e) => setCoupon(e.target.value)}
  placeholder="Enter coupon"
/>

<button className="btn btn-primary" onClick={applyCoupon}>
  Apply
</button>

{couponError && (
  <small style={{ color: "red" }}>{couponError}</small>
)}

{couponData && (
  <small style={{ color: "green" }}>
    Coupon applied: -{couponData.discount_percent}%
  </small>
)}

          </div>

        </div>

        {/* RIGHT */}
        <div
          className="card p-3"
          style={{
            background: "#111827",
            color: "white",
            borderRadius: 12,
            height: "fit-content",
          }}
        >

          <h4>Invoice</h4>
          <hr />

          <div className="d-flex justify-content-between">
            <span>Subtotal</span>
            <strong>€{subtotal.toFixed(2)}</strong>
          </div>

          <div className="d-flex justify-content-between">
            <span>Discount</span>
            <strong>-€{discountAmount.toFixed(2)}</strong>
          </div>

          <div className="d-flex justify-content-between">
            <span>Shipping</span>
            <strong>€{shipping}</strong>
          </div>

          <hr />

          <div className="d-flex justify-content-between">
            <span>Total</span>
            <strong>€{total.toFixed(2)}</strong>
          </div>

          {/* SHIPPING */}
          <div className="mt-3">
            <h6>Shipping Method</h6>

            <select
              className="form-control"
              value={shippingType}
              onChange={(e) => setShippingType(e.target.value)}
            >
              <option value="standard">Standard (2–4 days) - $5</option>
              <option value="express">Express (1 day) - $10</option>
              <option value="pickup">Local Pickup - FREE</option>
            </select>
          </div>

          {/* CHECKOUT */}
          <button
            className="btn btn-success w-100 mt-3"
            onClick={() => navigate("/checkout")}
          >
            Checkout
          </button>

        </div>

      </div>
    </div>
  );
};

export default Cart;