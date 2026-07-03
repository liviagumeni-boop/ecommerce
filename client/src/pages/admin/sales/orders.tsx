import React, { useEffect, useState } from "react";
import Sidebar from "../../../layout/sidebar";
import AdminHeader from "../../../layout/headeradmin";
import api from "../../../api/axios";
import { useToast } from "../../../componets/common/ToastContext";

/* ================= TYPES ================= */
type Order = {
  id: number;
  total: number;
  status: string;
  created_at: string;
  user_id: number;
  user_name?: string;
};

const Orders: React.FC = () => {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());

  /* ================= FILTERS ================= */
  const [filters, setFilters] = useState({
    searchId: "",
    searchName: "",
    date: "",
    status: "",
  });

  /* ================= PAGINATION ================= */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders");
        setOrders(res.data);
      } catch (err) {
        console.log(err);
        showToast("Failed to load orders", "error");
      }
    };

    fetchOrders();
  }, []);

  /* ================= STATUS UPDATE ================= */
  const markDelivered = async (id: number) => {
    try {
      await api.patch(`/orders/${id}`, { status: "delivered" });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, status: "delivered" } : o
        )
      );

      setSelectedOrder(null);
      showToast("Order marked as delivered", "success");
    } catch (err) {
      console.log(err);
      showToast("Failed to update order", "error");
    }
  };

  const markPending = async (id: number) => {
    try {
      await api.patch(`/orders/${id}`, { status: "pending" });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, status: "pending" } : o
        )
      );

      setSelectedOrder(null);
      showToast("Order marked as pending", "success");
    } catch (err) {
      console.log(err);
      showToast("Failed to update order", "error");
    }
  };

  /* ================= FILTER LOGIC ================= */
  const filteredOrders = orders.filter((o) => {
    const matchId =
      filters.searchId === "" ||
      o.id.toString().includes(filters.searchId);

    const matchName =
      filters.searchName === "" ||
      (o.user_name || "")
        .toLowerCase()
        .includes(filters.searchName.toLowerCase());

    const matchDate =
      filters.date === "" ||
      new Date(o.created_at).toISOString().split("T")[0] ===
        filters.date;

  const matchStatus =
  filters.status === "" ||
  (o.status || "").toLowerCase().trim() === filters.status.toLowerCase().trim();

    return matchId && matchName && matchDate && matchStatus;
  });

  /* ================= RESET PAGE ================= */
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  /* ================= PAGINATION ================= */
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ================= SELECTION ================= */
  const toggleSelectOrder = (id: number) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedOrders(new Set(paginatedOrders.map((o) => o.id)));
  };

  const clearSelection = () => setSelectedOrders(new Set());

  /* ================= DOWNLOAD ================= */
  const downloadSelected = async () => {
  if (selectedOrders.size === 0) {
    showToast("Select at least one order", "warning");
    return;
  }

  try {
    const responses = await Promise.all(
      Array.from(selectedOrders).map((id) =>
        api.get(`/orders/${id}`) // ⚠️ you need this endpoint
      )
    );

    const orders = responses.map((r) => r.data);

    const rows: any[] = [];

    orders.forEach((o) => {
      rows.push({
        OrderID: o.id,
        Date: new Date(o.created_at).toLocaleString(),
        Client: o.user_name || o.user_id,
        Total: o.total,
        UserID: o.user_id,
      });
    });

    const headers = Object.keys(rows[0]);

    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => `"${r[h] ?? ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "orders-detailed.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.log(err);
    showToast("Download failed", "error");
  }
};
  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column">
        <AdminHeader />

        <div className="p-4 bg-light min-vh-100">

          {/* ================= FILTERS ================= */}
          <div className="d-flex flex-wrap gap-2 mb-3">

            <input
              className="form-control"
              style={{ maxWidth: 160 }}
              placeholder="Search ID..."
              value={filters.searchId}
              onChange={(e) =>
                setFilters({ ...filters, searchId: e.target.value })
              }
            />

            <input
              className="form-control"
              style={{ maxWidth: 200 }}
              placeholder="Client name..."
              value={filters.searchName}
              onChange={(e) =>
                setFilters({ ...filters, searchName: e.target.value })
              }
            />

            <input
              type="date"
              className="form-control"
              style={{ maxWidth: 180 }}
              value={filters.date}
              onChange={(e) =>
                setFilters({ ...filters, date: e.target.value })
              }
            />

            <select
              className="form-control"
              style={{ maxWidth: 160 }}
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="delivered">Delivered</option>
            </select>

            <button
              className="btn btn-outline-secondary"
              onClick={() =>
                setFilters({
                  searchId: "",
                  searchName: "",
                  date: "",
                  status: "",
                })
              }
            >
              Reset
            </button>
          </div>

          {/* ================= TABLE ================= */}
          <div className="card shadow-sm border-0">
            <div className="table-responsive">

              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          paginatedOrders.length > 0 &&
                          selectedOrders.size === paginatedOrders.length
                        }
                        onChange={(e) =>
                          e.target.checked
                            ? selectAllVisible()
                            : clearSelection()
                        }
                      />
                    </th>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      style={{ cursor: "pointer" }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                        />
                      </td>

                      <td>#{order.id}</td>

                      <td>
                        {new Date(order.created_at).toLocaleString()}
                      </td>

                      <td>{order.user_name || order.user_id}</td>

                      <td>€{order.total}</td>

                      <td>
                        <span
                          className={`badge ${
                            order.status === "delivered"
                              ? "bg-primary"
                              : order.status === "pending"
                              ? "bg-warning text-dark"
                              : "bg-secondary"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          </div>

          {/* ================= PAGINATION ================= */}
          <div className="d-flex justify-content-center mt-3 gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </button>

            <span>
              Page {currentPage}
            </span>

            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={
                filteredOrders.length <= currentPage * itemsPerPage
              }
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>

          {/* ================= BULK ACTIONS ================= */}
          {selectedOrders.size > 0 && (
            <div className="d-flex justify-content-end gap-2 mt-3">
              <span>{selectedOrders.size} selected</span>

              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={selectAllVisible}
              >
                Select All
              </button>

              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={clearSelection}
              >
                Clear
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={downloadSelected}
              >
                Download
              </button>
            </div>
          )}

          {/* ================= MODAL ================= */}
          {selectedOrder && (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
              }}
              onClick={() => setSelectedOrder(null)}
            >
              <div
                className="bg-white p-4 rounded shadow"
                style={{ width: 350 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h5>Order #{selectedOrder.id}</h5>

                <p>
                  <b>Client:</b>{" "}
                  {selectedOrder.user_name || selectedOrder.user_id}
                </p>

                <p>
                  <b>Total:</b> €{selectedOrder.total}
                </p>

                <p>
                  <b>Status:</b> {selectedOrder.status}
                </p>

                <div className="d-flex justify-content-end gap-2 mt-3">

                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Close
                  </button>

                  {selectedOrder.status !== "delivered" && (
                    <button
                      className="btn btn-success"
                      onClick={() =>
                        markDelivered(selectedOrder.id)
                      }
                    >
                      Mark Delivered
                    </button>
                  )}

                  {selectedOrder.status !== "pending" && (
                    <button
                      className="btn btn-warning"
                      onClick={() =>
                        markPending(selectedOrder.id)
                      }
                    >
                      Mark Pending
                    </button>
                  )}

                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Orders;