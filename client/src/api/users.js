import axios from "./axios";

export const getUsers = (page, limit = 9) =>
  axios.get(`/users?page=${page}&limit=${limit}`);

export const deleteUser = (id) =>
  axios.delete(`/users/${id}`);