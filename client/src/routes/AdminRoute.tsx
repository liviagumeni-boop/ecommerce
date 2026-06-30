import React from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

const AdminRoute: React.FC<Props> = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  const admin = localStorage.getItem("admin");

  const parsedAdmin = admin ? JSON.parse(admin) : null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!parsedAdmin || parsedAdmin.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;