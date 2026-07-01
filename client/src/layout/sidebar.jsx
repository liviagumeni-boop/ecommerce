import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import {
  FaChartBar,
  FaBoxOpen,
  FaTags,
  FaUsers,
  FaCog,
  FaChevronDown, FaChevronUp 
} from "react-icons/fa";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [openInventory, setOpenInventory] = useState(false);
  const clickTimeout = useRef(null);

  const handleInventoryClick = () => {
    setOpenInventory((prev) => !prev);
  };

  const handleInventoryDoubleClick = () => {
    navigate("/admin/products");
  };

  const handleInventoryMouseDown = () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      handleInventoryDoubleClick();
    } else {
      clickTimeout.current = setTimeout(() => {
        handleInventoryClick();
        clickTimeout.current = null;
      }, 250);
    }
  };

  const isInventoryActive =
    location.pathname.startsWith("/admin/products") ||
    location.pathname.startsWith("/admin/sales");

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Admin Panel</h2>

      <div className="sidebar-links">

        {/* DASHBOARD */}
        <Link
          to="/admin"
          className={`sidebar-btn ${
            location.pathname === "/admin" ? "active" : ""
          }`}
        >
          <FaChartBar />
          <span>Dashboard</span>
        </Link>

        {/* INVENTORIES (SAME STYLE) */}
       <div
  className={`sidebar-btn ${isInventoryActive ? "active" : ""}`}
  onMouseDown={handleInventoryMouseDown}
  style={{
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <FaBoxOpen />
    <span>Warehouse</span>
  </div>

  {openInventory ? <FaChevronUp /> : <FaChevronDown />}
</div>
        {/* DROPDOWN (SAME STYLE BUTTONS) */}
        {openInventory && (
          <>
            <Link
              to="/admin/products"
              className={`sidebar-btn ${
                location.pathname === "/admin/products" ? "active" : ""
              }`}
              style={{ paddingLeft: "35px", fontSize: "14px" }}
            >
              <span>Products</span>
            </Link>
{/* CATEGORIES */}
        <Link
          to="/admin/categories"
          className={`sidebar-btn ${
            location.pathname === "/admin/categories" ? "active" : ""
          }`}
              style={{ paddingLeft: "35px", fontSize: "14px" }}
        >
          <span>Categories</span>
        </Link>
            <Link
              to="/admin/products/enter"
              className={`sidebar-btn ${
                location.pathname === "/admin/products/enter" ? "active" : ""
              }`}
              style={{ paddingLeft: "35px", fontSize: "14px" }}
            >
              <span>Enter </span>
            </Link>

            <Link
              to="/admin/sales/exit"
              className={`sidebar-btn ${
                location.pathname === "/admin/sales/exit" ? "active" : ""
              }`}
              style={{ paddingLeft: "35px", fontSize: "14px" }}
            >
              <span>Exit </span>
            </Link>
          </>
        )}

        

        {/* SALES */}
        <Link
          to="/admin/orders"
          className={`sidebar-btn ${
            location.pathname === "/admin/orders" ? "active" : ""
          }`}
        >
          <FaBoxOpen />
          <span>Sales</span>
        </Link>

        {/* CUSTOMERS */}
        <Link
          to="/admin/customers/users"
          className={`sidebar-btn ${
            location.pathname === "/admin/customers/users" ? "active" : ""
          }`}
        >
          <FaUsers />
          <span>Customers</span>
        </Link>

        {/* SETTINGS */}
        <Link
          to="/admin/settings"
          className={`sidebar-btn ${
            location.pathname === "/admin/settings" ? "active" : ""
          }`}
        >
          <FaCog />
          <span>Settings</span>
        </Link>

      </div>
    </aside>
  );
}

export default Sidebar;