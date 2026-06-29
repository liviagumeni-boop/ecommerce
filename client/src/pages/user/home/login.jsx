import { useState } from "react";
import axios from "../../../api/axios";
import { loginUser } from "../../../api/login";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../componets/common/ToastContext";
import { FcGoogle } from "react-icons/fc";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
const navigate = useNavigate();
const { showToast } = useToast();
  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const { token, user } = await loginUser(email, password);

    localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
localStorage.setItem("role", user.role);
    if (user.role === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/";
    }
  } catch (err) {
    console.log(err.response?.data);
     showToast(err.response?.data?.message || "Email ose password gabim", "error");
  }
};

const loginWithGoogle = () => {
  window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`;
};

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#212631",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "white",
          padding: "30px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ marginBottom: "5px" }}>Login</h2>

        <p style={{ color: "#6b7280", marginBottom: "20px" }}>
          Welcome back! Please login
        </p>

        <form
          onSubmit={handleLogin}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #ddd",
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #ddd",
            }}
          />

          <button
            type="submit"
            style={{
              padding: "12px",
              border: "none",
              borderRadius: "10px",
              background: "#5e5cd0",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Login
          </button>

     <button
  type="button"
  onClick={loginWithGoogle}
  style={{
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    background: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontWeight: "500",
  }}
>
  <FcGoogle size={20} />
  Login with Google
</button>
            <p style={{ textAlign: "center", marginTop: "15px" }}>
          Do not have a account ?{" "}
          <span onClick={() => navigate("/signup")} style={{ color: "blue", cursor: "pointer" }}>
            Sign up 
          </span>
        </p>
        </form>
      </div>
    </div>
  );
}