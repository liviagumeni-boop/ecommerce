import React from "react";

const CategoryList = ({ categories }) => {
  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body">
        <h5 className="card-title mb-3">Categories</h5>

        <ul className="list-group list-group-flush">
          {categories.map((c) => (
            <li
              key={c.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              {c.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CategoryList;