import { useEffect } from "react";

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
      dispatch(logout());
    };

    window.addEventListener("app:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("app:unauthorized", handleUnauthorized);
    };
  }, [dispatch]);

  return <AppRouter />;
}

export default App;
