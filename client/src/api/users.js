import api from "./axios";

export const getUsers = (page, limit = 9) =>
  api.get(`/users?page=${page}&limit=${limit}`);

export const deleteUser = (id) =>
  api.delete(`/users/${id}`);