import React, { useState } from "react";

const CategoryForm = ({ onSubmit }) => {
  const [name, setName] = useState("");

  return (
    <form
      className="card shadow-sm border-0"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.({ name });
      }}
    >
      <div className="card-body">
        <h4 className="card-title mb-4">Add Category</h4>

        <div className="mb-3">
          <label className="form-label">
            Category Name
          </label>

          <input
            type="text"
            className="form-control"
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
        >
          Add
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;