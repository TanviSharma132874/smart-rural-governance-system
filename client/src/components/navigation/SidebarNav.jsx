import { NavLink } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";

function SidebarNav() {
  const user = useAppSelector((state) => state.auth.user);

  const canManageResources = [
    "panchayatOfficer",
    "districtAdmin",
    "stateAdmin",
    "superAdmin",
  ].includes(user?.role);

  const navItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/complaints", label: "Complaints" },
    { to: "/certificates", label: "Certificates" },
    { to: "/emergencies", label: "Emergencies" },
    { to: "/announcements", label: "Announcements" },
    ...(canManageResources ? [{ to: "/resources", label: "Resources" }] : []),
    { to: "/volunteers", label: "Volunteers" },
    { to: "/profile", label: "Profile" },
  ];

  return (
    <aside className="glass-panel rounded-[32px] border border-white/70 bg-white/86 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-800/70">
        Workspace
      </p>

      <nav className="mt-5 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 text-sm font-bold transition ${
                isActive
                  ? "bg-ink-950 text-white"
                  : "text-ink-900 hover:bg-slate-100"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default SidebarNav;