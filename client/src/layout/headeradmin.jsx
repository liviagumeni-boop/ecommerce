import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt, FaCog } from "react-icons/fa";

function AdminHeader() {
  const [openProfile, setOpenProfile] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // 👉 TITULLI I FAQES
  const pageTitles = {
    "/admin": "Dashboard",
    "/admin/products": "Products",
    "/admin/categories": "Categories",
    "/admin/orders": "Sales",
    "/admin/customers/users": "Users",
    "/admin/settings": "Settings",
  };

  const currentPage =
    pageTitles[location.pathname] || "Dashboard";

  // 👉 LOGOUT
const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user"); // if you store user data
  sessionStorage.clear(); // optional

  navigate("/", { replace: true });
};
  // 👉 SETTINGS NAVIGIM
  const goToSettings = () => {
    navigate("/admin/settings");
    setOpenProfile(false);
  };

  return (
    <header className="navbar navbar-dark bg-dark px-3 d-flex justify-content-between">

      {/* LEFT: PAGE TITLE */}
      <div className="d-flex align-items-center">
        <h5 className="text-white mb-0">
          {currentPage}
        </h5>
      </div>

      {/* RIGHT: PROFILE DROPDOWN */}
      <div className="position-relative">

        <button
          className="btn btn-outline-light"
          onClick={() => setOpenProfile(!openProfile)}
        >
          <FaUserCircle size={22} />
        </button>

        {openProfile && (
          <div
            className="position-absolute end-0 mt-2 bg-white shadow rounded p-2"
            style={{ width: 180, zIndex: 999 }}
          >

            <div className="px-2 py-1 fw-bold">
              Admin
            </div>

            <hr className="my-2" />

            {/* SETTINGS */}
            <button
              className="btn btn-light w-100 d-flex align-items-center gap-2 mb-2"
              onClick={goToSettings}
            >
              <FaCog />
              Settings
            </button>

            {/* LOGOUT */}
            <button
              className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={handleLogout}
            >
              <FaSignOutAlt />
              Log Out
            </button>

          </div>
        )}

      </div>

    </header>
  );
}

export default AdminHeader;