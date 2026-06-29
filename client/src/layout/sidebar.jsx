import { Link, useLocation } from "react-router-dom";
import {
  FaChartBar,
  FaBoxOpen,
  FaTags,
  FaUsers,
  FaCog,
} from "react-icons/fa";

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">

      <h2 className="sidebar-title">Admin Panel</h2>

      <div className="sidebar-links">

        <Link
          to="/admin"
          className={`sidebar-btn ${
            location.pathname === "/admin" ? "active" : ""
          }`}
        >
          <FaChartBar />
          <span>Dashboard</span>
        </Link>

        <Link
          to="/admin/products"
          className={`sidebar-btn ${
            location.pathname === "/admin/products" ? "active" : ""
          }`}
        >
          <FaBoxOpen />
          <span>Inventories</span>
        </Link>

        <Link
          to="/admin/categories"
          className={`sidebar-btn ${
            location.pathname === "/admin/categories" ? "active" : ""
          }`}
        >
          <FaTags />
          <span>Categories</span>
        </Link>

        <Link
          to="/admin/orders"
          className={`sidebar-btn ${
            location.pathname === "/admin/orders" ? "active" : ""
          }`}
        >
          <FaBoxOpen />
          <span>Sales</span>
        </Link>

        <Link
          to="/admin/customers/users"
          className={`sidebar-btn ${
            location.pathname === "/admin/customers/users" ? "active" : ""
          }`}
        >
          <FaUsers />
          <span>Customers</span>
        </Link>

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