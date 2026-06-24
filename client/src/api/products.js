import axios from "./axios";

export const getProducts = (params) =>
  axios.get("/products", { params });

export const createProduct = (data) =>
  axios.post("/products", data);

export const deleteProduct = (id) =>
  axios.delete(`/products/${id}`);