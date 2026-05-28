import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/complaints", label: "Complaints" },
  { to: "/certificates", label: "Certificates" },
];

function SidebarNav() {
  return (
    <aside className="glass-panel rounded-[32px] border border-white/70 bg-white/86 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-800/70">Workspace</p>
      <nav className="mt-5 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 text-sm font-bold transition ${
                isActive ? "bg-ink-950 text-white" : "text-ink-900 hover:bg-slate-100"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 rounded-[26px] bg-gradient-to-br from-amber-200 via-amber-100 to-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-900/70">Workflow Note</p>
        <p className="mt-3 text-sm leading-6 text-ink-900">
          This foundation consumes your current backend directly, so future modules can plug into a stable UI shell.
        </p>
      </div>
    </aside>
  );
}

export default SidebarNav;
