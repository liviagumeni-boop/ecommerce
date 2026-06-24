import React from "react";

const Orders = () => {
  const orders = [
    {
      id: 1,
      total: 1200,
      status: "Delivered",
      date: "2026-06-10",
    },
    {
      id: 2,
      total: 80,
      status: "Pending",
      date: "2026-06-11",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", padding: "30px" }}>

      <h2 style={{ marginBottom: "20px" }}>📦 My Orders</h2>

      {orders.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <p>No orders yet</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {orders.map((o) => (
            <div
              key={o.id}
              style={{
                background: "white",
                borderRadius: "14px",
                padding: "20px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                transition: "0.3s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3>Order #{o.id}</h3>

                <span
                  style={{
                    padding: "5px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "white",
                    background:
                      o.status === "Delivered" ? "#22c55e" : "#f59e0b",
                  }}
                >
                  {o.status}
                </span>
              </div>

              <p style={{ color: "#6b7280", marginTop: "10px" }}>
                📅 {o.date}
              </p>

              <h3 style={{ marginTop: "10px", color: "#3d99f5" }}>
                💰 €{o.total}
              </h3>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Orders;