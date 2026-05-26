import { Outlet } from "react-router-dom";

import AppNavbar from "../components/navigation/AppNavbar";
import SidebarNav from "../components/navigation/SidebarNav";
import { logout } from "../redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";

function DashboardLayout() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="app-shell-grid min-h-screen px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <AppNavbar user={user} onLogout={() => dispatch(logout())} />
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <SidebarNav />
          <main className="page-enter min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
