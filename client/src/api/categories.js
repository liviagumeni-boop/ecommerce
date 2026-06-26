import api from "./axios";

export const getCategories = (search = "", sort = "") =>
  api.get(`/categories?search=${search}&sort=${sort}`);

export const createCategory = (name) =>
  api.post("/categories", { name });

export const updateCategory = (id, name) =>
  api.put(`/categories/${id}`, { name });

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`);