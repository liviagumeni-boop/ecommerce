import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");
    const role = params.get("role");

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      window.history.replaceState({}, document.title, "/");

      navigate(role === "admin" ? "/admin" : "/");
    }
  }, []);

  return null;
}