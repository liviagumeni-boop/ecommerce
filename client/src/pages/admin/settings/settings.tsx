import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";

import Sidebar from "../../../layout/sidebar";
import AdminHeader from "../../../layout/headeradmin";
import { SaveButton } from "../../../componets/ui/button";
import { useToast } from "../../../componets/common/ToastContext";
import {
  FaStore,
  FaMoon,
  FaLock,
  FaBell,
  FaSignOutAlt,
  FaCreditCard,
} from "react-icons/fa";

const Settings: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("store");

  // STORE
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");

  // appearance
  const [darkMode, setDarkMode] = useState(false);

  // notifications
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(true);
const { showToast } = useToast();
  // security
  const [twoFA, setTwoFA] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [autoLogout, setAutoLogout] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get("/store-settings");

        setStoreName(res.data.store_name || "");
        setEmail(res.data.email || "");
      } catch (err) {
        console.error(err);
      }
    };

    fetchStore();
  }, []);

  const handleSaveStore = async () => {
    try {
      await api.put("/store-settings", { store_name: storeName, email });

    showToast("Store settings saved", "success");
    } catch (err) {
      console.error(err);
    }
  };

const [secretKey, setSecretKey] = useState("");
const [publishableKey, setPublishableKey] = useState("");
const [webhookSecret, setWebhookSecret] = useState("");
const [maskedSecret, setMaskedSecret] = useState<string | null>(null);
const [maskedWebhook, setMaskedWebhook] = useState<string | null>(null);
const [savingStripe, setSavingStripe] = useState(false);

useEffect(() => {
  const fetchStripe = async () => {
    try {
      const res = await api.get("/admin/settings/stripe");
      setMaskedSecret(res.data.secretKey);
      setPublishableKey(res.data.publishableKey || "");
      setMaskedWebhook(res.data.webhookSecret);
    } catch (err) {
      console.error(err);
    }
  };
  fetchStripe();
}, []);

const handleSaveStripe = async () => {
  if (!secretKey && !webhookSecret && !publishableKey) {
    showToast("Nothing to save", "error");
    return;
  }
  setSavingStripe(true);
  try {
    const payload: Record<string, string> = {};
    if (publishableKey) payload.publishableKey = publishableKey;
    if (secretKey) payload.secretKey = secretKey;
    if (webhookSecret) payload.webhookSecret = webhookSecret;

    await api.post("/admin/settings/stripe", payload);
    showToast("Stripe settings saved", "success");

    // clear sensitive inputs, refresh masked display
    setSecretKey("");
    setWebhookSecret("");
    const res = await api.get("/admin/settings/stripe");
    setMaskedSecret(res.data.secretKey);
    setMaskedWebhook(res.data.webhookSecret);
  } catch (err) {
    console.error(err);
    showToast("Failed to save Stripe settings", "error");
  } finally {
    setSavingStripe(false);
  }
};


const handleLogout = () => {
  // Remove admin auth
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");

  // Remove shared auth
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");

  sessionStorage.clear();

  // Update the rest of the app
  window.dispatchEvent(new Event("authChanged"));

  // Go to login page
  navigate("/", { replace: true });
};

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);

    if (!darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };

  return (
    <div className="d-flex">

      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column">

        <AdminHeader />

        <div className="p-4 bg-light min-vh-100">

          <div className="row g-3">

            {/* MINI MENU */}
            <div className="col-12 col-md-3">

              <div className="card shadow-sm border-0">

                <div className="list-group list-group-flush">

                  <button
                    className={`list-group-item list-group-item-action ${
                      activeTab === "store" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("store")}
                  >
                    <FaStore className="me-2" />
                    Store
                  </button>

                  <button
                    className={`list-group-item list-group-item-action ${
                      activeTab === "appearance" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("appearance")}
                  >
                    <FaMoon className="me-2" />
                    Appearance
                  </button>

                  <button
                    className={`list-group-item list-group-item-action ${
                      activeTab === "notifications" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("notifications")}
                  >
                    <FaBell className="me-2" />
                    Notifications
                  </button>

                  <button
                    className={`list-group-item list-group-item-action ${
                      activeTab === "security" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("security")}
                  >
                    <FaLock className="me-2" />
                    Security
                  </button>
<button
  className={`list-group-item list-group-item-action ${activeTab === "payments" ? "active" : ""}`}
  onClick={() => setActiveTab("payments")}
>
  <FaCreditCard className="me-2" />
  Payments
</button>
                  <button
                    className="list-group-item list-group-item-action text-danger"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="me-2" />
                    Logout
                  </button>

                </div>

              </div>
            </div>

            {/* CONTENT */}
            <div className="col-12 col-md-9">

              <div className="card shadow-sm border-0 p-4">

                {/* STORE */}
                {activeTab === "store" && (
                  <>
                    <h5>Store Settings</h5>

                    <input
                      className="form-control my-2"
                      placeholder="Store Name"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />

                    <input
                      className="form-control my-2"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />

                    <SaveButton onClick={handleSaveStore} />
                  </>
                )}

                {/* APPEARANCE */}
                {activeTab === "appearance" && (
                  <>
                    <h5>Appearance</h5>

                    <div className="form-check form-switch mt-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={darkMode}
                        onChange={toggleTheme}
                      />
                      <label className="form-check-label">
                        Dark Mode
                      </label>
                    </div>
                  </>
                )}

                {/* NOTIFICATIONS */}
                {activeTab === "notifications" && (
                  <>
                    <h5>Notifications</h5>

                    <div className="form-check form-switch mt-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={emailNotif}
                        onChange={() => setEmailNotif(!emailNotif)}
                      />
                      <label className="form-check-label">
                        Email Notifications
                      </label>
                    </div>

                    <div className="form-check form-switch mt-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={pushNotif}
                        onChange={() => setPushNotif(!pushNotif)}
                      />
                      <label className="form-check-label">
                        Push Notifications
                      </label>
                    </div>

                    <div className="form-check form-switch mt-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={orderUpdates}
                        onChange={() => setOrderUpdates(!orderUpdates)}
                      />
                      <label className="form-check-label">
                        Order Updates
                      </label>
                    </div>
                  </>
                )}

{activeTab === "payments" && (
  <>
    <h5>Stripe</h5>

    <label className="form-label mt-2">Publishable Key</label>
    <input
      className="form-control my-1"
      placeholder="pk_live_..."
      value={publishableKey}
      onChange={(e) => setPublishableKey(e.target.value)}
    />

    <label className="form-label mt-3">Secret Key</label>
    <input
      type="password"
      className="form-control my-1"
      placeholder={maskedSecret || "Not set"}
      value={secretKey}
      onChange={(e) => setSecretKey(e.target.value)}
    />
    <small className="text-muted">
      Leave blank to keep the current key. Enter a new value to replace it.
    </small>

    <label className="form-label mt-3">Webhook Signing Secret</label>
    <input
      type="password"
      className="form-control my-1"
      placeholder={maskedWebhook || "Not set"}
      value={webhookSecret}
      onChange={(e) => setWebhookSecret(e.target.value)}
    />
    <small className="text-muted">
      Leave blank to keep the current value.
    </small>

    <button
      className="btn btn-primary mt-3"
      onClick={handleSaveStripe}
      disabled={savingStripe}
    >
      {savingStripe ? "Saving..." : "Save Stripe Settings"}
    </button>
  </>
)}



                {/* SECURITY */}
                {activeTab === "security" && (
                  <>
                    <h5>Security</h5>

                    <div className="form-check form-switch mt-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={twoFA}
                        onChange={() => setTwoFA(!twoFA)}
                      />
                      <label className="form-check-label">
                        Enable 2FA
                      </label>
                    </div>

                    <div className="form-check form-switch mt-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={loginAlerts}
                        onChange={() => setLoginAlerts(!loginAlerts)}
                      />
                      <label className="form-check-label">
                        Login Alerts
                      </label>
                    </div>

                    <div className="form-check form-switch mt-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={autoLogout}
                        onChange={() => setAutoLogout(!autoLogout)}
                      />
                      <label className="form-check-label">
                        Auto Logout
                      </label>
                    </div>

                    <hr className="my-4" />

                    <h6>Change Password</h6>

                    <input
                      type="password"
                      className="form-control my-2"
                      placeholder="Current Password"
                    />

                    <input
                      type="password"
                      className="form-control my-2"
                      placeholder="New Password"
                    />

                    <input
                      type="password"
                      className="form-control my-2"
                      placeholder="Confirm New Password"
                    />

                    <button className="btn btn-primary w-100 mt-2">
                      Update Password
                    </button>

                    <button className="btn btn-outline-danger mt-3 w-100">
                      Logout from all devices
                    </button>
                  </>
                )}

              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

export default Settings;