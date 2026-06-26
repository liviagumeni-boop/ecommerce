import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://ecommerce-x4el.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;