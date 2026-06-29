
//kërkesa në API (axios / fetch)
//ruajtje në localStorage
//timers (setTimeout, setInterval)
//subscribe / unsubscribe
//logjikë që ndodh pas shfaqjes së UI
import React, { useEffect, useState } from "react";
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

type Variant = {
  size?: string;
  color?: string;
  memory?: string;
  qty: number;
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
  const [variants, setVariants] = useState<Variant[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<any>({});
  const [saleModal, setSaleModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [saleQty, setSaleQty] = useState(1);
  const [deleteModal, setDeleteModal] = useState<null | number>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    setCurrentPage(1);
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

  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [memory, setMemory] = useState<string[]>([]);

  useEffect(() => {
    const category = categories.find(
      (c) => c.id === newProduct.category_id
    );

    if (!category) return;

    const name = category.name.toLowerCase();

    // CLOTHES
    if (name.includes("cloth")) {
      setSizes(["XS", "S", "M", "L", "XL", "XXL"]);
      setColors([]);
      setMemory([]);
    }

    // SHOES
    else if (name.includes("shoe")) {
      setSizes(["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]);
      setColors([]);
      setMemory([]);
    }

    // ELECTRONICS
    else if (name.includes("electronic")) {
      setSizes([]);
      setColors(["Blue", "Silver"]);
      setMemory(["64GB", "128GB", "256GB", "512GB", "1TB"]);
    }

    // DEFAULT
    else {
      setSizes([]);
      setColors([]);
      setMemory([]);
    }

    // Reset variants when category changes
    setVariants([]);
  }, [newProduct.category_id, categories]);

  // ================= VARIANT HELPER =================
  const setVariantQty = (
    key: { size?: string; color?: string; memory?: string },
    qty: number
  ) => {
    setVariants((prev) => {
      const idx = prev.findIndex(
        (v) => v.size === key.size && v.color === key.color && v.memory === key.memory
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty };
        return next;
      }
      return [...prev, { ...key, qty }];
    });
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

    setVariants([]);
    fetchProducts();
    setShowModal(false);
  };

  // ================= DELETE =================
  const deleteProduct = async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.log(err);
   showToast("Delete faild");
    }
  };

  // ================= EDIT =================
  const startEdit = (p: any) => {
    setEditId(p.id);
    setEditValue({
      name: p.name,
      description: p.description,
      brand_id: p.brand_id,
      category_id: p.category_id,
      image: p.image,
      qty: p.qty,
      purchase_price: p.purchase_price,
      sale_price: p.sale_price,
      in_stock: p.in_stock,
    });
  };

  const saveEdit = async () => {
    await api.put(`/products/${editId}`, editValue);
    setEditId(null);
    fetchProducts();
  };
const { showToast } = useToast();
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

                        {/* NAME */}
                        <td>
                          {editId === p.id ? (
                            <input
                              className="form-control"
                              value={editValue.name}
                              onChange={(e) =>
                                setEditValue({ ...editValue, name: e.target.value })
                              }
                            />
                          ) : (
                            p.name
                          )}
                        </td>

                        {/* BRAND */}
                        <td>{p.brand_name}</td>

                        {/* CATEGORY */}
                        <td>
                          {editId === p.id ? (
                            <select
                              className="form-control"
                              value={editValue.category_id}
                              onChange={(e) =>
                                setEditValue({
                                  ...editValue,
                                  category_id: Number(e.target.value),
                                })
                              }
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            p.category_name
                          )}
                        </td>

                        {/* QTY */}
                        <td>
                          {editId === p.id ? (
                            <input
                              type="number"
                              className="form-control"
                              value={editValue.qty ?? 0}
                              onChange={(e) =>
                                setEditValue({
                                  ...editValue,
                                  qty: Number(e.target.value),
                                })
                              }
                            />
                          ) : (
                            p.qty !== undefined && p.qty !== null ? p.qty : "-"
                          )}
                        </td>

                        {/* PURCHASE PRICE */}
                        <td>
                          {editId === p.id ? (
                            <input
                              type="number"
                              className="form-control"
                              value={editValue.purchase_price}
                              onChange={(e) =>
                                setEditValue({
                                  ...editValue,
                                  purchase_price: Number(e.target.value),
                                })
                              }
                            />
                          ) : (
                            `${p.purchase_price} €`
                          )}
                        </td>

                        {/* SALE PRICE */}
                        <td>
                          {editId === p.id ? (
                            <input
                              type="number"
                              className="form-control"
                              value={editValue.sale_price}
                              onChange={(e) =>
                                setEditValue({
                                  ...editValue,
                                  sale_price: Number(e.target.value),
                                })
                              }
                            />
                          ) : (
                            `${p.sale_price} €`
                          )}
                        </td>

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
                          {/* 3 DOT BUTTON */}
                          <button
                            className="btn btn-light btn-sm"
                            onClick={() =>
                              setOpenMenuId(openMenuId === p.id ? null : p.id)
                            }
                          >
                            ⋮
                          </button>

                          {/* DROPDOWN MENU */}
                          {openMenuId === p.id && (
                            <div
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
                              {editId === p.id ? (
                                <SaveButton
                                  onClick={() => {
                                    saveEdit();
                                    setOpenMenuId(null);
                                  }}
                                />
                              ) : (
                                <button
                                  className="dropdown-item"
                                  onClick={() => {
                                    startEdit(p);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  Edit
                                </button>
                              )}

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

          {/* ================= MODAL ================= */}
          {showModal && (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
              }}
            >
              <div className="bg-white p-4 rounded" style={{ width: 550, maxHeight: "90vh", overflowY: "auto" }}>

                <h5>Add Product</h5>

                <input
                  className="form-control my-2"
                  placeholder="Name"
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                />

                <input
                  className="form-control my-2"
                  placeholder="Description"
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, description: e.target.value })
                  }
                />

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

                <input
                  type="number"
                  className="form-control my-2"
                  placeholder="Purchase Price"
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
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      sale_price: Number(e.target.value),
                    })
                  }
                />

                <div className="form-check my-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        in_stock: e.target.checked,
                      })
                    }
                  />
                  <label>In Stock</label>
                </div>

                {/* ================= CLOTHES / SHOES: size + qty per size ================= */}
                {sizes.length > 0 && (
                  <div className="mt-2">
                    <label>Sizes & Qty</label>
                    <div className="d-flex flex-wrap gap-2 mt-1">
                      {sizes.map((s) => {
                        const v = variants.find((x) => x.size === s);
                        return (
                          <div
                            key={s}
                            className="d-flex align-items-center gap-1 border rounded px-2 py-1"
                          >
                            <span style={{ minWidth: 28 }}>{s}</span>
                            <input
                              type="number"
                              min={0}
                              style={{ width: 56 }}
                              className="form-control form-control-sm"
                              placeholder="qty"
                              value={v?.qty ?? ""}
                              onChange={(e) =>
                                setVariantQty({ size: s }, Number(e.target.value))
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ================= ELECTRONICS: memory x color grid ================= */}
                {memory.length > 0 && colors.length > 0 && (
                  <div className="mt-2">
                    <label>Memory × Color Qty</label>
                    <table className="table table-sm mt-1">
                      <thead>
                        <tr>
                          <th></th>
                          {colors.map((c) => (
                            <th key={c}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {memory.map((m) => (
                          <tr key={m}>
                            <td><strong>{m}</strong></td>
                            {colors.map((c) => {
                              const v = variants.find(
                                (x) => x.memory === m && x.color === c
                              );
                              return (
                                <td key={c}>
                                  <input
                                    type="number"
                                    min={0}
                                    style={{ width: 64 }}
                                    className="form-control form-control-sm"
                                    placeholder="0"
                                    value={v?.qty ?? ""}
                                    onChange={(e) =>
                                      setVariantQty(
                                        { memory: m, color: c },
                                        Number(e.target.value)
                                      )
                                    }
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={addProduct}
                  >
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

          {/* ================= DELETE MODAL ================= */}
          {deleteModal && (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 9999,
              }}
            >
              <div className="bg-white p-4 rounded shadow" style={{ width: 350 }}>

                <h5>Confirm Delete</h5>

                <p>Are you sure you want to delete this product?</p>

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
