import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../../../layout/sidebar";
import AdminHeader from "../../../layout/headeradmin";
import api from "../../../api/axios";
import { useToast } from "../../../componets/common/ToastContext";
import { FaEye, FaTrash, FaEdit } from "react-icons/fa";
import TableFilters, { FilterField } from "../../../componets/ui/TableFilters";
/* ================= TYPES ================= */

type PartyType = "supplier" | "customer";

// One row = one customer OR supplier. Both live in the same table/endpoint,
// distinguished by `type`, and are shown together here.
type Party = {
  id: number;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  role: PartyType;
  created_at: string;
};

const partyTypeBadge = (role: PartyType) =>
  role === "customer" ? (
    <span className="badge bg-success">Customer</span>
  ) : (
    <span className="badge bg-info text-dark">Supplier</span>
  );
const PARTY_FILTER_FIELDS: FilterField[] = [
  {
    type: "search",
    key: "search",
    placeholder: "Search name / phone / email...",
  },
  {
    type: "select",
    key: "typeFilter",
    placeholder: "All",
    options: [
      { label: "Customers", value: "customer" },
      { label: "Suppliers", value: "supplier" },
    ],
  },
];
// "C" for customer, "S" for supplier -> e.g. C000102 / S000007
const partyCode = (role: PartyType, id: number) => {
  const prefix = role === "customer" ? "C" : "S";
  return `${prefix}${String(id).padStart(6, "0")}`;
};

const emptyForm = {
  id: 0,
  name: "",
  contact_name: "",
  phone: "",
  email: "",
  address: "",
  role: "customer" as PartyType,
};

const Parties: React.FC = () => {
  const { showToast } = useToast();

  /* ================= LIST STATE ================= */
  const [rows, setRows] = useState<Party[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  // Filters
  const [search, setSearch] = useState("");
 const [filters, setFilters] = useState({
  search: "",
  typeFilter: "",
});

  /* ================= ADD / EDIT MODAL STATE ================= */
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  /* ================= DETAIL MODAL STATE ================= */
  const [detailEntry, setDetailEntry] = useState<Party | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  /* ================= DELETE CONFIRM MODAL STATE ================= */
  const [deleteEntry, setDeleteEntry] = useState<Party | null>(null);

  /* ================= SELECTION / DOWNLOAD ================= */
  const [selectedParties, setSelectedParties] = useState<Set<number>>(new Set());

  const toggleSelectParty = (id: number) => {
    setSelectedParties((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedParties(new Set(rows.map((r) => r.id)));
  };

  const clearSelection = () => setSelectedParties(new Set());

  /* ================= FETCH LIST ================= */
  const fetchParties = async () => {
    try {
      const res = await api.get("/parties", {
        
         params: {
    page,
    limit,
    search: filters.search,
    role: filters.typeFilter || undefined,
},
      });
      setRows(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.log(err);
      showToast("Failed to load customers / suppliers", "error" as any);
    }
  };

  useEffect(() => {
    fetchParties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [page, filters]);

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

  /* ================= ADD / EDIT ================= */
  const openAddModal = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (p: Party) => {
    setForm({
      id: p.id,
      name: p.name,
      contact_name: p.contact_name || "",
      phone: p.phone || "",
      email: p.email || "",
      address: p.address || "",
      role: p.role,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const saveParty = async () => {
    if (!form.name.trim()) {
      showToast("Name is required", "warning" as any);
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/parties/${form.id}`, form);
        showToast("Updated successfully", "success");
      } else {
        await api.post("/parties", form);
        showToast("Added successfully", "success");
      }

      setShowModal(false);
      setForm(emptyForm);
      setPage(1);
      fetchParties();
    } catch (err) {
      console.log(err);
      showToast(isEditing ? "Failed to update" : "Failed to add", "error" as any);
    } finally {
      setSaving(false);
    }
  };

  /* ================= DETAIL ================= */
  const openDetail = async (id: number) => {
    try {
      const res = await api.get(`/parties/${id}`);
      setDetailEntry(res.data);
    } catch (err) {
      console.log(err);
      showToast("Failed to load detail", "error" as any);
    }
  };

  /* ================= DELETE ================= */
  const deleteParty = async (id: number) => {
    try {
      await api.delete(`/parties/${id}`);
      showToast("Deleted successfully", "success");
      setDeleteEntry(null);
      fetchParties();
    } catch (err) {
      console.log(err);
      showToast("Failed to delete", "error" as any);
    }
  };

  /* ================= DOWNLOAD SELECTED ================= */
  const downloadSelected = async () => {
    if (selectedParties.size === 0) {
      showToast("Select at least one entry to download", "warning" as any);
      return;
    }

    try {
      const ids = Array.from(selectedParties);

      const res = await api.post(
        "/parties/export",
        {
          ids,
          search: filters.search || null,
role: filters.typeFilter || null,
        },
        { responseType: "blob" }
      );

      const contentType = res.headers?.["content-type"]?.toString?.() || "text/csv";
      const blob = new Blob([res.data], { type: contentType });

      const disposition = res.headers?.["content-disposition"]?.toString?.() || "";
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const filename = match?.[1] || "customers-suppliers.csv";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
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
         <TableFilters
    values={filters}
    onChange={(key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
        setPage(1);
    }}
    onReset={() => {
        setFilters({
            search: "",
            typeFilter: "",
        });
        setPage(1);
    }}
    fields={PARTY_FILTER_FIELDS}
    actions={
        <button
            className="btn btn-primary"
            onClick={openAddModal}
        >
            + New Customer / Supplier
        </button>
    }
/>

          {/* ================= TABLE (customers + suppliers together) ================= */}
          <div className="card shadow-sm border-0">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>
                      <input
                        type="checkbox"
                        checked={rows.length > 0 && selectedParties.size === rows.length}
                        onChange={(e) => {
                          if (e.target.checked) selectAllVisible();
                          else clearSelection();
                        }}
                      />
                    </th>
                    <th>Id</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Contact Person</th>
                    <th>Phone</th>
                    <th>Email</th>
                   
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedParties.has(p.id)}
                          onChange={() => toggleSelectParty(p.id)}
                        />
                      </td>
                      <td>{partyCode(p.role, p.id)}</td>
                      <td>{p.name}</td>
                      <td>{partyTypeBadge(p.role)}</td>
                      <td>{p.contact_name || "—"}</td>
                      <td>{p.phone || "—"}</td>
                      <td>{p.email || "—"}</td>
                      
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openDetail(p.id)}
                            title="View full detail"
                          >
                            <FaEye />
                          </button>

                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => openEditModal(p)}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setDeleteEntry(p)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-muted py-4">
                        No customers or suppliers found
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

          {selectedParties.size > 0 && (
            <div className="d-flex gap-2 mb-3 align-items-center justify-content-end">
              <span>{selectedParties.size} selected</span>

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

          {/* ================= ADD / EDIT MODAL ================= */}
          {showModal && (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99999 }}
            >
              <div
                ref={modalRef}
                className="bg-white p-4 rounded"
                style={{ width: 500, maxHeight: "90vh", overflowY: "auto", position: "relative" }}
              >
                <button
                  onClick={() => setShowModal(false)}
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

                <h5>{isEditing ? "Edit" : "New"} Customer / Supplier</h5>

                {/* TYPE TOGGLE */}
                <div className="btn-group my-3" role="group">
                  <button
                    type="button"
                    className={`btn ${form.role === "customer" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setForm({ ...form, role: "customer" })}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    className={`btn ${form.role === "supplier" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setForm({ ...form, role: "supplier" })}
                  >
                    Supplier
                  </button>
                </div>

                <input
                  className="form-control my-2"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <input
                  className="form-control my-2"
                  placeholder="Contact Person"
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                />

                <input
                  className="form-control my-2"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />

                <input
                  className="form-control my-2"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />

                <input
                  className="form-control my-2"
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={saveParty} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
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
                <h5>Delete {deleteEntry.role === "customer" ? "Customer" : "Supplier"}</h5>

                <p>
                  Are you sure you want to delete <strong>{deleteEntry.name}</strong> (
                  {partyCode(deleteEntry.role, deleteEntry.id)})?
                </p>

                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-secondary" onClick={() => setDeleteEntry(null)}>
                    Cancel
                  </button>

                  <button className="btn btn-danger" onClick={() => deleteParty(deleteEntry.id)}>
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
                style={{ width: 500, maxHeight: "90vh", overflowY: "auto", position: "relative" }}
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
                  {detailEntry.name} {partyTypeBadge(detailEntry.role)}
                </h5>

                <table className="table table-sm mt-3">
                  <tbody>
                    <tr>
                      <th>Id</th>
                      <td>{partyCode(detailEntry.role, detailEntry.id)}</td>
                    </tr>
                    <tr>
                      <th>Contact Person</th>
                      <td>{detailEntry.contact_name || "—"}</td>
                    </tr>
                    <tr>
                      <th>Phone</th>
                      <td>{detailEntry.phone || "—"}</td>
                    </tr>
                    <tr>
                      <th>Email</th>
                      <td>{detailEntry.email || "—"}</td>
                    </tr>
                    <tr>
                      <th>Address</th>
                      <td>{detailEntry.address || "—"}</td>
                    </tr>
                    <tr>
                      <th>Added On</th>
                      <td>{new Date(detailEntry.created_at).toLocaleString()}</td>
                    </tr>
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

export default Parties;