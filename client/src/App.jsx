import { useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";

import AppRouter from "./routes/AppRouter";
import { loadCurrentUser, logout } from "./redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "./redux/hooks";

function App() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(loadCurrentUser());
    }
  }, [dispatch, token]);

  useEffect(() => {
    const handleUnauthorized = () => {
      toast.error("Your session expired. Please sign in again.");
      dispatch(logout());
    };

    window.addEventListener("app:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("app:unauthorized", handleUnauthorized);
    };
  }, [dispatch]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "18px",
            background: "#172033",
            color: "#fff",
          },
        }}
      />
      <AppRouter />
    </>
  );
}

export default App;
