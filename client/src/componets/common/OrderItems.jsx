import React from "react";

const OrderItem = ({ order }) => {
  return (
    <div className="card shadow-sm border-0 mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="card-title mb-0">
            Order #{order.id}
          </h5>

          <span
            className={`badge ${
              order.status === "Delivered"
                ? "bg-success"
                : order.status === "Pending"
                ? "bg-warning text-dark"
                : order.status === "Cancelled"
                ? "bg-danger"
                : "bg-secondary"
            }`}
          >
            {order.status}
          </span>
        </div>

        <p className="card-text mb-0">
          <strong>Total:</strong> {order.total} €
        </p>
      </div>
    </div>
  );
};

export default OrderItem;