import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../../layout/sidebar";
import AdminHeader from "../../../layout/headeradmin";

import api from "../../../api/axios";
import { useToast } from "../../../componets/common/ToastContext";
import { FaEye, FaTrash, FaPlus, FaExternalLinkAlt } from "react-icons/fa";

/* ================= TYPES ================= */

type PartyType = "supplier" | "customer";

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
  sale_price: number;
  variants: ProductVariant[];
};

type Party = {
  id: number;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  type: PartyType;
};

type ExitType = "sale" | "return";

// One row in the list = ONE EXIT BILL (a whole "New Exit" submission),
// not one product. item_count / total_quantity / total_amount /
// product_names are aggregates across every product in that bill.
type ExitRow = {
  exit_id: number;
  party_id: number | null;
  party_name: string;
  party_type: PartyType;
  contact: string | null;
  exit_type: ExitType;
  created_by: number | null;
  created_at: string;
  item_count: number;
  total_quantity: number;
  total_amount: number;
  product_names: string;
};

type ExitItem = {
  id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  unit_price: number;
  product_name: string;
  size: string | null;
  color: string | null;
  memory: string | null;
};

type ExitDetail = {
  id: number;
  party_id: number | null;
  party_name: string;
  party_type: PartyType;
  contact: string | null;
  exit_type: ExitType;
  created_by: number | null;
  created_at: string;
  party_table_name?: string;
  party_contact_name?: string;
  party_phone?: string;
  party_email?: string;
  party_address?: string;
  items: ExitItem[];
};

// One product picked into the "cart" for this submission.
type DraftItem = {
  product: ProductSearchResult;
  variantQty: Record<number, number>; // variant_id -> qty
  qty: number; // used only when product has no variants
  unitPrice: number;
};

/* ================= NEW-PRODUCT (dynamic attributes) TYPES ================= */
type Attribute = {
  name: string;
  values: string[];
};

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

// "C" for customer, "S" for supplier -> e.g. C102 / S7
const partyCode = (partyType: PartyType | null | undefined, partyId: number | null) => {
  if (!partyId) return "—";
  const prefix = partyType === "customer" ? "C" : "S";
  return `${prefix}${String(partyId).padStart(6, "0")}`;
};
const exitTypeBadge = (type: ExitType) =>
  type === "sale" ? (
    <span className="badge bg-success">Sale</span>
  ) : (
    <span className="badge bg-warning text-dark">Return to Supplier</span>
  );

const money = (n: number) =>
  (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Exits: React.FC = () => {
  const { showToast } = useToast();

  /* ================= LIST STATE ================= */
  const [rows, setRows] = useState<ExitRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  // Filters
  const [productSearch, setProductSearch] = useState("");
  const [partySearch, setPartySearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ExitType>("all");

  /* ================= EXPANDED BILL (inline items) ================= */
  const [expandedExitId, setExpandedExitId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<number, ExitItem[]>>({});
  const [expandLoading, setExpandLoading] = useState<number | null>(null);

  /* ================= ADD MODAL STATE ================= */
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const [exitType, setExitType] = useState<ExitType>("sale");

  const [partyName, setPartyName] = useState("");
  const [partyContact, setPartyContact] = useState("");
  const [partyId, setPartyId] = useState<number | null>(null);

  const [partyQuery, setPartyQuery] = useState("");
  const [partyResults, setPartyResults] = useState<Party[]>([]);
  const [showPartyResults, setShowPartyResults] = useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
  const [showProductResults, setShowProductResults] = useState(false);

  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  /* ================= DETAIL MODAL STATE ================= */
  const [detailEntry, setDetailEntry] = useState<ExitDetail | null>(null);
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

  const [deleteEntry, setDeleteEntry] = useState<ExitRow | null>(null);

  /* ================= SELECTION / DOWNLOAD ================= */
  const [selectedExits, setSelectedExits] = useState<Set<number>>(new Set());

  const toggleSelectExit = (id: number) => {
    setSelectedExits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedExits(new Set(rows.map((r) => r.exit_id)));
  };

  const clearSelection = () => setSelectedExits(new Set());

  /* ================= FETCH LIST ================= */
  const fetchExits = async () => {
    try {
      const res = await api.get("/stock-exits", {
        params: {
          page,
          limit,
          product: productSearch,
          party: partySearch,
          startDate,
          endDate,
          type: typeFilter === "all" ? undefined : typeFilter,
        },
      });
      setRows(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.log(err);
      showToast("Failed to load exits", "error" as any);
    }
  };

  useEffect(() => {
    fetchExits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, productSearch, partySearch, startDate, endDate, typeFilter]);

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

  /* ================= PARTY SEARCH (debounced, filtered by exitType) ================= */
  useEffect(() => {
    if (!partyQuery.trim()) {
      setPartyResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/suppliers/search", {
          params: { q: partyQuery, type: exitType === "sale" ? "customer" : "supplier" },
        });
        setPartyResults(res.data);
        setShowPartyResults(true);
      } catch (err) {
        console.log(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [partyQuery, exitType]);

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close the "New Exit" modal because of a click that's actually
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

  /* ================= EXIT TYPE SWITCH ================= */
  // Switching between "Sale" and "Return to Supplier" invalidates whatever
  // party was already picked, since customers and suppliers live in the
  // same table but are not interchangeable here.
  const switchExitType = (type: ExitType) => {
    setExitType(type);
    setPartyId(null);
    setPartyName("");
    setPartyContact("");
    setPartyQuery("");
    setPartyResults([]);
  };

  /* ================= PARTY PICK ================= */
  const pickParty = (p: Party) => {
    setPartyId(p.id);
    setPartyName(p.name);
    setPartyContact(p.phone || p.email || "");
    setPartyQuery(p.name);
    setShowPartyResults(false);
  };

  /* ================= PRODUCT PICK ================= */
const pickProduct = (p: ProductSearchResult) => {
  if (draftItems.some((d) => d.product.id === p.id)) {
    showToast("Product already added", "warning" as any);
    setShowProductResults(false);
    setProductQuery("");
    return;
  }

  const price = p.sale_price || 0;

  setDraftItems((prev) => [
    ...prev,
    {
      product: p,
      variantQty: {},
      qty: 1,
      unitPrice: price, // AUTO PRICE
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

  const setUnitPrice = (productId: number, unitPrice: number) => {
    setDraftItems((prev) =>
      prev.map((d) => (d.product.id === productId ? { ...d, unitPrice } : d))
    );
  };

  // Live running total for the draft bill, shown in the modal footer.
  const draftTotal = draftItems.reduce((sum, d) => {
    const qty =
      d.product.variants.length > 0
        ? Object.values(d.variantQty).reduce((a, b) => a + (b || 0), 0)
        : d.qty || 0;
    return sum + qty * (d.unitPrice || 0);
  }, 0);

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

  /* ================= ADD PRODUCT (from Exit page) ================= */
  const addProductForExit = async () => {
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
    setExitType("sale");
    setPartyName("");
    setPartyContact("");
    setPartyId(null);
    setPartyQuery("");
    setPartyResults([]);
    setProductQuery("");
    setProductResults([]);
    setDraftItems([]);
  };

  /* ================= SUBMIT (creates ONE exit bill with all items) ================= */
  const submitExit = async () => {
    if (!partyName.trim()) {
      showToast(
        exitType === "sale" ? "Customer name is required" : "Supplier name is required",
        "warning" as any
      );
      return;
    }
    if (draftItems.length === 0) {
      showToast("Add at least one product", "warning" as any);
      return;
    }

    const items: {
      product_id: number;
      variant_id: number | null;
      quantity: number;
      unit_price: number;
    }[] = [];

    for (const d of draftItems) {
      if (d.product.variants.length > 0) {
        for (const v of d.product.variants) {
          const q = d.variantQty[v.id] || 0;
          if (q > 0)
            items.push({
              product_id: d.product.id,
              variant_id: v.id,
              quantity: q,
              unit_price: d.unitPrice,
            });
        }
      } else {
        if (d.qty > 0)
          items.push({
            product_id: d.product.id,
            variant_id: null,
            quantity: d.qty,
            unit_price: d.unitPrice,
          });
      }
    }

    if (items.length === 0) {
      showToast("Set a quantity greater than 0 for at least one item", "warning" as any);
      return;
    }

    try {
      await api.post("/stock-exits", {
        exit_type: exitType,
        party_id: partyId,
        party_name: partyName,
        // let the backend create the party under the right type if partyId is null
        party_type: exitType === "sale" ? "customer" : "supplier",
        contact: partyContact,
        items,
      });

      showToast("Exit saved successfully", "success");
      resetForm();
      setShowModal(false);
      setPage(1);
      fetchExits();
    } catch (err) {
      console.log(err);
      showToast("Failed to save exit", "error" as any);
    }
  };

  /* ================= EXPAND / COLLAPSE AN EXIT'S ITEMS ================= */
  const toggleExpand = async (exitId: number) => {
    if (expandedExitId === exitId) {
      setExpandedExitId(null);
      return;
    }

    setExpandedExitId(exitId);

    if (!expandedItems[exitId]) {
      setExpandLoading(exitId);
      try {
        const res = await api.get(`/stock-exits/${exitId}`);
        setExpandedItems((prev) => ({ ...prev, [exitId]: res.data.items || [] }));
      } catch (err) {
        console.log(err);
        showToast("Failed to load exit items", "error" as any);
      } finally {
        setExpandLoading(null);
      }
    }
  };

  /* ================= FULL DETAIL MODAL ================= */
  const openDetail = async (id: number) => {
    try {
      const res = await api.get(`/stock-exits/${id}`);
      setDetailEntry(res.data);
    } catch (err) {
      console.log(err);
      showToast("Failed to load exit detail", "error" as any);
    }
  };

  const deleteExit = async (id: number) => {
    try {
      await api.delete(`/stock-exits/${id}`);

      showToast("Exit deleted successfully", "success");

      setDeleteEntry(null);
      if (expandedExitId === id) setExpandedExitId(null);

      fetchExits();
    } catch (err) {
      console.log(err);
      showToast("Failed to delete exit", "error" as any);
    }
  };

  const downloadSelected = async () => {
    try {
      const ids = Array.from(selectedExits);

      const res = await api.post(
        "/stock-exits/export",
        {
          ids,
          startDate: startDate || null,
          endDate: endDate || null,
          product: productSearch || null,
          party: partySearch || null,
          type: typeFilter === "all" ? null : typeFilter,
        },
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], { type: "text/csv" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stock-exits.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.log(err);
      showToast("Failed to download", "error" as any);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column">
        <AdminHeader />

        <div className="p-4 bg-light min-vh-100">
          {/* ================= TOP BAR / FILTERS ================= */}
          <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
            <input
              className="form-control"
              style={{ maxWidth: 200 }}
              placeholder="Search product..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setPage(1);
              }}
            />

            <input
              className="form-control"
              style={{ maxWidth: 200 }}
              placeholder="Search customer / supplier..."
              value={partySearch}
              onChange={(e) => {
                setPartySearch(e.target.value);
                setPage(1);
              }}
            />

            <select
              className="form-control"
              style={{ maxWidth: 170 }}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as "all" | ExitType);
                setPage(1);
              }}
            >
              <option value="all">All types</option>
              <option value="sale">Sale</option>
              <option value="return">Return to Supplier</option>
            </select>

            <input
              type="date"
              className="form-control"
              style={{ maxWidth: 180 }}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />

            <span>to</span>

            <input
              type="date"
              className="form-control"
              style={{ maxWidth: 180 }}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />

            {(startDate || endDate || productSearch || partySearch || typeFilter !== "all") && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setProductSearch("");
                  setPartySearch("");
                  setTypeFilter("all");
                  setPage(1);
                }}
              >
                Clear
              </button>
            )}

            <button className="btn btn-primary ms-auto" onClick={() => setShowModal(true)}>
              + New Exit
            </button>
          </div>

          {/* ================= TABLE (one row per EXIT BILL) ================= */}
          <div className="card shadow-sm border-0">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>
                      <input
                        type="checkbox"
                        checked={rows.length > 0 && selectedExits.size === rows.length}
                        onChange={(e) => {
                          if (e.target.checked) selectAllVisible();
                          else clearSelection();
                        }}
                      />
                    </th>
                    <th>Id</th>
                    <th>Customer / Supplier Id</th>
                    <th>Date</th>
                    <th>Products</th>
                    <th>Type</th>
                    <th>Total Qty</th>
                    <th>Total</th>
                    <th>Customer / Supplier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <React.Fragment key={r.exit_id}>
                      <tr style={{ cursor: "pointer" }} onClick={() => toggleExpand(r.exit_id)}>
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedExits.has(r.exit_id)}
                            onChange={() => toggleSelectExit(r.exit_id)}
                          />
                        </td>
                        <td>EXIT#{r.exit_id}</td>
                        <td>{partyCode(r.party_type, r.party_id)}</td>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td style={{ maxWidth: 240 }} className="text-truncate">
                          {r.product_names}
                        </td>
                        <td>{exitTypeBadge(r.exit_type)}</td>
                        <td>{r.total_quantity}</td>
                        <td>{money(r.total_amount)}</td>
                        <td>{r.party_name}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(r.exit_id);
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

                      {expandedExitId === r.exit_id && (
                        <tr>
                          <td></td>
                          <td colSpan={9} className="bg-light">
                            {expandLoading === r.exit_id ? (
                              <div className="text-muted py-2">Loading items...</div>
                            ) : (
                              <table className="table table-sm mb-2 mt-2">
                                <thead>
                                  <tr>
                                    <th>Product</th>
                                    <th>Variant</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Line Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(expandedItems[r.exit_id] || []).map((item) => (
                                    <tr key={item.id}>
                                      <td>
                                        <Link to={`/admin/products?highlight=${item.product_id}`}>
                                          {item.product_name}
                                        </Link>
                                      </td>
                                      <td>
                                        {item.size || item.color || item.memory ? (
                                          variantLabel(item)
                                        ) : (
                                          <span className="text-muted">—</span>
                                        )}
                                      </td>
                                      <td>{item.quantity}</td>
                                      <td>{money(item.unit_price)}</td>
                                      <td>{money(item.unit_price * item.quantity)}</td>
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
                      <td colSpan={10} className="text-center text-muted py-4">
                        No exits found
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

          {selectedExits.size > 0 && (
            <div className="d-flex gap-2 mb-3 align-items-center justify-content-end">
              <span>{selectedExits.size} selected</span>

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

          {/* ================= ADD EXIT MODAL ================= */}
          {showModal && (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99999 }}
            >
              <div
                ref={modalRef}
                className="bg-white p-4 rounded"
                style={{ width: 750, maxHeight: "90vh", overflowY: "auto", position: "relative" }}
              >
                <button
                  onClick={() => {
                    resetForm();
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

                <h5>New Exit</h5>
                <p className="text-muted small mb-3">
                  Every product added below will be saved together as a single exit.
                </p>

                {/* EXIT TYPE TOGGLE */}
                <div className="btn-group mb-3" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${exitType === "sale" ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => switchExitType("sale")}
                  >
                    Sale to Customer
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${exitType === "return" ? "btn-warning" : "btn-outline-warning"}`}
                    onClick={() => switchExitType("return")}
                  >
                    Return to Supplier
                  </button>
                </div>
<button
  className="btn btn-outline-primary btn-sm"
  onClick={() => alert("Create Customer/Supplier modal here")}
>
  + New {exitType === "sale" ? "Customer" : "Supplier"}
</button>
                {/* PARTY SEARCH */}
                <div style={{ position: "relative" }}>
                  <input
                    className="form-control my-2"
                    placeholder={
                      exitType === "sale"
                        ? "Search existing customer or type a new name"
                        : "Search existing supplier or type a new name"
                    }
                    value={partyQuery}
                    onChange={(e) => {
                      setPartyQuery(e.target.value);
                      setPartyName(e.target.value);
                      setPartyId(null);
                    }}
                    onFocus={() => partyResults.length > 0 && setShowPartyResults(true)}
                  />
                  {showPartyResults && partyResults.length > 0 && (
                    <div
                      className="border rounded bg-white shadow-sm"
                      style={{ position: "absolute", zIndex: 5, width: "100%", maxHeight: 180, overflowY: "auto" }}
                    >
                      {partyResults.map((p) => (
                        <div
                          key={p.id}
                          className="p-2"
                          style={{ cursor: "pointer" }}
                          onClick={() => pickParty(p)}
                        >
                          <strong>{p.name}</strong>{" "}
                          <span className="text-muted small">{p.phone || p.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  className="form-control my-2"
                  placeholder="Contact (phone / email)"
                  value={partyContact}
                  onChange={(e) => setPartyContact(e.target.value)}
                />

                <hr />

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Add Products</h6>

                  <div className="d-flex gap-2">
                    <Link to="/admin/products" className="btn btn-outline-secondary btn-sm" target="_blank">
                      <FaExternalLinkAlt className="me-1" /> Manage Products
                    </Link>
                   
                  </div>
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
                            {" · "}
                            {money(p.sale_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DRAFT ITEMS */}
                {draftItems.map((d) => {
                  const lineQty =
                    d.product.variants.length > 0
                      ? Object.values(d.variantQty).reduce((a, b) => a + (b || 0), 0)
                      : d.qty || 0;

                  return (
                    <div key={d.product.id} className="border rounded p-3 mt-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <strong>
                          {d.product.name}{" "}
                          <Link
                            to={`/admin/products?highlight=${d.product.id}`}
                            target="_blank"
                            className="ms-1"
                            title="Open in Products"
                          >
                            <FaExternalLinkAlt size={12} />
                          </Link>
                        </strong>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeDraftItem(d.product.id)}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="d-flex align-items-center gap-2 mt-2">
                        <label className="mb-0">Unit Price:</label>
                      <span className="text-muted small ms-auto">
  Unit Price: {money(d.unitPrice)}
</span>
                        <span className="text-muted small ms-auto">
                          Line total: {money(lineQty * d.unitPrice)}
                        </span>
                      </div>

                      {d.product.variants.length > 0 ? (
                        <table className="table table-sm mt-2 mb-0">
                          <thead>
                            <tr>
                              <th>Variant</th>
                              <th>Current Stock</th>
                              <th style={{ width: 120 }}>Qty</th>
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
                                    max={v.qty}
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
                          <label className="mb-0">Qty:</label>
                          <input
                            type="number"
                            min={1}
                            max={d.product.qty}
                            className="form-control form-control-sm"
                            style={{ maxWidth: 120 }}
                            value={d.qty}
                            onChange={(e) => setPlainQty(d.product.id, Number(e.target.value))}
                          />
                          <span className="text-muted small">in stock: {d.product.qty}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <h6 className="mb-0">Total: {money(draftTotal)}</h6>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        resetForm();
                        setShowModal(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={submitExit}>
                      Save Exit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= ADD PRODUCT MODAL (stacked above New Exit) ================= */}
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

                <input
                  className="form-control my-2"
                  placeholder="Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />

                <input
                  className="form-control my-2"
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />

                <select
                  className="form-control my-2"
                  value={newProduct.brand_id}
                  onChange={(e) => setNewProduct({ ...newProduct, brand_id: Number(e.target.value) })}
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
                  onChange={(e) => setNewProduct({ ...newProduct, category_id: Number(e.target.value) })}
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
                    setNewProduct({ ...newProduct, image: file || null });
                  }}
                />

                <input
                  type="number"
                  className="form-control my-2"
                  placeholder="Purchase Price"
                  value={newProduct.purchase_price || ""}
                  onChange={(e) => setNewProduct({ ...newProduct, purchase_price: Number(e.target.value) })}
                />

                <input
                  type="number"
                  className="form-control my-2"
                  placeholder="Sale Price"
                  value={newProduct.sale_price || ""}
                  onChange={(e) => setNewProduct({ ...newProduct, sale_price: Number(e.target.value) })}
                />

                <div className="form-check my-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={newProduct.in_stock}
                    onChange={(e) => setNewProduct({ ...newProduct, in_stock: e.target.checked })}
                  />
                  <label>In Stock</label>
                </div>

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
                          <span style={{ cursor: "pointer" }} onClick={() => removeValueFromAttribute(idx, v)}>
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
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => addValueToAttribute(idx)}>
                        Add
                      </button>
                    </div>
                  </div>
                ))}

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
                                onChange={(e) => setNewProductVariantQty(combo, Number(e.target.value))}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

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

                  <button className="btn btn-primary" onClick={addProductForExit} disabled={savingNewProduct}>
                    {savingNewProduct ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= DELETE CONFIRM MODAL ================= */}
          {deleteEntry && (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 99999 }}
            >
              <div className="bg-white rounded p-4" style={{ width: 400 }}>
                <h5>Delete Exit</h5>

                <p>
                  Are you sure you want to delete <strong>EXIT#{deleteEntry.exit_id}</strong>? This removes
                  all {deleteEntry.item_count} item(s) in it.
                </p>

                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-secondary" onClick={() => setDeleteEntry(null)}>
                    Cancel
                  </button>

                  <button className="btn btn-danger" onClick={() => deleteExit(deleteEntry.exit_id)}>
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
                style={{ width: 600, maxHeight: "90vh", overflowY: "auto", position: "relative" }}
              >
                <button
                  onClick={() => setDetailEntry(null)}
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

                <h5>
                  Exit #{detailEntry.id} {exitTypeBadge(detailEntry.exit_type)}
                </h5>

                <table className="table table-sm mt-3">
                  <tbody>
                    <tr>
                      <th>{detailEntry.exit_type === "sale" ? "Customer" : "Supplier"}</th>
                      <td>{detailEntry.party_name}</td>
                    </tr>
                    <tr>
                      <th>Id</th>
                      <td>{partyCode(detailEntry.party_type, detailEntry.party_id)}</td>
                    </tr>
                    <tr>
                      <th>Contact</th>
                      <td>{detailEntry.contact || "—"}</td>
                    </tr>
                    {detailEntry.party_table_name && (
                      <>
                        <tr>
                          <th>Linked Record</th>
                          <td>{detailEntry.party_table_name}</td>
                        </tr>
                        <tr>
                          <th>Contact Person</th>
                          <td>{detailEntry.party_contact_name || "—"}</td>
                        </tr>
                        <tr>
                          <th>Phone</th>
                          <td>{detailEntry.party_phone || "—"}</td>
                        </tr>
                        <tr>
                          <th>Email</th>
                          <td>{detailEntry.party_email || "—"}</td>
                        </tr>
                        <tr>
                          <th>Address</th>
                          <td>{detailEntry.party_address || "—"}</td>
                        </tr>
                      </>
                    )}
                    <tr>
                      <th>Created By</th>
                      <td>{detailEntry.created_by ?? "—"}</td>
                    </tr>
                    <tr>
                      <th>Date</th>
                      <td>{new Date(detailEntry.created_at).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                <h6 className="mt-3">Items</h6>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Variant</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailEntry.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <Link to={`/admin/products?highlight=${item.product_id}`}>{item.product_name}</Link>
                        </td>
                        <td>
                          {item.size || item.color || item.memory ? (
                            variantLabel(item)
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>{item.quantity}</td>
                        <td>{money(item.unit_price)}</td>
                        <td>{money(item.unit_price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colSpan={4} className="text-end">
                        Total
                      </th>
                      <th>
                        {money(
                          detailEntry.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
                        )}
                      </th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Exits;