import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { BACKEND_URL } from "../../../api/axios";
import { useFavorites } from "../../../componets/common/FavoritesContext";
import { useCart } from "../../../componets/common/Cartcontext";
import { useToast } from "../../../componets/common/ToastContext";
function Profile() {
  const { favorites, removeFromFavorites } = useFavorites();
const { addToCart } = useCart();
  const navigate = useNavigate();
const { showToast } = useToast();
  const userId = JSON.parse(localStorage.getItem("user"))?.id;

  const [view, setView] = useState("profile");

  const [user, setUser] = useState({
    name: "",
    email: "",
    address: "",
  });

  const [temp, setTemp] = useState({
    name: "",
    email: "",
    address: "",
  });

  const [orders, setOrders] = useState([]);
  const [edit, setEdit] = useState(false);

  const [passwords, setPasswords] = useState({
    old: "",
    new: "",
    confirm: "",
  });

 const menu = [
  { key: "profile", label: "Profile" },
  { key: "password", label: "Password" },
  { key: "orders", label: "Orders" },
  { key: "favorites", label: "Favorites" },
  { key: "address", label: "Address" },
];
  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      const res = await api.get("/users/me", {
        headers: { userid: userId },
      });

      setUser(res.data);
      setTemp(res.data);
    };

    const fetchOrders = async () => {
      const res = await api.get("/users/me/orders", {
        headers: { userid: userId },
      });

      setOrders(res.data);
    };

    fetchProfile();
    fetchOrders();
  }, [userId]);

  /* ================= SAVE PROFILE ================= */
  const saveProfile = async () => {
    const res = await api.put(
      "/users/me",
      {
        name: temp.name,
        email: temp.email,
        address: temp.address,
      },
      {
        headers: { userid: userId },
      }
    );

    setUser(res.data);
    setTemp(res.data);
    setEdit(false);
showToast("Profile updated", "success");
  };

  /* ================= SAVE ADDRESS ================= */
  const saveAddress = async () => {
    const res = await api.put(
      "/users/me/address",
      { address: temp.address },
      { headers: { userid: userId } }
    );

    setUser(res.data);
    setTemp(res.data);
   showToast("Address updated", "success");
  };

  /* ================= PASSWORD ================= */
 const savePassword = async () => {
  if (!passwords.old || !passwords.new) {
    showToast("Fill all fields", "warning");
    return;
  }
  if (passwords.new !== passwords.confirm) {
    showToast("Passwords don't match", "error");
    return;
  }

  await api.put(
    "/users/me/password",
    { old: passwords.old, new: passwords.new },
    { headers: { userid: userId } }
  );

  showToast("Password updated", "success");
  setPasswords({ old: "", new: "", confirm: "" });
};

  return (
    <div style={{ display: "flex", minHeight: "100vh", padding: 20 }}>

      {/* LEFT MENU */}
      <div style={leftBox}>
        {menu.map((m) => (
          <div
            key={m.key}
            onClick={() => setView(m.key)}
            style={{
              ...menuItem,
              background: view === m.key ? "#3d99f5" : "white",
              color: view === m.key ? "white" : "black",
            }}
          >
            {m.label}
          </div>
        ))}

        <div
          style={{ ...menuItem, background: "red", color: "white" }}
          onClick={() => navigate("/login")}
        >
          Logout
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1, paddingLeft: 20 }}>
        <div style={card}>

          {/* PROFILE */}
          {view === "profile" && (
            <>
              <h2>Profile</h2>

              <input
                disabled={!edit}
                value={temp.name}
                onChange={(e) =>
                  setTemp({ ...temp, name: e.target.value })
                }
                style={input}
              />

              <input
                disabled={!edit}
                value={temp.email}
                onChange={(e) =>
                  setTemp({ ...temp, email: e.target.value })
                }
                style={input}
              />

              {!edit ? (
                <button onClick={() => setEdit(true)} style={btn}>
                  Edit
                </button>
              ) : (
                <button onClick={saveProfile} style={btn}>
                  Save
                </button>
              )}
            </>
          )}

          {/* ORDERS */}
    {view === "orders" && (
  <>
    <h2>Orders</h2>

    {orders.length === 0 ? (
      <p style={{ color: "#666" }}>No orders yet</p>
    ) : (
      orders.map((o) => (
        <div key={o.id} style={orderRow}>
          <div>
            <strong>#{o.id}</strong>

            <div>€{Number(o.total || 0).toFixed(2)}</div>

            <div style={{ fontSize: 12, color: "#777" }}>
              {o.created_at
                ? new Date(o.created_at).toLocaleString()
                : "No date"}
            </div>
          </div>

          <span style={status(o.status || "Pending")}>
            {o.status || "Pending"}
          </span>
        </div>
      ))
    )}
  </>
)}
{/* FAVORITES */}
{view === "favorites" && (
  <>
    <h2>Favorites</h2>

    {favorites.length === 0 ? (
      <p>No favorites yet.</p>
    ) : (
      favorites.map((p) => (
        <div
          key={p.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: 15,
            borderBottom: "1px solid #ddd",
          }}
        >
          <img
            src={
              p.image
                ? `${BACKEND_URL}${p.image}`
                : "https://placehold.co/100x100"
            }
            style={{
              width: 80,
              height: 80,
              objectFit: "cover",
              borderRadius: 10,
            }}
          />

          <div style={{ flex: 1 }}>
            <h5>{p.name}</h5>

            <div>{p.brand_name}</div>

            <strong style={{ color: "green" }}>
              €{p.sale_price}
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >
            <button
              style={{
                padding: 10,
                background: "#3d99f5",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
              onClick={() => addToCart(p)}
            >
              Add to Cart
            </button>

            <button
              style={{
                padding: 10,
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
              onClick={() => removeFromFavorites(p.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))
    )}
  </>
)}

          {/* ADDRESS */}
          {view === "address" && (
            <>
              <h2>Address</h2>

              <input
                value={temp.address}
                onChange={(e) =>
                  setTemp({ ...temp, address: e.target.value })
                }
                style={input}
              />

              <button onClick={saveAddress} style={btn}>
                Save Address
              </button>
            </>
          )}

          {/* PASSWORD */}
          {view === "password" && (
            <>
              <h2>Password</h2>

              <input
                type="password"
                placeholder="Old"
                value={passwords.old}
                onChange={(e) =>
                  setPasswords({ ...passwords, old: e.target.value })
                }
                style={input}
              />

              <input
                type="password"
                placeholder="New"
                value={passwords.new}
                onChange={(e) =>
                  setPasswords({ ...passwords, new: e.target.value })
                }
                style={input}
              />

              <input
                type="password"
                placeholder="Confirm"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    confirm: e.target.value,
                  })
                }
                style={input}
              />

              <button onClick={savePassword} style={btn}>
                Save Password
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

/* styles */
const leftBox = { width: 200, background: "white", padding: 15 };
const menuItem = { padding: 10, marginBottom: 8, cursor: "pointer" };
const card = { background: "white", padding: 20 };
const input = { width: "100%", padding: 10, marginTop: 10 };
const btn = { width: "100%", marginTop: 10, padding: 10 };
const orderRow = { display: "flex", justifyContent: "space-between", padding: 10 };
const status = (s = "") => {
  const map = {
    delivered: { bg: "#22c55e", label: "Delivered" },
    pending: { bg: "#f59e0b", label: "Pending" },
    cancelled: { bg: "#ef4444", label: "Cancelled" },
  };

  const key = s.toLowerCase();
  const cfg = map[key] || { bg: "#3d99f5", label: s };

  return {
    padding: "18px 10px",
    background: cfg.bg,
    color: "white",
    borderRadius: 20,
    fontSize: "12px",
    fontWeight: "500",
    display: "inline-block",
  };
};

export default Profile;