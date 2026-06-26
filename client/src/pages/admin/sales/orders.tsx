import React, { useEffect, useState } from "react";
import Sidebar from "../../../layout/sidebar";
import AdminHeader from "../../../layout/headeradmin";
import api from "../../../api/axios";

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
      }
    };

    fetchOrders();
  }, []);

  /* ================= MARK DELIVERED ================= */
const markDelivered = async (id: number) => {
  try {
    console.log("MARKING DELIVERED:", id);

    const res = await api.patch(`/orders/${id}`, {
      status: "delivered",
    });

    console.log("RESPONSE:", res.data);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: "delivered" } : o
      )
    );

    setSelectedOrder(null);
  } catch (err: any) {
    console.log("ERROR MARK DELIVERED:", err?.response?.data || err);
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
    filters.status === "" || o.status === filters.status;

  return matchId && matchName && matchDate && matchStatus;
  });

  /* ================= RESET PAGE ON FILTER ================= */
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  /* ================= PAGINATION SLICE ================= */
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column">
        <AdminHeader />

        <div className="p-4 bg-light min-vh-100">

          {/* ================= FILTER BAR ================= */}
          <div className="d-flex flex-wrap gap-2 mb-3">

            {/* SEARCH ID */}
            <input
              className="form-control"
              style={{ maxWidth: 160 }}
              placeholder="Search ID..."
              value={filters.searchId}
              onChange={(e) =>
                setFilters({ ...filters, searchId: e.target.value })
              }
            />

            {/* SEARCH NAME */}
            <input
              className="form-control"
              style={{ maxWidth: 200 }}
              placeholder="Client name..."
              value={filters.searchName}
              onChange={(e) =>
                setFilters({ ...filters, searchName: e.target.value })
              }
            />

            {/* DATE */}
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
            {/* RESET */}
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
                      style={{
                        cursor:
                          order.status === "delivered"
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          order.status === "delivered" ? 0.5 : 1,
                      }}
                      onClick={() => {
                        if (order.status === "delivered") return;
                        setSelectedOrder(order);
                      }}
                    >
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
                              : order.status === "paid"
                              ? "bg-success"
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

            <span className="align-self-center">
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

        </div>
      </div>

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
                Cancel
              </button>

              <button
                className="btn btn-success"
                disabled={selectedOrder.status === "delivered"}
                onClick={() => markDelivered(selectedOrder.id)}
              >
                {selectedOrder.status === "delivered"
                  ? "Already Delivered"
                  : "Mark Delivered"}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;