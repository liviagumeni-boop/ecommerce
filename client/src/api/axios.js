import axios from "axios";

const api = axios.create({
  baseURL: "https://ecommerce-366p.onrender.com/api",  // hardcoded temporarily
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;