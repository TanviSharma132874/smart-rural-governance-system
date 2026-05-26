import { Navigate } from "react-router-dom";

import { useAppSelector } from "../redux/hooks";

function PublicOnlyRoute({ children }) {
  const token = useAppSelector((state) => state.auth.token);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicOnlyRoute;
