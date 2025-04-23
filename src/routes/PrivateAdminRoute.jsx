import { Navigate } from "react-router-dom";
import { auth } from "../firebase"; // Import Firebase Auth

const PrivateAdminRoute = ({ children }) => {
  const user = auth.currentUser;

  // Check if user is logged in and has admin role
  if (!user || user.role !== "admin") {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateAdminRoute;
