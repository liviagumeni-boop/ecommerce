import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../../layout/sidebar";
import AdminHeader from "../../../layout/headeradmin";
import TableFilters, { FilterField } from "../../../componets/ui/TableFilters";
import DateRangeFilter from "../../../componets/common/datarange";
import api from "../../../api/axios";
import { useToast } from "../../../componets/common/ToastContext";
import { FaEye, FaTrash, FaExternalLinkAlt } from "react-icons/fa";

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
  exit_code: string;
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
  exit_code: string;
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
  exit_code: string;
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

const isEmptyVariant = (v: any) =>
  (!v.size || v.size === "") &&
  (!v.color || v.color === "") &&
  (!v.memory || v.memory === "");

const variantLabel = (v: any) => {
  if (isEmptyVariant(v)) return null; // 👈 IMPORTANT: not "Default"

  return [v.size, v.color, v.memory]
    .filter((x) => x && x.trim?.() !== "")
    .join(" / ");
};

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

/* ================= FILTER FIELDS ================= */
// Product search, party search, and the sale/return type select are all
// plain TableFilters fields. The date range is handled separately via
// DateRangeFilter, passed in through the `extra` slot.
const EXIT_FILTER_FIELDS: FilterField[] = [
  {
    type: "search",
    key: "productSearch",
    placeholder: "Search product...",
  },
  {
    type: "search",
    key: "partySearch",
    placeholder: "Search customer / supplier...",
  },
  {
    type: "select",
    key: "typeFilter",
    placeholder: "All types",
    options: [
      { label: "Sale", value: "sale" },
      { label: "Return to Supplier", value: "return" },
    ],
  },
];

const Exits: React.FC = () => {
  const { showToast } = useToast();

  /* ================= LIST STATE ================= */
  const [rows, setRows] = useState<ExitRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  // Generic filter values keyed by field.key — this is what TableFilters reads/writes.
  // typeFilter is kept as "" | "sale" | "return" here; "" means "all types".
  const [filters, setFilters] = useState<Record<string, any>>({
    productSearch: "",
    partySearch: "",
    typeFilter: "",
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
          product: filters.productSearch,
          party: filters.partySearch,
          startDate,
          endDate,
          type: filters.typeFilter === "" ? undefined : filters.typeFilter,
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
  }, [page, filters, startDate, endDate]);

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

  /* ================= LOAD FULL PARTY LIST FOR THE SELECT DROPDOWN =================
     The select needs to show every customer / supplier up front, not just
     whatever the debounced search box has matched so far. We fetch the
     full list whenever the modal opens or the exit type (customer vs
     supplier) changes. If the search box is later used, its results just
     overwrite this list, which is fine since they share the same shape. */
  const fetchAllParties = async () => {
    try {
      const res = await api.get("/suppliers/search", {
        params: { q: "", type: exitType === "sale" ? "customer" : "supplier" },
      });
      setPartyResults(res.data || []);
    } catch (err) {
      console.log(err);
      showToast("Failed to load customers / suppliers", "error" as any);
    }
  };

  useEffect(() => {
    if (showModal) fetchAllParties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, exitType]);

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false);
      }
    };
    if (showModal) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModal]);

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

  /* ================= PRODUCT PICK =================
     Products already exist in stock — this page only records an exit
     (sale / return) against them. Price always comes from the product's
     own sale_price, never typed in by hand. */
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
        unitPrice: Number(p.sale_price ?? 0), // price sourced from the product record
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

  // Live running total for the draft bill, shown in the modal footer.
  const draftTotal = draftItems.reduce((sum, d) => {
    const qty =
      d.product.variants.length > 0
        ? Object.values(d.variantQty).reduce((a, b) => a + (b || 0), 0)
        : d.qty || 0;
    return sum + qty * (d.unitPrice || 0);
  }, 0);

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

    try {
      setExpandLoading(exitId);

      const res = await api.get(`/stock-exits/${exitId}`);

      setExpandedItems((prev) => ({
        ...prev,
        [exitId]: res.data.items || [],
      }));
    } catch (err) {
      showToast("Failed to load exit items", "error" as any);
    } finally {
      setExpandLoading(null);
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

  /* ================= DOWNLOAD SELECTED ================= */
  const downloadSelected = async () => {
    if (selectedExits.size === 0) {
      showToast("Select at least one exit to download", "warning" as any);
      return;
    }

    try {
      const ids = Array.from(selectedExits);

      // 1. fetch full modal-style details (same as Eye modal)
      const responses = await Promise.all(
        ids.map((id) => api.get(`/stock-exits/${id}`))
      );

      const exits: ExitDetail[] = responses.map((r) => r.data);

      // 2. flatten into CSV rows (same structure as modal table)
      const rows: any[] = [];

      exits.forEach((exit) => {
        exit.items.forEach((item) => {
          rows.push({
            ExitID: exit.id,
            ExitCode: exit.exit_code,
            Date: new Date(exit.created_at).toLocaleString(),

            Contact: exit.contact || "",
            ContactPerson: exit.party_contact_name || "",
            Phone: exit.party_phone || "",
            Email: exit.party_email || "",
            Address: exit.party_address || "",

            Product: item.product_name,
            Variant: item.size || item.color || item.memory
              ? [item.size, item.color, item.memory].filter(Boolean).join(" / ")
              : "",

            Quantity: item.quantity,
            UnitPrice: item.unit_price,
            LineTotal: item.unit_price * item.quantity,
          });
        });
      });

      // 3. CSV build
      if (rows.length === 0) {
        showToast("Nothing to export", "warning" as any);
        return;
      }

      const headers = Object.keys(rows[0]);

      const csv = [
        headers.join(","),
        ...rows.map((r) =>
          headers.map((h) => `"${(r as any)[h] ?? ""}"`).join(",")
        ),
      ].join("\n");

      // 4. download file
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "stock-exits-detailed.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.log(err);
      showToast("Failed to download detailed export", "error" as any);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column">
        <AdminHeader />

        <div className="p-4 bg-light min-vh-100">
          {/* ================= TOP BAR / FILTERS ================= */}
          <TableFilters
            values={filters}
            onChange={(key, value) => {
              setFilters((prev) => ({ ...prev, [key]: value }));
              setPage(1);
            }}
            onReset={() => {
              setFilters({ productSearch: "", partySearch: "", typeFilter: "" });
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
            fields={EXIT_FILTER_FIELDS}
            extra={
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onChange={(start: string, end: string) => {
                  setStartDate(start);
                  setEndDate(end);
                  setPage(1);
                }}
              />
            }
            actions={
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                + New Exit
              </button>
            }
          />

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
                    <th>Date</th>
                    <th>Products</th>
                    <th>Type</th>
                    <th> Qty</th>
                    <th>Total</th>
                    <th>Customer</th>
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

                {/* PARTY SELECT — shows every customer / supplier, not just search matches */}
                <div style={{ display: "flex", gap: "10px", alignItems: "stretch" }}>
                  {/* LEFT */}
                  <div style={{ flex: 1 }}>
                    <select
                      className="form-control"
                      value={exitType}
                      onChange={(e) => switchExitType(e.target.value as ExitType)}
                    >
                      <option value="sale">Sale (Customer)</option>
                      <option value="return">Return to Supplier</option>
                    </select>
                  </div>

                  {/* RIGHT */}
                  <div style={{ flex: 1, position: "relative" }}>
                    <input
                      className="form-control"
                      placeholder={
                        exitType === "sale"
                          ? "Search existing customer"
                          : "Search existing supplier"
                      }
                      value={partyQuery}
                      onChange={(e) => {
                        setPartyQuery(e.target.value);
                        setPartyName(e.target.value);
                        setPartyId(null);
                      }}
                      onFocus={() =>
                        partyResults.length > 0 && setShowPartyResults(true)
                      }
                    />

                    {showPartyResults && partyResults.length > 0 && (
                      <div
                        className="border rounded bg-white shadow-sm"
                        style={{
                          position: "absolute",
                          zIndex: 5,
                          width: "100%",
                          maxHeight: 180,
                          overflowY: "auto",
                        }}
                      >
                        {partyResults.map((p) => (
                          <div
                            key={p.id}
                            className="p-2"
                            style={{ cursor: "pointer" }}
                            onClick={() => pickParty(p)}
                          >
                            <strong>{p.name}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <hr />

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Add Products</h6>

                  <Link to="/admin/products" className="btn btn-outline-secondary btn-sm" target="_blank">
                    <FaExternalLinkAlt className="me-1" /> Manage Products
                  </Link>
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

                      <div className="d-flex align-items-center mt-2">
                        <span className="text-muted small">Unit Price: {money(d.unitPrice)}</span>
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
                      <th>Id</th>
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
                        <td>{detailEntry.exit_code}</td>
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
                      <td colSpan={5} className="text-end fw-bold">
                        Total
                      </td>
                      <td className="fw-bold">
                        {money(
                          detailEntry.items.reduce(
                            (s, i) => s + i.unit_price * i.quantity,
                            0
                          )
                        )}
                      </td>
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