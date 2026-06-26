import axios from "axios";

const api = axios.create({
  baseURL: "https://ecommerce-x4el.onrender.com/api",  // hardcoded temporarily
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;