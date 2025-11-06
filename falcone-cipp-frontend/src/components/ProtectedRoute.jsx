import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;

  const payload = JSON.parse(atob(token.split(".")[1]));
  if (!allowedRoles.includes(payload.role)) return <Navigate to="/" replace />;

  return children;
}
