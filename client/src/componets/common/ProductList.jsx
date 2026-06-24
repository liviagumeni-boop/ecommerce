import React from "react";

const ProductList = ({ products }) => {
  return (
    <div className="row g-4">
      {products.map((p) => (
        <div className="col-12 col-sm-6 col-lg-4" key={p.id}>
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">{p.name}</h5>

              <p className="card-text text-muted mb-4">
                {p.price} €
              </p>

              <button className="btn btn-primary mt-auto">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductList;