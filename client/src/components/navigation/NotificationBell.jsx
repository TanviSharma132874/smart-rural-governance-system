import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";

function NotificationBell() {
  const navigate = useNavigate();
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount);

  return (
    <button
      type="button"
      onClick={() => navigate("/notifications")}
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-ink-900 transition hover:bg-slate-200"
      aria-label="View notifications"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>

      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-alert-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
