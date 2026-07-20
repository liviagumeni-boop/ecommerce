import React, { useEffect, useState } from "react";
import Sidebar from "../../../layout/sidebar";
import AdminHeader from "../../../layout/headeradmin";
import api from "../../../api/axios";
import { useToast } from "../../../componets/common/ToastContext";
/* ================= TYPES ================= */
type Category = {
  id: number;
  name: string;
};

type Brand = {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
};

const Categories: React.FC = () => {
  const { showToast } = useToast();
  /* ================= STATES ================= */
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);

  const [newCategory, setNewCategory] = useState("");
  const [newBrand, setNewBrand] = useState({ name: "", category_id: 0 });
const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
const [showEditBrandModal, setShowEditBrandModal] = useState(false);

const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
const [editCategoryValue, setEditCategoryValue] = useState("");

const [editBrandId, setEditBrandId] = useState<number | null>(null);
const [editBrandValue, setEditBrandValue] = useState("");
const [editBrandCategory, setEditBrandCategory] = useState(0);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "category" | "brand" | null;
    id: number | null;
  }>({ type: null, id: null });

  const [categoryPage, setCategoryPage] = useState(1);
  const [brandPage, setBrandPage] = useState(1);

const [openMenu, setOpenMenu] = useState<{
  id: number | null;
  type: "category" | "brand" | null;
} | null>(null);

  /* ================= CLOSE MENU ON OUTSIDE CLICK ================= */
useEffect(() => {
  const close = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    if (!target.closest(".action-menu")) {
      setOpenMenu(null);
    }
  };

  document.addEventListener("mousedown", close);

  return () => {
    document.removeEventListener("mousedown", close);
  };
}, []);

  /* ================= LOAD ================= */
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

  /* ================= CATEGORY CRUD ================= */
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await api.post("/categories", { name: newCategory });
    showToast("Category created", "success");
    setNewCategory("");
    setShowCategoryModal(false);
    fetchCategories();
  };

  const updateCategory = async () => {
    if (!editCategoryId) return;
    await api.put(`/categories/${editCategoryId}`, { name: editCategoryValue });
    showToast("Category updated", "success");
    setEditCategoryId(null);
    setEditCategoryValue("");
    fetchCategories();
  };

  const deleteCategory = async (id: number) => {
    await api.delete(`/categories/${id}`);
    showToast("Category deleted", "success");
    setDeleteConfirm({ type: null, id: null });
    fetchCategories();
  };

  /* ================= BRAND CRUD ================= */
  const addBrand = async () => {
    if (!newBrand.name || !newBrand.category_id) return;
    await api.post("/brands", newBrand);
    showToast("Brand created", "success");
    setNewBrand({ name: "", category_id: 0 });
    setShowBrandModal(false);
    fetchBrands();
  };

  const updateBrand = async () => {
    if (!editBrandId) return;
    await api.put(`/brands/${editBrandId}`, {
      name: editBrandValue,
      category_id: brands.find((b) => b.id === editBrandId)?.category_id,
    });
    showToast("Brand updated", "success");
    setEditBrandId(null);
    setEditBrandValue("");
    fetchBrands();
  };

  const deleteBrand = async (id: number) => {
    await api.delete(`/brands/${id}`);
    showToast("Brand deleted", "success");
    setDeleteConfirm({ type: null, id: null });
    fetchBrands();
  };

  /* ================= RESET HELPERS ================= */
  const resetNewCategory = () => {
    setNewCategory("");
  };

  const resetNewBrand = () => {
    setNewBrand({ name: "", category_id: 0 });
  };

  const resetEditCategory = () => {
    setEditCategoryId(null);
    setEditCategoryValue("");
  };

  const resetEditBrand = () => {
    setEditBrandId(null);
    setEditBrandValue("");
    setEditBrandCategory(0);
  };

  /* ================= DROPDOWN STYLE ================= */
const dropdownStyle: React.CSSProperties = {
    position: "absolute",
  top: "calc(100% + 4px)",
  right: "0",
  width: "140px",
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: "6px",
  boxShadow: "0 10px 25px rgba(0,0,0,.25)",
  zIndex: 999999,
  overflow: "hidden",
};

const closeBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: "10px",
  right: "12px",
  border: "none",
  background: "transparent",
  fontSize: "20px",
  cursor: "pointer",
};

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column">
        <AdminHeader />

        <div className="p-4 bg-light min-vh-100">

          {/* ================= CATEGORY TOP BAR ================= */}
          <div className="d-flex justify-content-between mb-3">
            <h5>Categories</h5>
            <button className="btn btn-primary" onClick={() => setShowCategoryModal(true)}>
              + Add Category
            </button>
          </div>

          {/* ================= CATEGORY TABLE ================= */}
          <div className="card mb-4">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th  style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories
                  .slice((categoryPage - 1) * 5, categoryPage * 5)
                  .map((c) => (
                    <tr key={c.id}>
                      <td>
                      {c.name}
                      </td>
                 <td style={{ textAlign: "right" }}>
  <div  className="action-menu"
    style={{
      position: "relative",
      display: "inline-block",
    }}
  >
    {/* 3 DOT BUTTON */}
    <button
      className="btn btn-light btn-sm"
      onClick={(e) => {
        e.stopPropagation();
        setOpenMenu({
          id: c.id,
          type: "category",
        });
      }}
    >
      ⋮
    </button>

    {/* DROPDOWN */}
    {openMenu?.id === c.id && openMenu.type === "category" && (
      <div
        onClick={(e) => e.stopPropagation()}
        style={dropdownStyle}
      >
        <button
        type="button"
  className="dropdown-item w-100 text-start"
          onClick={() => {
            setEditCategoryId(c.id);
            setEditCategoryValue(c.name);
            setShowEditCategoryModal(true);
            setOpenMenu(null);
          }}
        >
          Edit
        </button>

        <button
        type="button"
  className="dropdown-item text-danger w-100 text-start"
          onClick={() => {
            setDeleteConfirm({ type: "category", id: c.id });
            setOpenMenu(null);
          }}
        >
          Delete
        </button>
      </div>
    )}
  </div>
</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* CATEGORY PAGINATION */}
            <div className="d-flex justify-content-center mt-3 gap-2 pb-3">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={categoryPage === 1}
                onClick={() => setCategoryPage((p) => p - 1)}
              >
                Prev
              </button>
              <span>Page {categoryPage}</span>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={categories.length <= categoryPage * 5}
                onClick={() => setCategoryPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>

          {/* ================= BRANDS SECTION ================= */}
          <div className="d-flex justify-content-between mb-2">
            <h5>Brands</h5>
            <button className="btn btn-dark" onClick={() => setShowBrandModal(true)}>
              + Add Brand
            </button>
          </div>

          <div className="card">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands
                  .slice((brandPage - 1) * 10, brandPage * 10)
                  .map((b) => (
                    <tr key={b.id}>
                      <td>
                       {b.name}
                      </td>
                      <td>
                        {categories.find((c) => c.id === b.category_id)?.name || "-"}
                      </td>
           <td style={{ textAlign: "right" }}>
  <div  className="action-menu"
    style={{
      position: "relative",
      display: "inline-block",
    }}
  >
    {/* 3 DOT BUTTON */}
    <button
      className="btn btn-light btn-sm"
      onClick={(e) => {
        e.stopPropagation();
        setOpenMenu({
          id: b.id,
          type: "brand",
        });
      }}
    >
      ⋮
    </button>

    {/* DROPDOWN */}
    {openMenu?.id === b.id && openMenu.type === "brand" && (
      <div
        onClick={(e) => e.stopPropagation()}
        style={dropdownStyle}
      >
        <button
          className="dropdown-item"
          onClick={() => {
            setEditBrandId(b.id);
            setEditBrandValue(b.name);
            setEditBrandCategory(b.category_id);
            setShowEditBrandModal(true);
            setOpenMenu(null);
          }}
        >
          Edit
        </button>

        <button
          className="dropdown-item text-danger"
          onClick={() => {
            setDeleteConfirm({ type: "brand", id: b.id });
            setOpenMenu(null);
          }}
        >
          Delete
        </button>
      </div>
    )}
  </div>
</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* BRAND PAGINATION */}
            <div className="d-flex justify-content-center mt-3 gap-2 pb-3">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={brandPage === 1}
                onClick={() => setBrandPage((p) => p - 1)}
              >
                Prev
              </button>
              <span>Page {brandPage}</span>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={brands.length <= brandPage * 10}
                onClick={() => setBrandPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        {showEditBrandModal && (
  <div
    className="d-flex align-items-center justify-content-center"
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 99999999,
    }}
    onClick={() => setShowEditBrandModal(false)}
  >
    <div
      className="bg-white p-4 rounded shadow"
      style={{ width: 400, position: "relative" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        style={closeBtnStyle}
        onClick={() => {
          resetEditBrand();
          setShowEditBrandModal(false);
        }}
      >
        ×
      </button>

      <h5>Edit Brand</h5>

      <input
        className="form-control mb-3"
        value={editBrandValue}
        onChange={(e) => setEditBrandValue(e.target.value)}
      />

      <select
        className="form-control mb-3"
        value={editBrandCategory}
        onChange={(e) => setEditBrandCategory(Number(e.target.value))}
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="d-flex justify-content-end gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => {
            resetEditBrand();
            setShowEditBrandModal(false);
          }}
        >
          Cancel
        </button>

        <button
          className="btn btn-primary"
          onClick={async () => {
            await api.put(`/brands/${editBrandId}`, {
              name: editBrandValue,
              category_id: editBrandCategory,
            });

            resetEditBrand();
            setShowEditBrandModal(false);
            fetchBrands();
          }}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
{showEditCategoryModal && (
  <div
    className="d-flex align-items-center justify-content-center"
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 99999999,
    }}
    onClick={() => setShowEditCategoryModal(false)}
  >
    <div
      className="bg-white p-4 rounded shadow"
      style={{ width: 400, position: "relative" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        style={closeBtnStyle}
        onClick={() => {
          resetEditCategory();
          setShowEditCategoryModal(false);
        }}
      >
        ×
      </button>

      <h5>Edit Category</h5>

      <input
        className="form-control my-3"
        value={editCategoryValue}
        onChange={(e) => setEditCategoryValue(e.target.value)}
      />

      <div className="d-flex justify-content-end gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => {
            resetEditCategory();
            setShowEditCategoryModal(false);
          }}
        >
          Cancel
        </button>

        <button
          className="btn btn-primary"
          onClick={async () => {
            await updateCategory();
            setShowEditCategoryModal(false);
          }}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
          {/* ================= CATEGORY MODAL ================= */}
       {showCategoryModal && (
  <div
    className="d-flex align-items-center justify-content-center"
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 9999,
    }}
    onClick={() => setShowCategoryModal(false)}
  >
    <div
      className="bg-white p-4 rounded shadow"
      style={{ width: "400px", position: "relative" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button style={closeBtnStyle} onClick={() => setShowCategoryModal(false)}>
        ×
      </button>

      <h5 className="mb-3">Add Category</h5>

      <input
        className="form-control mb-3"
        placeholder="Category name..."
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
      />

      <div className="d-flex justify-content-end gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => {
            resetNewCategory();
            setShowCategoryModal(false);
          }}
        >
          Cancel
        </button>

        <button className="btn btn-primary" onClick={addCategory}>
          Save
        </button>
      </div>
    </div>
  </div>
)}

          {/* ================= BRAND MODAL ================= */}
       {showBrandModal && (
  <div
    className="d-flex align-items-center justify-content-center"
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 9999,
    }}
    onClick={() => setShowBrandModal(false)}
  >
    <div
      className="bg-white p-4 rounded shadow"
      style={{ width: "400px", position: "relative" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button style={closeBtnStyle} onClick={() => setShowBrandModal(false)}>
        ×
      </button>

      <h5 className="mb-3">Add Brand</h5>

      <input
        className="form-control mb-3"
        placeholder="Brand name..."
        value={newBrand.name}
        onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
      />

      <select
        className="form-control mb-3"
        value={newBrand.category_id}
        onChange={(e) =>
          setNewBrand({ ...newBrand, category_id: Number(e.target.value) })
        }
      >
        <option value="">Select Category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="d-flex justify-content-end gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => {
            resetNewBrand();
            setShowBrandModal(false);
          }}
        >
          Cancel
        </button>

        <button className="btn btn-primary" onClick={addBrand}>
          Save
        </button>
      </div>
    </div>
  </div>
)}

          {/* ================= DELETE CONFIRM ================= */}
   {deleteConfirm.id && (
  <div
    onClick={() => setDeleteConfirm({ type: null, id: null })}
    className="d-flex align-items-center justify-content-center"
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 9999,
    }}
  >
    {/* MODAL BOX */}
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white p-4 rounded shadow"
      style={{
        width: "350px",
        position: "relative",
      }}
    >
      {/* X BUTTON */}
      <button
        style={{
          position: "absolute",
          top: "10px",
          right: "12px",
          border: "none",
          background: "transparent",
          fontSize: "20px",
          cursor: "pointer",
        }}
        onClick={() => setDeleteConfirm({ type: null, id: null })}
      >
        ×
      </button>

      {/* CONTENT */}
      <h5 className="mb-3">Are you sure?</h5>
      <p className="text-muted">This action cannot be undone.</p>

      {/* ACTION BUTTONS */}
      <div className="d-flex justify-content-end gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => setDeleteConfirm({ type: null, id: null })}
        >
          Cancel
        </button>

        <button
          className="btn btn-danger"
          onClick={() => {
            deleteConfirm.type === "category"
              ? deleteCategory(deleteConfirm.id!)
              : deleteBrand(deleteConfirm.id!);
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

export default Categories;
