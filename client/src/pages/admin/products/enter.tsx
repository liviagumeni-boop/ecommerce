import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../../../layout/sidebar";
import AdminHeader from "../../../layout/headeradmin";
import DateRangeFilter from "../../../componets/common/datarange";
import api from "../../../api/axios";
import { useToast } from "../../../componets/common/ToastContext";
import { FaEye, FaTrash, FaPlus, FaChevronDown, FaChevronRight } from "react-icons/fa";
/* ================= TYPES ================= */

type ProductVariant = {
  id: number;
  product_id: number;
  size: string | null;
  color: string | null;
  memory: string | null;
  qty: number;
};

type ProductSearchResult = {
  id: number;
  name: string;
  qty: number;
  variants: ProductVariant[];
};

type Supplier = {
  id: number;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
};

// One row in the list = ONE BILL (a whole "New Stock Entry" submission),
// not one product. item_count / total_quantity / product_names are
// aggregates across every product in that bill.
type BillRow = {
  bill_id: number;
    ent_id: number | string; 
  supplier_id: number | null;
  supplier_name: string;
  contact: string | null;
  created_by: number | null;
  created_at: string;
  item_count: number;
  total_quantity: number;
  product_names: string;
};

type BillItem = {
  id: number;
  ent_id: number | string; // ✅ ADD THIS
  product_id: number;
  variant_id: number | null;
  quantity: number;
  product_name: string;
  product_description?: string;
  size: string | null;
  color: string | null;
  memory: string | null;
};
type BillDetail = {
  id: number;
  supplier_id: number | null;
  supplier_name: string;
  contact: string | null;
  created_by: number | null;
  created_at: string;
  supplier_table_name?: string;
  supplier_contact_name?: string;
  supplier_phone?: string;
  supplier_email?: string;
  supplier_address?: string;
  items: BillItem[];
};

// One product picked into the "cart" for this submission.
// If the product has variants, `variantQty` holds qty per variant_id.
// If not, `qty` is used directly.
type DraftItem = {
  product: ProductSearchResult;
  variantQty: Record<number, number>; // variant_id -> qty
  qty: number; // used only when product has no variants
};

/* ================= NEW-PRODUCT (dynamic attributes) TYPES ================= */
// Mirrors Products.tsx: an "attribute" is e.g. { name: "Color", values: ["Red","Blue"] }
type Attribute = {
  name: string;
  values: string[];
};

// A combo-based variant used only while building the "Add Product" form.
type NewProductVariant = {
  attributes: Record<string, string>;
  qty: number;
};

const cartesian = (arrays: string[][]): string[][] => {
  if (arrays.length === 0) return [];
  return arrays.reduce<string[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]]
  );
};

const variantLabel = (v: { size: string | null; color: string | null; memory: string | null }) =>
  [v.size, v.color, v.memory].filter(Boolean).join(" / ") || "Default";

const Entries: React.FC = () => {
  const { showToast } = useToast();

  /* ================= LIST STATE ================= */
  const [rows, setRows] = useState<BillRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [listSearch, setListSearch] = useState("");
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
  const limit = 12;

  /* ================= EXPANDED BILL (inline items) ================= */
  const [expandedBillId, setExpandedBillId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<number, BillItem[]>>({});
  const [expandLoading, setExpandLoading] = useState<number | null>(null);

  /* ================= ADD MODAL STATE ================= */
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [supplierId, setSupplierId] = useState<number | null>(null);

  const [supplierQuery, setSupplierQuery] = useState("");
  const [supplierResults, setSupplierResults] = useState<Supplier[]>([]);
  const [showSupplierResults, setShowSupplierResults] = useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
  const [showProductResults, setShowProductResults] = useState(false);

  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  /* ================= DETAIL MODAL STATE ================= */
  const [detailEntry, setDetailEntry] = useState<BillDetail | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  /* ================= ADD PRODUCT MODAL STATE ================= */
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    brand_id: 0,
    category_id: 0,
    image: null as File | null,
    purchase_price: 0,
    sale_price: 0,
    in_stock: true,
  });

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newAttrName, setNewAttrName] = useState("");
  const [valueDrafts, setValueDrafts] = useState<Record<number, string>>({});
  const [newProductVariants, setNewProductVariants] = useState<NewProductVariant[]>([]);
  const [savingNewProduct, setSavingNewProduct] = useState(false);

  const [deleteEntry, setDeleteEntry] = useState<BillRow | null>(null);

  /* ================= FETCH LIST ================= */
  const fetchEntries = async () => {
    try {
     const res = await api.get("/stock-entries", {
  params: {
    page,
    limit,
    search: listSearch,
    startDate,
    endDate,
  },
});
      setRows(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.log(err);
      showToast("Failed to load stock entries", "error" as any);
    }
  };

useEffect(() => {
  fetchEntries();
}, [page, listSearch, startDate, endDate]);

  /* ================= FETCH BRANDS / CATEGORIES (for Add Product form) ================= */
  const fetchBrands = async () => {
    try {
      const res = await api.get("/brands");
      setBrands(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);

  /* ================= PRODUCT SEARCH (debounced) ================= */
  useEffect(() => {
    if (!productQuery.trim()) {
      setProductResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/products/search", { params: { q: productQuery } });
        setProductResults(res.data);
        setShowProductResults(true);
      } catch (err) {
        console.log(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productQuery]);

  /* ================= SUPPLIER SEARCH (debounced) ================= */
  useEffect(() => {
    if (!supplierQuery.trim()) {
      setSupplierResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/suppliers/search", { params: { q: supplierQuery } });
        setSupplierResults(res.data);
        setShowSupplierResults(true);
      } catch (err) {
        console.log(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [supplierQuery]);

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close the "New Entry" modal because of a click that's actually
      // happening inside the "Add Product" modal stacked on top of it.
      if (showAddProductModal) return;
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false);
      }
    };
    if (showModal) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModal, showAddProductModal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailRef.current && !detailRef.current.contains(event.target as Node)) {
        setDetailEntry(null);
      }
    };
    if (detailEntry) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [detailEntry]);

  /* ================= SUPPLIER PICK ================= */
  const pickSupplier = (s: Supplier) => {
    setSupplierId(s.id);
    setSupplierName(s.name);
    setSupplierContact(s.phone || s.email || "");
    setSupplierQuery(s.name);
    setShowSupplierResults(false);
  };

  /* ================= PRODUCT PICK ================= */
  const pickProduct = (p: ProductSearchResult) => {
    if (draftItems.some((d) => d.product.id === p.id)) {
      showToast("Product already added", "warning" as any);
      setShowProductResults(false);
      setProductQuery("");
      return;
    }
    setDraftItems((prev) => [
      ...prev,
      {
        product: p,
        variantQty: {},
        qty: 1,
      },
    ]);
    setProductQuery("");
    setProductResults([]);
    setShowProductResults(false);
  };

  const removeDraftItem = (productId: number) => {
    setDraftItems((prev) => prev.filter((d) => d.product.id !== productId));
  };

  const setVariantQty = (productId: number, variantId: number, qty: number) => {
    setDraftItems((prev) =>
      prev.map((d) =>
        d.product.id === productId
          ? { ...d, variantQty: { ...d.variantQty, [variantId]: qty } }
          : d
      )
    );
  };

  const setPlainQty = (productId: number, qty: number) => {
    setDraftItems((prev) =>
      prev.map((d) => (d.product.id === productId ? { ...d, qty } : d))
    );
  };

  /* ================= NEW PRODUCT: ATTRIBUTE HELPERS ================= */
  const addAttribute = () => {
    const name = newAttrName.trim();
    if (!name) return;
    if (attributes.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      showToast("That attribute already exists", "warning" as any);
      return;
    }
    setAttributes((prev) => [...prev, { name, values: [] }]);
    setNewAttrName("");
    setNewProductVariants([]);
  };

  const removeAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
    setValueDrafts((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setNewProductVariants([]);
  };

  const addValueToAttribute = (index: number) => {
    const value = (valueDrafts[index] || "").trim();
    if (!value) return;

    setAttributes((prev) =>
      prev.map((a, i) => {
        if (i !== index) return a;
        if (a.values.some((v) => v.toLowerCase() === value.toLowerCase())) {
          showToast("That value already exists", "warning" as any);
          return a;
        }
        return { ...a, values: [...a.values, value] };
      })
    );
    setValueDrafts((prev) => ({ ...prev, [index]: "" }));
    setNewProductVariants([]);
  };

  const removeValueFromAttribute = (index: number, value: string) => {
    setAttributes((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, values: a.values.filter((v) => v !== value) } : a
      )
    );
    setNewProductVariants([]);
  };

  const generatedCombos: Record<string, string>[] =
    attributes.length > 0 && attributes.every((a) => a.values.length > 0)
      ? cartesian(attributes.map((a) => a.values)).map((combo) =>
          Object.fromEntries(attributes.map((a, i) => [a.name, combo[i]]))
        )
      : [];

  const setNewProductVariantQty = (combo: Record<string, string>, qty: number) => {
    setNewProductVariants((prev) => {
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

  const getNewProductVariantQty = (combo: Record<string, string>) => {
    const key = JSON.stringify(combo);
    return newProductVariants.find((v) => JSON.stringify(v.attributes) === key)?.qty ?? "";
  };

  const resetNewProduct = () => {
    setNewProduct({
      name: "",
      description: "",
      brand_id: 0,
      category_id: 0,
      image: null,
      purchase_price: 0,
      sale_price: 0,
      in_stock: true,
    });
    setAttributes([]);
    setNewAttrName("");
    setValueDrafts({});
    setNewProductVariants([]);
  };
const [selectedBills, setSelectedBills] = useState<Set<number>>(new Set());
const toggleSelectBill = (id: number) => {
  setSelectedBills((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};

const selectAllVisible = () => {
  const allIds = rows.map((r) => r.bill_id);
  setSelectedBills(new Set(allIds));
};

const clearSelection = () => {
  setSelectedBills(new Set());
};
  /* ================= ADD PRODUCT (from Stock Entry) ================= */
  // Same create call as Products.tsx's addProduct, then re-queries
  // /products/search so we get back the exact shape pickProduct expects
  // (with real variant ids), and drops it straight into the draft list.
  const addProductForEntry = async () => {
    if (!newProduct.name.trim()) {
      showToast("Product name is required", "warning" as any);
      return;
    }

    setSavingNewProduct(true);
    try {
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("description", newProduct.description);
      formData.append("brand_id", String(newProduct.brand_id));
      formData.append("category_id", String(newProduct.category_id));
      formData.append("purchase_price", String(newProduct.purchase_price));
      formData.append("sale_price", String(newProduct.sale_price));
      formData.append("in_stock", String(newProduct.in_stock));
      formData.append("variants", JSON.stringify(newProductVariants));

      if (newProduct.image) {
        formData.append("image", newProduct.image as any);
      }

      await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Product created successfully", "success");

      // Pull the freshly created product back via the same search endpoint
      // the picker uses, so variant ids / qty are in the right shape.
      try {
        const res = await api.get("/products/search", { params: { q: newProduct.name } });
        const created: ProductSearchResult | undefined = (res.data || []).find(
          (p: ProductSearchResult) => p.name.toLowerCase() === newProduct.name.trim().toLowerCase()
        ) || res.data?.[0];

        if (created) {
          pickProduct(created);
        }
      } catch (err) {
        console.log(err);
      }

      resetNewProduct();
      setShowAddProductModal(false);
    } catch (err) {
      console.log(err);
      showToast("Failed to create product", "error" as any);
    } finally {
      setSavingNewProduct(false);
    }
  };

  /* ================= RESET ================= */
  const resetForm = () => {
    setSupplierName("");
    setSupplierContact("");
    setSupplierId(null);
    setSupplierQuery("");
    setSupplierResults([]);
    setProductQuery("");
    setProductResults([]);
    setDraftItems([]);
  };

  /* ================= SUBMIT (creates ONE bill with all items) ================= */
  const submitEntry = async () => {
    if (!supplierName.trim()) {
      showToast("Supplier name is required", "warning" as any);
      return;
    }
    if (draftItems.length === 0) {
      showToast("Add at least one product", "warning" as any);
      return;
    }

    // Flatten draft items into individual line-items for the API.
    // The backend groups all of these under ONE bill_id.
    const items: { product_id: number; variant_id: number | null; quantity: number }[] = [];

    for (const d of draftItems) {
      if (d.product.variants.length > 0) {
        for (const v of d.product.variants) {
          const q = d.variantQty[v.id] || 0;
          if (q > 0) items.push({ product_id: d.product.id, variant_id: v.id, quantity: q });
        }
      } else {
        if (d.qty > 0) items.push({ product_id: d.product.id, variant_id: null, quantity: d.qty });
      }
    }

    if (items.length === 0) {
      showToast("Set a quantity greater than 0 for at least one item", "warning" as any);
      return;
    }

    try {
      await api.post("/stock-entries", {
        supplier_id: supplierId,
        supplier_name: supplierName,
        contact: supplierContact,
        items,
      });

      showToast("Stock entry saved successfully", "success");
      resetForm();
      setShowModal(false);
      setPage(1);
      fetchEntries();
    } catch (err) {
      console.log(err);
      showToast("Failed to save stock entry", "error" as any);
    }
  };

  /* ================= EXPAND / COLLAPSE A BILL'S ITEMS ================= */
  const toggleExpand = async (billId: number) => {
    if (expandedBillId === billId) {
      setExpandedBillId(null);
      return;
    }

    setExpandedBillId(billId);

    if (!expandedItems[billId]) {
      setExpandLoading(billId);
      try {
        const res = await api.get(`/stock-entries/${billId}`);
        setExpandedItems((prev) => ({ ...prev, [billId]: res.data.items || [] }));
      } catch (err) {
        console.log(err);
        showToast("Failed to load bill items", "error" as any);
      } finally {
        setExpandLoading(null);
      }
    }
  };

  /* ================= FULL DETAIL MODAL ================= */
  const openDetail = async (id: number) => {
    try {
      const res = await api.get(`/stock-entries/${id}`);
      setDetailEntry(res.data);
    } catch (err) {
      console.log(err);
      showToast("Failed to load entry detail", "error" as any);
    }
  };

  const deleteStockEntry = async (id: number) => {
    try {
      await api.delete(`/stock-entries/${id}`);

      showToast("Bill deleted successfully", "success");

      setDeleteEntry(null);
      if (expandedBillId === id) setExpandedBillId(null);

      fetchEntries();
    } catch (err) {
      console.log(err);
      showToast("Failed to delete bill", "error");
    }
  };
const downloadSelected = async () => {
  try {
    const ids = Array.from(selectedBills);

    if (ids.length === 0) {
      showToast("No bills selected", "warning" as any);
      return;
    }

    const responses = await Promise.all(
      ids.map((id) => api.get(`/stock-entries/${id}`))
    );

    const bills = responses.map((r) => r.data);

    const rows: any[] = [];

    bills.forEach((bill) => {
      bill.items.forEach((item: any) => {
        rows.push({
          BillID: bill.id,
          ENT_ID: item.ent_id || bill.ent_id || "",   // 🔥 FIX HERE
          Date: new Date(bill.created_at).toLocaleString(),
          Supplier: bill.supplier_name,
          Contact: bill.contact || "",

          LinkedSupplier: bill.supplier_table_name || "",
          SupplierContactPerson: bill.supplier_contact_name || "",
          SupplierPhone: bill.supplier_phone || "",
          SupplierEmail: bill.supplier_email || "",
          SupplierAddress: bill.supplier_address || "",

          Product: item.product_name,
          Variant:
            item.size || item.color || item.memory
              ? [item.size, item.color, item.memory].filter(Boolean).join(" / ")
              : "",

          Quantity: item.quantity,
        });
      });
    });

    const headers = Object.keys(rows[0] || {});
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
    a.download = "stock-entries-full-export.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.log(err);
    showToast("Export failed", "error" as any);
  }
};
useEffect(() => {
  fetchEntries();
}, [page, listSearch, startDate, endDate]);
  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column">
        <AdminHeader />

        <div className="p-4 bg-light min-vh-100">
          {/* ================= TOP BAR ================= */}
          <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
          

            <input
              className="form-control"
              style={{ maxWidth: 220 }}
              placeholder="Search product or supplier..."
              value={listSearch}
              onChange={(e) => {
                setListSearch(e.target.value);
                setPage(1);
              }}
            />
   <DateRangeFilter
     startDate={startDate}
     endDate={endDate}
     onChange={(start: string, end: string) => {
       setStartDate(start);
       setEndDate(end);
       setPage(1);
     }}
   />

  {(startDate || endDate) && (
    <button
      className="btn btn-outline-secondary btn-sm"
      onClick={() => {
        setStartDate("");
        setEndDate("");
        setPage(1);
      }}
    >
      Clear
    </button>
            )}
            <button className="btn btn-primary ms-auto" onClick={() => setShowModal(true)}>
              + New Entry
            </button>
          </div>

          {/* ================= TABLE (one row per BILL) ================= */}
          <div className="card shadow-sm border-0">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>
  <input
    type="checkbox"
    checked={rows.length > 0 && selectedBills.size === rows.length}
    onChange={(e) => {
      if (e.target.checked) selectAllVisible();
      else clearSelection();
    }}
  />
</th>
                    <th>Id</th>
                     
                    <th>Date</th>
                    <th>Products</th>
                    <th>Items</th>
                    <th>Total Qty</th>
                    <th>Supplier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <React.Fragment key={r.bill_id}>
                      <tr
                        style={{ cursor: "pointer" }}
                        onClick={() => toggleExpand(r.bill_id)}
                      >
                       <td onClick={(e) => e.stopPropagation()}>
  <input
    type="checkbox"
    checked={selectedBills.has(r.bill_id)}
    onChange={() => toggleSelectBill(r.bill_id)}
  />
</td>
                        <td>ENT#{r.bill_id}</td>
                        
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td style={{ maxWidth: 260 }} className="text-truncate">
                          {r.product_names}
                        </td>
                        <td>{r.item_count}</td>
                        <td>{r.total_quantity}</td>
                        <td>{r.supplier_name}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(r.bill_id);
                              }}
                              title="View full detail"
                            >
                              <FaEye />
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteEntry(r);
                              }}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedBillId === r.bill_id && (
                        <tr>
                          <td></td>
                          <td colSpan={7} className="bg-light">
                            {expandLoading === r.bill_id ? (
                              <div className="text-muted py-2">Loading items...</div>
                            ) : (
                              <table className="table table-sm mb-2 mt-2">
                                <thead>
                                  <tr>
                                    <th>Product</th>
                                    <th>Variant</th>
                                    <th>Qty Received</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(expandedItems[r.bill_id] || []).map((item) => (
                                    <tr key={item.id}>
                                      <td>{item.product_name}</td>
                                      <td>
                                        {item.size || item.color || item.memory
                                          ? variantLabel(item)
                                          : <span className="text-muted">—</span>}
                                      </td>
                                      <td>{item.quantity}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-4">
                        No stock entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= PAGINATION ================= */}
          <div className="d-flex justify-content-center mt-3 gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <span className="align-self-center">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
{selectedBills.size > 0 && (
<div className="d-flex gap-2 mb-3 align-items-center justify-content-end">
    <span>{selectedBills.size} selected</span>

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
          {/* ================= ADD ENTRY MODAL ================= */}
          {showModal && (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99999 }}
            >
              <div
                ref={modalRef}
                className="bg-white p-4 rounded"
                style={{ width: 700, maxHeight: "90vh", overflowY: "auto", position: "relative" }}
              >
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                  style={{
                    position: "absolute", top: 10, right: 10, border: "none",
                    background: "transparent", fontSize: 20, cursor: "pointer",
                  }}
                >
                  ×
                </button>

                <h5>New Stock Entry</h5>
                <p className="text-muted small mb-3">
                  Every product added below will be saved together as a single bill.
                </p>

                {/* SUPPLIER SEARCH */}
                <div style={{ position: "relative" }}>
                  <input
                    className="form-control my-2"
                    placeholder="Search existing supplier or type a new name"
                    value={supplierQuery}
                    onChange={(e) => {
                      setSupplierQuery(e.target.value);
                      setSupplierName(e.target.value);
                      setSupplierId(null);
                    }}
                    onFocus={() => supplierResults.length > 0 && setShowSupplierResults(true)}
                  />
                  {showSupplierResults && supplierResults.length > 0 && (
                    <div
                      className="border rounded bg-white shadow-sm"
                      style={{ position: "absolute", zIndex: 5, width: "100%", maxHeight: 180, overflowY: "auto" }}
                    >
                      {supplierResults.map((s) => (
                        <div
                          key={s.id}
                          className="p-2"
                          style={{ cursor: "pointer" }}
                          onClick={() => pickSupplier(s)}
                        >
                          <strong>{s.name}</strong>{" "}
                        
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              

                <hr />

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Add Products</h6>

                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => setShowAddProductModal(true)}
                  >
                    <FaPlus className="me-1" /> New Product
                  </button>
                </div>

                {/* PRODUCT SEARCH */}
                <div style={{ position: "relative" }}>
                  <input
                    className="form-control my-2"
                    placeholder="Search product by name..."
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    onFocus={() => productResults.length > 0 && setShowProductResults(true)}
                  />
                  {showProductResults && productResults.length > 0 && (
                    <div
                      className="border rounded bg-white shadow-sm"
                      style={{ position: "absolute", zIndex: 5, width: "100%", maxHeight: 220, overflowY: "auto" }}
                    >
                      {productResults.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 d-flex justify-content-between"
                          style={{ cursor: "pointer" }}
                          onClick={() => pickProduct(p)}
                        >
                          <span>{p.name}</span>
                          <span className="text-muted small">
                            stock: {p.qty}
                            {p.variants.length > 0 ? ` · ${p.variants.length} variants` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DRAFT ITEMS */}
                {draftItems.map((d) => (
                  <div key={d.product.id} className="border rounded p-3 mt-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>{d.product.name}</strong>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeDraftItem(d.product.id)}
                      >
                        Remove
                      </button>
                    </div>

                    {d.product.variants.length > 0 ? (
                      <table className="table table-sm mt-2 mb-0">
                        <thead>
                          <tr>
                            <th>Variant</th>
                            <th>Current Stock</th>
                            <th style={{ width: 120 }}>Qty Received</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.product.variants.map((v) => (
                            <tr key={v.id}>
                              <td>{variantLabel(v)}</td>
                              <td>{v.qty}</td>
                              <td>
                                <input
                                  type="number"
                                  min={0}
                                  className="form-control form-control-sm"
                                  value={d.variantQty[v.id] || ""}
                                  onChange={(e) =>
                                    setVariantQty(d.product.id, v.id, Number(e.target.value))
                                  }
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="d-flex align-items-center gap-2 mt-2">
                        <label className="mb-0">Qty Received:</label>
                        <input
                          type="number"
                          min={1}
                          className="form-control form-control-sm"
                          style={{ maxWidth: 120 }}
                          value={d.qty}
                          onChange={(e) => setPlainQty(d.product.id, Number(e.target.value))}
                        />
                      </div>
                    )}
                  </div>
                ))}

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      resetForm();
                      setShowModal(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={submitEntry}>
                    Save Bill
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= ADD PRODUCT MODAL (stacked above New Entry) ================= */}
          {showAddProductModal && (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100001 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  resetNewProduct();
                  setShowAddProductModal(false);
                }
              }}
            >
              <div
                className="bg-white p-4 rounded"
                style={{ width: 650, maxHeight: "90vh", overflowY: "auto", position: "relative", zIndex: 100002 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    resetNewProduct();
                    setShowAddProductModal(false);
                  }}
                  style={{
                    position: "absolute", top: 10, right: 10, border: "none",
                    background: "transparent", fontSize: 20, cursor: "pointer",
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
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />

                {/* DESCRIPTION */}
                <input
                  className="form-control my-2"
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />

                {/* BRAND */}
                <select
                  className="form-control my-2"
                  value={newProduct.brand_id}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, brand_id: Number(e.target.value) })
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
                    setNewProduct({ ...newProduct, category_id: Number(e.target.value) })
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
                    setNewProduct({ ...newProduct, purchase_price: Number(e.target.value) })
                  }
                />

                <input
                  type="number"
                  className="form-control my-2"
                  placeholder="Sale Price"
                  value={newProduct.sale_price || ""}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, sale_price: Number(e.target.value) })
                  }
                />

                {/* STOCK */}
                <div className="form-check my-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={newProduct.in_stock}
                    onChange={(e) => setNewProduct({ ...newProduct, in_stock: e.target.checked })}
                  />
                  <label>In Stock</label>
                </div>

                {/* ================= ATTRIBUTES ================= */}
                <hr />
                <h6>Attributes (Variants)</h6>

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

                {attributes.map((attr, idx) => (
                  <div key={idx} className="border p-2 mb-2 rounded bg-light">
                    <div className="d-flex justify-content-between">
                      <strong>{attr.name}</strong>
                      <button className="btn btn-sm btn-danger" onClick={() => removeAttribute(idx)}>
                        Remove
                      </button>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {attr.values.map((v) => (
                        <span key={v} className="badge bg-secondary d-flex align-items-center gap-1">
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
                        onChange={(e) => setValueDrafts({ ...valueDrafts, [idx]: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && addValueToAttribute(idx)}
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
                                value={getNewProductVariantQty(combo)}
                                onChange={(e) =>
                                  setNewProductVariantQty(combo, Number(e.target.value))
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
                      setShowAddProductModal(false);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={addProductForEntry}
                    disabled={savingNewProduct}
                  >
                    {savingNewProduct ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {deleteEntry && (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.5)",
                zIndex: 99999,
              }}
            >
              <div className="bg-white rounded p-4" style={{ width: 400 }}>
                <h5>Delete Bill</h5>

                <p>
                  Are you sure you want to delete{" "}
                  <strong>BILL#{deleteEntry.bill_id}</strong>? This removes all{" "}
                  {deleteEntry.item_count} item(s) in it.
                </p>

                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-secondary" onClick={() => setDeleteEntry(null)}>
                    Cancel
                  </button>

                  <button
                    className="btn btn-danger"
                    onClick={() => deleteStockEntry(deleteEntry.bill_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= FULL DETAIL MODAL ================= */}
          {detailEntry && (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99999 }}
            >
              <div
                ref={detailRef}
                className="bg-white p-4 rounded"
                style={{ width: 550, maxHeight: "90vh", overflowY: "auto", position: "relative" }}
              >
                <button
                  onClick={() => setDetailEntry(null)}
                  style={{
                    position: "absolute", top: 10, right: 10, border: "none",
                    background: "transparent", fontSize: 20, cursor: "pointer",
                  }}
                >
                  ×
                </button>

                <h5>Bill #{detailEntry.id}</h5>

                <table className="table table-sm mt-3">
                  <tbody>
                    <tr><th>Supplier</th><td>{detailEntry.supplier_name}</td></tr>
                    <tr><th>Contact</th><td>{detailEntry.contact || "—"}</td></tr>
                    {detailEntry.supplier_table_name && (
                      <>
                        <tr><th>Linked Supplier</th><td>{detailEntry.supplier_table_name}</td></tr>
                        <tr><th>Supplier Contact Person</th><td>{detailEntry.supplier_contact_name || "—"}</td></tr>
                        <tr><th>Supplier Phone</th><td>{detailEntry.supplier_phone || "—"}</td></tr>
                        <tr><th>Supplier Email</th><td>{detailEntry.supplier_email || "—"}</td></tr>
                        <tr><th>Supplier Address</th><td>{detailEntry.supplier_address || "—"}</td></tr>
                      </>
                    )}
                    <tr><th>Created By</th><td>{detailEntry.created_by ?? "—"}</td></tr>
                    <tr><th>Date</th><td>{new Date(detailEntry.created_at).toLocaleString()}</td></tr>
                  </tbody>
                </table>

                <h6 className="mt-3">Items</h6>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Product</th>
                      <th>Variant</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailEntry.items.map((item) => (
                      <tr key={item.id}>
                         <td>{item.ent_id || "—"}</td>
                        <td>{item.product_name}</td>
                        <td>
                          {item.size || item.color || item.memory
                            ? variantLabel(item)
                            : <span className="text-muted">—</span>}
                        </td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Entries;