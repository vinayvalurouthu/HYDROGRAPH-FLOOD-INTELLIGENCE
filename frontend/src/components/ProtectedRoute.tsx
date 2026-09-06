import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "../context/AuthContext";
import { Lock } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: Array<"OPERATOR" | "CITIZEN" | "RESCUER">;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role as any)) {
    const getDefaultRolePath = (userRole: UserRole) => {
      switch (userRole) {
        case "OPERATOR":
          return "/operator";
        case "CITIZEN":
          return "/citizen";
        case "RESCUER":
          return "/rescue";
        default:
          return "/login";
      }
    };

    return <Navigate to={getDefaultRolePath(role)} replace />;
  }

  return children;
};
