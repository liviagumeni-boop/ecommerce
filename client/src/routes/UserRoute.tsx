import React from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

const UserRoute: React.FC<Props> = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();

  console.log("UserRoute:", { token, role });

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // block admin from user pages
  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default UserRoute;