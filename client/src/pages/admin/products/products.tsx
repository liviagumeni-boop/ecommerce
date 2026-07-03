//kërkesa në API (axios / fetch)
//ruajtje në localStorage
//timers (setTimeout, setInterval)
//subscribe / unsubscribe
//logjikë që ndodh pas shfaqjes së UI
import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../../../layout/sidebar";
import AdminHeader from "../../../layout/headeradmin";

import {
  EditButton,
  DeleteButton,
  SaveButton,
} from "../../../componets/ui/button";

import api from "../../../api/axios";
import { useToast } from "../../../componets/common/ToastContext";
type Product = {
  id: number;
  name: string;
  description: string;

  brand_id: number;
  brand_name: string;

  category_id: number;
  category_name: string;

  image: string;
  stock: number;
  qty: number;
  purchase_price: number;
  sale_price: number;
  in_stock: boolean;
};

type Category = {
  id: number;
  name: string;
};

/* ================= DYNAMIC VARIANT TYPES ================= */
// An "attribute" is something like { name: "Color", values: ["Red","Blue"] }
// or { name: "Storage", values: ["64GB","128GB","256GB"] }. Unlimited
// attributes, unlimited values each — replaces the old fixed sizes/colors/memory.
type Attribute = {
  name: string;
  values: string[];
};

// A variant is one combination across all attributes, e.g.
// { attributes: { Color: "Red", Storage: "128GB" }, qty: 10 }
type Variant = {
  attributes: Record<string, string>;
  qty: number;
};

/* ================= CARTESIAN PRODUCT HELPER ================= */
// Builds every combination across N attribute value lists.
// e.g. [["Red","Blue"], ["64GB","128GB"]] →
// [["Red","64GB"], ["Red","128GB"], ["Blue","64GB"], ["Blue","128GB"]]
const cartesian = (arrays: string[][]): string[][] => {
  if (arrays.length === 0) return [];
  return arrays.reduce<string[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]]
  );
};

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    brand: "",
    sort: "",
  });
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

  /* ================= DYNAMIC ATTRIBUTES STATE ================= */
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newAttrName, setNewAttrName] = useState("");
  const [valueDrafts, setValueDrafts] = useState<Record<number, string>>({});
  const [variants, setVariants] = useState<Variant[]>([]);

  const [editModal, setEditModal] = useState(false);
const menuRef = useRef<HTMLDivElement | null>(null);
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (!menuRef.current) return;

    if (!menuRef.current.contains(event.target as Node)) {
      setOpenMenuId(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
const [editProduct, setEditProduct] = useState({
  id: 0,
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
  const [saleModal, setSaleModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [saleQty, setSaleQty] = useState(1);
  const [deleteModal, setDeleteModal] = useState<null | number>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

useEffect(() => {
  setCurrentPage(1);
  setSelectedIds(new Set());
}, [filters]);

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async () => {
    const res = await api.get("/products", { params: filters });
    setProducts(res.data);
  };

  // ================= FETCH CATEGORIES =================
  const fetchCategories = async () => {
    const res = await api.get("/categories");
    setCategories(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchBrands = async () => {
    const res = await api.get("/brands");
    setBrands(res.data);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  /* ================= ATTRIBUTE HELPERS ================= */
  const addAttribute = () => {
    const name = newAttrName.trim();
    if (!name) return;
    if (attributes.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      showToast("That attribute already exists", "warning");
      return;
    }
    setAttributes((prev) => [...prev, { name, values: [] }]);
    setNewAttrName("");
    setVariants([]); // combos changed, old qty data is stale
  };

  const removeAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
    setValueDrafts((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setVariants([]);
  };

  const addValueToAttribute = (index: number) => {
    const value = (valueDrafts[index] || "").trim();
    if (!value) return;

    setAttributes((prev) =>
      prev.map((a, i) => {
        if (i !== index) return a;
        if (a.values.some((v) => v.toLowerCase() === value.toLowerCase())) {
          showToast("That value already exists", "warning");
          return a;
        }
        return { ...a, values: [...a.values, value] };
      })
    );
    setValueDrafts((prev) => ({ ...prev, [index]: "" }));
    setVariants([]);
  };

  const removeValueFromAttribute = (index: number, value: string) => {
    setAttributes((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, values: a.values.filter((v) => v !== value) } : a
      )
    );
    setVariants([]);
  };

  // All attributes must have at least one value before we generate combos
  const generatedCombos: Record<string, string>[] =
    attributes.length > 0 && attributes.every((a) => a.values.length > 0)
      ? cartesian(attributes.map((a) => a.values)).map((combo) =>
          Object.fromEntries(attributes.map((a, i) => [a.name, combo[i]]))
        )
      : [];

  const setVariantQty = (combo: Record<string, string>, qty: number) => {
    setVariants((prev) => {
      const key = JSON.stringify(combo);
      const idx = prev.findIndex((v) => JSON.stringify(v.attributes) === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty };
        return next;
      }
      return [...prev, { attributes: combo, qty }];
    });
  };

  const getVariantQty = (combo: Record<string, string>) => {
    const key = JSON.stringify(combo);
    return variants.find((v) => JSON.stringify(v.attributes) === key)?.qty ?? "";
  };

  // ================= ADD PRODUCT =================
  const addProduct = async () => {
    const formData = new FormData();

    formData.append("name", newProduct.name);
    formData.append("description", newProduct.description);
    formData.append("brand_id", String(newProduct.brand_id));
    formData.append("category_id", String(newProduct.category_id));
    formData.append("purchase_price", String(newProduct.purchase_price));
    formData.append("sale_price", String(newProduct.sale_price));
    formData.append("in_stock", String(newProduct.in_stock));
    formData.append("variants", JSON.stringify(variants));

    if (newProduct.image) {
      formData.append("image", newProduct.image as any);
    }

    await api.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    showToast("Product created successfully", "success"); // ✅ HERE
    resetNewProduct();
    fetchProducts();
    setShowModal(false);
  };
const updateProduct = async () => {
  const formData = new FormData();

  formData.append("name", editProduct.name);
  formData.append("description", editProduct.description);
  formData.append("brand_id", String(editProduct.brand_id));
  formData.append("category_id", String(editProduct.category_id));
  formData.append("purchase_price", String(editProduct.purchase_price));
  formData.append("sale_price", String(editProduct.sale_price));
  formData.append("in_stock", String(editProduct.in_stock));
  formData.append("qty", String(editProduct.qty));

  if (editProduct.image) {
    formData.append("image", editProduct.image);
  }

  await api.put(`/products/${editProduct.id}`, formData);
   showToast("Product updated successfully", "success"); // ✅ HERE

  showToast("Product updated");
  resetEditProduct();
  setEditModal(false);
  fetchProducts();
};
  // ================= DELETE =================
  const deleteProduct = async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));  showToast("Product deleted successfully", "success"); // ✅ HERE
      
    } catch (err) {
      console.log(err);
   showToast("Delete faild" );
    }
  };

  // ================= EDIT =================
 const startEdit = (p: Product) => {
  setEditProduct({
    id: p.id,
    name: p.name,
    description: p.description,
    brand_id: p.brand_id,
    category_id: p.category_id,
    image: null,
    stock: p.stock,
    qty: p.qty,
    purchase_price: p.purchase_price,
    sale_price: p.sale_price,
    in_stock: p.in_stock,
  });

  setEditModal(true);
};

// ================= RESET HELPERS =================
const resetNewProduct = () => {
  setNewProduct({
    name: "",
    description: "",
    brand_id: 0,
    category_id: 0,
    image: null,
    stock: 0,
    qty: 0,
    purchase_price: 0,
    sale_price: 0,
    in_stock: true,
  });
  setAttributes([]);
  setNewAttrName("");
  setValueDrafts({});
  setVariants([]);
};

const resetEditProduct = () => {
  setEditProduct({
    id: 0,
    name: "",
    description: "",
    brand_id: 0,
    category_id: 0,
    image: null,
    stock: 0,
    qty: 0,
    purchase_price: 0,
    sale_price: 0,
    in_stock: true,
  });
};
const addModalRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (addModalRef.current && !addModalRef.current.contains(event.target as Node)) {
      setShowModal(false);
    }
  };

  if (showModal) {
    document.addEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showModal]);
const { showToast } = useToast();

const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

const toggleSelect = (id: number) => {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};

const selectAllVisible = () => {
  const allIds = currentPageProducts.map((p) => p.id);
  setSelectedIds(new Set(allIds));
};

const clearSelection = () => {
  setSelectedIds(new Set());
};

const currentPageProducts = products.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

const downloadSelected = () => {
  const selectedProducts = products.filter((p) => selectedIds.has(p.id));

  if (selectedProducts.length === 0) {
    showToast("No products selected", "warning");
    return;
  }

  const rows = selectedProducts.map((p) => ({
    ID: p.id,
    Name: p.name,
    Brand: p.brand_name,
    Category: p.category_name,
    Qty: p.qty,
    "Purchase Price": p.purchase_price,
    "Sale Price": p.sale_price,
  }));

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => `"${(r as any)[h] ?? ""}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products-export.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
};
  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column">
        <AdminHeader />

        <div className="p-4 bg-light min-vh-100">

          {/* ================= TOP BAR ================= */}
          <div className="d-flex flex-wrap gap-2 align-items-center mb-4">

            {/* SEARCH */}
            <input
              className="form-control"
              placeholder="Search products..."
              style={{ maxWidth: 180 }}
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
            />

            {/* CATEGORY FILTER */}
            <select
              className="form-control"
              style={{ maxWidth: 180 }}
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* BRAND FILTER */}
            <select
              className="form-control"
              style={{ maxWidth: 180 }}
              value={filters.brand}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  brand: e.target.value,
                }))
              }
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* SORT */}
            <select
              className="form-control"
              style={{ maxWidth: 180 }}
              value={filters.sort}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sort: e.target.value,
                }))
              }
            >
              <option value="">Sort by</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
              <option value="price_low">Price Low</option>
              <option value="price_high">Price High</option>
            </select>

            {/* RESET BUTTON */}
            <button
              className="btn btn-outline-secondary"
              onClick={() =>
                setFilters({
                  search: "",
                  category: "",
                  brand: "",
                  sort: "",
                })
              }
            >
              Reset
            </button>

            {/* ADD BUTTON */}
            <button
              className="btn btn-primary ms-auto"
              onClick={() => setShowModal(true)}
            >
              + Add Product
            </button>

          </div>

          {/* ================= TABLE ================= */}
          <div className="card shadow-sm border-0">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>
  <input
    type="checkbox"
    checked={
      currentPageProducts.length > 0 &&
      currentPageProducts.every((p) => selectedIds.has(p.id))
    }
    onChange={(e) => {
      if (e.target.checked) selectAllVisible();
      else clearSelection();
    }}
  />
</th>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Purchase</th>
                    <th>Sale</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((p) => (
                    <tr key={p.id}>
                       <td onClick={(e) => e.stopPropagation()}>
    <input
      type="checkbox"
      checked={selectedIds.has(p.id)}
      onChange={() => toggleSelect(p.id)}
    />
  </td>
  {/* NAME */}
  <td>{p.name}</td>

  {/* BRAND */}
  <td>{p.brand_name}</td>

  {/* CATEGORY */}
  <td>{p.category_name}</td>

  {/* QTY */}
  <td>{p.qty}</td>

  {/* PURCHASE */}
  <td>{p.purchase_price} €</td>

  {/* SALE */}
  <td>{p.sale_price} €</td>

  {/* STATUS */}
  <td>
    {p.in_stock ? (
      <span className="badge bg-success">In</span>
    ) : (
      <span className="badge bg-danger">Out</span>
    )}
  </td>

  {/* ACTIONS */}
  <td style={{ position: "relative" }}>
    <button
      className="btn btn-light btn-sm"
      onClick={() =>
        setOpenMenuId(openMenuId === p.id ? null : p.id)
      }
    >
      ⋮
    </button>

    {openMenuId === p.id && (
      <div
          ref={menuRef}
        style={{
          position: "absolute",
          right: 0,
          top: "100%",
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 6,
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          zIndex: 999,
          minWidth: 140,
          padding: "5px",
        }}
      >
        <button
          className="dropdown-item"
          onClick={() => {
            startEdit(p);
            setOpenMenuId(null);
          }}
        >
          Edit
        </button>

        <button
          className="dropdown-item text-danger"
          onClick={() => setDeleteModal(p.id)}
        >
          Delete
        </button>
      </div>
    )}
  </td>
</tr>
                    ))}
                </tbody>

              </table>
            </div>
          </div>
{editModal && (
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
          resetEditProduct();
          setEditModal(false);
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

      <h5>Edit Product</h5>

      {/* NAME */}
      <input
        className="form-control my-2"
        value={editProduct.name}
        onChange={(e) =>
          setEditProduct({ ...editProduct, name: e.target.value })
        }
      />

      {/* DESCRIPTION */}
      <input
        className="form-control my-2"
        value={editProduct.description}
        onChange={(e) =>
          setEditProduct({ ...editProduct, description: e.target.value })
        }
      />

      {/* BRAND */}
      <select
        className="form-control my-2"
        value={editProduct.brand_id}
        onChange={(e) =>
          setEditProduct({
            ...editProduct,
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
        value={editProduct.category_id}
        onChange={(e) =>
          setEditProduct({
            ...editProduct,
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

      {/* QTY */}
      <input
        type="number"
        className="form-control my-2"
        value={editProduct.qty}
        onChange={(e) =>
          setEditProduct({
            ...editProduct,
            qty: Number(e.target.value),
          })
        }
      />

      {/* PRICES */}
      <input
        type="number"
        className="form-control my-2"
        value={editProduct.purchase_price}
        onChange={(e) =>
          setEditProduct({
            ...editProduct,
            purchase_price: Number(e.target.value),
          })
        }
      />

      <input
        type="number"
        className="form-control my-2"
        value={editProduct.sale_price}
        onChange={(e) =>
          setEditProduct({
            ...editProduct,
            sale_price: Number(e.target.value),
          })
        }
      />

      {/* IMAGE */}
      <input
        type="file"
        className="form-control my-2"
        onChange={(e) => {
          const file = e.target.files?.[0];
          setEditProduct({
            ...editProduct,
            image: file || null,
          });
        }}
      />

      {/* STOCK */}
      <div className="form-check my-2">
        <input
          type="checkbox"
          className="form-check-input"
          checked={editProduct.in_stock}
          onChange={(e) =>
            setEditProduct({
              ...editProduct,
              in_stock: e.target.checked,
            })
          }
        />
        <label>In Stock</label>
      </div>

      {/* ================= ATTRIBUTES ================= */}
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
              <span
                key={v}
                className="badge bg-secondary d-flex align-items-center gap-1"
              >
                {v}
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => removeValueFromAttribute(idx, v)}
                >
                  ×
                </span>
              </span>
            ))}
          </div>

          <div className="d-flex gap-2 mt-2">
            <input
              className="form-control form-control-sm"
              placeholder="Add value"
              value={valueDrafts[idx] || ""}
              onChange={(e) =>
                setValueDrafts({
                  ...valueDrafts,
                  [idx]: e.target.value,
                })
              }
              onKeyDown={(e) =>
                e.key === "Enter" && addValueToAttribute(idx)
              }
            />
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => addValueToAttribute(idx)}
            >
              Add
            </button>
          </div>
        </div>
      ))}

      {/* ================= VARIANTS ================= */}
      {generatedCombos.length > 0 && (
        <div className="mt-3">
          <h6>Variants Stock</h6>

          <table className="table table-sm">
            <thead>
              <tr>
                {attributes.map((a) => (
                  <th key={a.name}>{a.name}</th>
                ))}
                <th>Qty</th>
              </tr>
            </thead>

            <tbody>
              {generatedCombos.map((combo) => (
                <tr key={JSON.stringify(combo)}>
                  {attributes.map((a) => (
                    <td key={a.name}>{combo[a.name]}</td>
                  ))}
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={getVariantQty(combo)}
                      onChange={(e) =>
                        setVariantQty(combo, Number(e.target.value))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ACTIONS */}
      <div className="d-flex justify-content-end gap-2 mt-3">
        <button
          className="btn btn-secondary"
          onClick={() => {
            resetEditProduct();
            setEditModal(false);
          }}
        >
          Cancel
        </button>

        <button className="btn btn-primary" onClick={updateProduct}>
          Save 
        </button>
      </div>
    </div>
  </div>
)}
          {/* ================= MODAL ================= */}
        {showModal && (
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
          setShowModal(false);
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
          setNewProduct({
            ...newProduct,
            image: file || null,
          });
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

      {/* ================= ATTRIBUTES ================= */}
      <hr />
      <h6>Attributes (Variants)</h6>

      {/* ADD ATTRIBUTE */}
      <div className="d-flex gap-2 mb-2">
        <input
          className="form-control"
          placeholder="Attribute name (Color, Storage...)"
          value={newAttrName}
          onChange={(e) => setNewAttrName(e.target.value)}
        />
        <button className="btn btn-outline-primary" onClick={addAttribute}>
          + Add
        </button>
      </div>

      {/* ATTRIBUTE LIST */}
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

          {/* VALUES */}
          <div className="d-flex flex-wrap gap-2 mt-2">
            {attr.values.map((v) => (
              <span
                key={v}
                className="badge bg-secondary d-flex align-items-center gap-1"
              >
                {v}
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => removeValueFromAttribute(idx, v)}
                >
                  ×
                </span>
              </span>
            ))}
          </div>

          {/* ADD VALUE */}
          <div className="d-flex gap-2 mt-2">
            <input
              className="form-control form-control-sm"
              placeholder="Add value"
              value={valueDrafts[idx] || ""}
              onChange={(e) =>
                setValueDrafts({
                  ...valueDrafts,
                  [idx]: e.target.value,
                })
              }
              onKeyDown={(e) =>
                e.key === "Enter" && addValueToAttribute(idx)
              }
            />
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => addValueToAttribute(idx)}
            >
              Add
            </button>
          </div>
        </div>
      ))}

      {/* ================= VARIANTS ================= */}
      {generatedCombos.length > 0 && (
        <div className="mt-3">
          <h6>Variants Stock</h6>

          <table className="table table-sm">
            <thead>
              <tr>
                {attributes.map((a) => (
                  <th key={a.name}>{a.name}</th>
                ))}
                <th>Qty</th>
              </tr>
            </thead>

            <tbody>
              {generatedCombos.map((combo) => (
                <tr key={JSON.stringify(combo)}>
                  {attributes.map((a) => (
                    <td key={a.name}>{combo[a.name]}</td>
                  ))}
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={getVariantQty(combo)}
                      onChange={(e) =>
                        setVariantQty(combo, Number(e.target.value))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ACTIONS */}
      <div className="d-flex justify-content-end gap-2 mt-3">
        <button
          className="btn btn-secondary"
          onClick={() => {
            resetNewProduct();
            setShowModal(false);
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
)}
          {/* ================= PAGINATION ================= */}
          <div className="d-flex justify-content-center mt-3 gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Prev
            </button>

            <span className="align-self-center">
              Page {currentPage}
            </span>

            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={products.length < itemsPerPage}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
{selectedIds.size > 0 && (
  <div className="d-flex gap-2 mb-3 align-items-center justify-content-end">
    <span>{selectedIds.size} selected</span>

    <button className="btn btn-outline-secondary btn-sm" onClick={selectAllVisible}>
      Select All
    </button>

    <button className="btn btn-outline-secondary btn-sm" onClick={clearSelection}>
      Clear
    </button>

    <button className="btn btn-primary btn-sm" onClick={downloadSelected}>
      Download
    </button>
  </div>
)}
          {/* ================= DELETE MODAL ================= */}
       {deleteModal && (
  <div
    className="d-flex align-items-center justify-content-center"
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 99999,
    }}
    onClick={() => setDeleteModal(null)} // 👈 CLICK OUTSIDE CLOSE
  >
    <div
      className="bg-white p-4 rounded shadow"
      style={{
        width: 350,
        position: "relative",
      }}
      onClick={(e) => e.stopPropagation()} // 👈 BLOCK OUTSIDE CLICK
    >
      {/* X BUTTON */}
      <button
        onClick={() => setDeleteModal(null)}
        style={{
          position: "absolute",
          top: 10,
          right: 12,
          border: "none",
          background: "transparent",
          fontSize: 20,
          cursor: "pointer",
        }}
      >
        ×
      </button>

      <h5>Confirm Delete</h5>

      <p className="text-muted">
        Are you sure you want to delete this product?
      </p>

      <div className="d-flex justify-content-end gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => setDeleteModal(null)}
        >
          Cancel
        </button>

        <button
          className="btn btn-danger"
          onClick={async () => {
            await deleteProduct(deleteModal);
            setDeleteModal(null);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
};

export default Products;