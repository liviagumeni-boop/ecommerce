import React, { useEffect, useRef, useState } from "react";

const AddProductModal: React.FC<AddProductModalProps> = ({
  show,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const addModalRef = useRef<HTMLDivElement | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    brand_id: 0,
    category_id: 0,
    image: null as File | null,
    stock: 0,
    qty: 0,
    purchase_price: 0,
    sale_price: 0,
    in_stock: true,
  });

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newAttrName, setNewAttrName] = useState("");
  const [valueDrafts, setValueDrafts] = useState<Record<number, string>>({});
  const [variants, setVariants] = useState<Variant[]>([]);

  // FETCH DATA
  const fetchCategories = async () => {
    const res = await api.get("/categories");
    setCategories(res.data);
  };

  const fetchBrands = async () => {
    const res = await api.get("/brands");
    setBrands(res.data);
  };

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  // ====== PLACEHOLDER FUNCTIONS (you already use them below) ======
  const addAttribute = () => {};
  const removeAttribute = (idx: number) => {};
  const addValueToAttribute = (idx: number) => {};
  const removeValueFromAttribute = (idx: number, value: string) => {};
  const resetNewProduct = () => {};
  const addProduct = () => {};
  const setVariantQty = (combo: any, qty: number) => {};
  const getVariantQty = (combo: any) => 0;

  const generatedCombos: any[] = [];

  if (!show) return null;

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 99999,
      }}
    >
      <div
        ref={addModalRef}
        className="bg-white p-4 rounded"
        style={{
          width: 650,
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          zIndex: 100000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE */}
        <button
          onClick={() => {
            resetNewProduct();
            onClose();
          }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            border: "none",
            background: "transparent",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <h5>Add Product</h5>

        {/* NAME */}
        <input
          className="form-control my-2"
          placeholder="Name"
          value={newProduct.name}
          onChange={(e) =>
            setNewProduct({ ...newProduct, name: e.target.value })
          }
        />

        {/* DESCRIPTION */}
        <input
          className="form-control my-2"
          placeholder="Description"
          value={newProduct.description}
          onChange={(e) =>
            setNewProduct({ ...newProduct, description: e.target.value })
          }
        />

        {/* BRAND */}
        <select
          className="form-control my-2"
          value={newProduct.brand_id}
          onChange={(e) =>
            setNewProduct({
              ...newProduct,
              brand_id: Number(e.target.value),
            })
          }
        >
          <option value="">Select Brand</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* CATEGORY */}
        <select
          className="form-control my-2"
          value={newProduct.category_id}
          onChange={(e) =>
            setNewProduct({
              ...newProduct,
              category_id: Number(e.target.value),
            })
          }
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* IMAGE */}
        <input
          type="file"
          className="form-control my-2"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setNewProduct({ ...newProduct, image: file || null });
          }}
        />

        {/* PRICES */}
        <input
          type="number"
          className="form-control my-2"
          placeholder="Purchase Price"
          value={newProduct.purchase_price || ""}
          onChange={(e) =>
            setNewProduct({
              ...newProduct,
              purchase_price: Number(e.target.value),
            })
          }
        />

        <input
          type="number"
          className="form-control my-2"
          placeholder="Sale Price"
          value={newProduct.sale_price || ""}
          onChange={(e) =>
            setNewProduct({
              ...newProduct,
              sale_price: Number(e.target.value),
            })
          }
        />

        {/* STOCK */}
        <div className="form-check my-2">
          <input
            type="checkbox"
            className="form-check-input"
            checked={newProduct.in_stock}
            onChange={(e) =>
              setNewProduct({
                ...newProduct,
                in_stock: e.target.checked,
              })
            }
          />
          <label>In Stock</label>
        </div>

        <hr />
        <h6>Attributes (Variants)</h6>

        <div className="d-flex gap-2 mb-2">
          <input
            className="form-control"
            placeholder="Attribute name"
            value={newAttrName}
            onChange={(e) => setNewAttrName(e.target.value)}
          />
          <button className="btn btn-outline-primary" onClick={addAttribute}>
            + Add
          </button>
        </div>

        {attributes.map((attr, idx) => (
          <div key={idx} className="border p-2 mb-2 rounded bg-light">
            <div className="d-flex justify-content-between">
              <strong>{attr.name}</strong>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => removeAttribute(idx)}
              >
                Remove
              </button>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-2">
              {attr.values.map((v) => (
                <span key={v} className="badge bg-secondary">
                  {v}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* VARIANTS */}
        {generatedCombos.length > 0 && (
          <div className="mt-3">
            <h6>Variants Stock</h6>
          </div>
        )}

        {/* ACTIONS */}
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button
            className="btn btn-secondary"
            onClick={() => {
              resetNewProduct();
              onClose();
            }}
          >
            Cancel
          </button>

          <button className="btn btn-primary" onClick={addProduct}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;