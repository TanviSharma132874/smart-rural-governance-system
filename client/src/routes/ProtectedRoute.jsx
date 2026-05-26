import { Navigate, useLocation } from "react-router-dom";

import LoaderPanel from "../components/common/LoaderPanel";
import { useAppSelector } from "../redux/hooks";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { token, user, loading } = useAppSelector((state) => state.auth);

  if (loading && token && !user) {
    return (
      <div className="app-shell-grid flex min-h-screen items-center justify-center px-4">
        <LoaderPanel label="Restoring your secure session..." />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
