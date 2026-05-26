import { Link } from "react-router-dom";

import { getRoleLabel } from "../../utils/formatters";

function AppNavbar({ user, onLogout }) {
  return (
    <header className="glass-panel sticky top-0 z-20 rounded-[32px] border border-white/70 bg-white/80 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">Smart Rural Governance</p>
          <Link to="/dashboard" className="mt-1 block font-display text-2xl text-ink-950">
            Operations Console
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full bg-slate-100 px-4 py-2 text-right text-sm text-ink-900 sm:block">
            <p className="font-bold">{user?.name || "Authenticated User"}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-ink-800">{getRoleLabel(user?.role)}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full bg-ink-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-alert-500"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppNavbar;
