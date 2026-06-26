import api from "./axios";

export const getProducts = (params) =>
  api.get("/products", { params });

export const createProduct = (data) =>
  api.post("/products", data);

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`);