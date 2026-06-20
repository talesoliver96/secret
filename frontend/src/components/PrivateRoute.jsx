import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("@secretburger:token");

  if (!token) {
    return <Navigate to="/admin/login" />;
  }

  return children;
}