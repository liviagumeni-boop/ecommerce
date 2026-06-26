import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import SignupForm from "../../../componets/forms/SingupForm";

function Signup() {
  const navigate = useNavigate();

  const handleSignup = async (data) => {
    try {
      const res = await api.post("/auth/signup", data);

      console.log("Signup success:", res.data);

      alert("Account created!");

      navigate("/login");
    } catch (err) {
      console.log(err.response?.data);
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#212631" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "white", padding: "30px", borderRadius: "16px" }}>
        <h2>Create Account</h2>
        <p>Join us and start shopping</p>

        <SignupForm onSubmit={handleSignup} />

        <p style={{ textAlign: "center", marginTop: "15px" }}>
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} style={{ color: "blue", cursor: "pointer" }}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;