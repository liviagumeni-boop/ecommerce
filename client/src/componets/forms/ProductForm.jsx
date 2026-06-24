import React, { useState } from "react";

const ProductForm = ({ onSubmit, categories = [] }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");

  return (
    <form
      className="card shadow-sm border-0"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.({ name, price, category });
      }}
    >
      <div className="card-body p-4">
        <h3 className="card-title mb-4">Add Product</h3>

        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            className="form-control"
            placeholder="Product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Price</label>
          <input
            type="number"
            className="form-control"
            placeholder="Product price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Category</label>

          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary w-100">
          Save
        </button>
      </div>
    </form>
  );
};

export default ProductForm;