import axios from "./axios";

export const getCategories = (search = "", sort = "") =>
  axios.get(`/categories?search=${search}&sort=${sort}`);

export const createCategory = (name) =>
  axios.post("/categories", { name });

export const updateCategory = (id, name) =>
  axios.put(`/categories/${id}`, { name });

export const deleteCategory = (id) =>
  axios.delete(`/categories/${id}`);