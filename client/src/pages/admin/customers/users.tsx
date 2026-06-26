import React, { useEffect, useState } from "react";
import api from "../../../api/axios";
import Sidebar from "../../../layout/sidebar";
import AdminHeader from "../../../layout/headeradmin";
import { FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  orders: number;
  loyalty: number;
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);

  const perPage = 9;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/admin");
      setUsers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  // remove admin
  const filtered = users.filter((u) => u.role !== "admin");

  const totalPages = Math.ceil(filtered.length / perPage);

  const start = (page - 1) * perPage;

  const currentUsers = filtered.slice(start, start + perPage);

  const goPrev = () => setPage((p) => Math.max(p - 1, 1));

  const goNext = () =>
    setPage((p) => Math.min(p + 1, totalPages || 1));

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column">
        <AdminHeader />

        <div className="p-4 bg-light min-vh-100">

          <h3 className="mb-4">Users</h3>

          <div className="row g-3">
            {currentUsers.map((u) => (
              <div className="col-12 col-md-6 col-lg-4" key={u.id}>
                <div className="card shadow-sm border-0 h-100 position-relative">

                  <button
                    onClick={() => handleDelete(u.id)}
                    className="btn btn-light position-absolute"
                    style={{ top: 10, right: 10 }}
                  >
                    <FaTrash color="red" />
                  </button>

                  <div className="card-body">
                    <h5>{u.name}</h5>
                    <small>{u.email}</small>

                    {/* ORDERS */}
                    <div className="mt-2">
                      <small>Orders: {u.orders}</small>
                    </div>

                    {/* LOYALTY */}
                    <div className="mt-2">
                      <small>Loyalty: {u.loyalty}%</small>

                      <div className="progress">
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${u.loyalty}%` }}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          <div className="d-flex justify-content-center gap-3 mt-4">

            <button disabled={page === 1} onClick={goPrev}>
              <FaChevronLeft />
            </button>

            <span>
              {page} / {totalPages || 1}
            </span>

            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={goNext}
            >
              <FaChevronRight />
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Users;