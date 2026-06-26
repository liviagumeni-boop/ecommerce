import React, { useEffect, useState } from "react";
import api from "axios";
import { useParams } from "react-router-dom";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    api
      .get(`http://localhost:5000/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => console.log(err));
  }, [id]);

  if (!product)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f4f6fb",
        }}
      >
        <p>Loading...</p>
      </div>
    );

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
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          background: "white",
          padding: "30px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          width: "100%",
          maxWidth: "900px",
        }}
      >
        {}
        <div>
          <img
            src={product.image || "https://via.placeholder.com/400"}
            alt={product.name}
            style={{
              width: "100%",
              borderRadius: "12px",
              objectFit: "cover",
            }}
          />
        </div>

        {}
        <div>
          <h1 style={{ marginBottom: "10px" }}>{product.name}</h1>

          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            {product.description}
          </p>

          <h2 style={{ color: "#3d99f5", marginBottom: "20px" }}>
            €{product.price}
          </h2>

          {}
          <div style={{ marginBottom: "20px" }}>
            <span
              style={{
                background: "#5e5cd0",
                color: "white",
                padding: "5px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                marginRight: "10px",
              }}
            >
              New
            </span>

            <span
              style={{
                background: "#3d99f5",
                color: "white",
                padding: "5px 10px",
                borderRadius: "20px",
                fontSize: "12px",
              }}
            >
              In Stock
            </span>
          </div>

          {}
          <button
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: "linear-gradient(135deg,#5e5cd0,#3d99f5)",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🛒 Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;