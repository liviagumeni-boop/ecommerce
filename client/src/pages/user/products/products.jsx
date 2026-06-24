import React from "react";

const Products = () => {
  const products = [
    {
      id: 1,
      name: "iPhone 15",
      price: 1200,
      category: "Electronics",
      description: "Latest Apple smartphone with A16 chip.",
      image: "https://via.placeholder.com/300",
    },
    {
      id: 2,
      name: "Nike Shoes",
      price: 150,
      category: "Clothes",
      description: "Comfortable running shoes for daily use.",
      image: "https://via.placeholder.com/300",
    },
    {
      id: 3,
      name: "Headphones",
      price: 80,
      category: "Electronics",
      description: "High quality sound with noise canceling.",
      image: "https://via.placeholder.com/300",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", padding: "30px" }}>

      {}
      <h2 style={{ marginBottom: "20px" }}>🛍️ Products</h2>

      {}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {products.map((p) => (
          <div
            key={p.id}
            style={{
              background: "white",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
              transition: "0.3s",
            }}
          >
            {}
            <img
              src={p.image}
              alt={p.name}
              style={{
                width: "100%",
                height: "180px",
                objectFit: "cover",
              }}
            />

            {}
            <div style={{ padding: "15px" }}>
              <span
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background:
                    p.category === "Electronics" ? "#3d99f5" : "#5e5cd0",
                  color: "white",
                }}
              >
                {p.category}
              </span>

              <h3 style={{ marginTop: "10px" }}>{p.name}</h3>

              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                {p.description}
              </p>

              <h3 style={{ color: "#3d99f5", marginTop: "10px" }}>
                €{p.price}
              </h3>
            </div>

            {}
            <button
              style={{
                width: "100%",
                padding: "12px",
                border: "none",
                background: "linear-gradient(135deg,#5e5cd0,#3d99f5)",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🛒 Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;