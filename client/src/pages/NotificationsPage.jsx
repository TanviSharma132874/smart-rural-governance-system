import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../redux/slices/notificationSlice";
import { formatDate, getStatusTone, getPriorityTone } from "../utils/formatters";
import LoaderPanel from "../components/common/LoaderPanel";

function NotificationsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { notifications, pagination, loading } = useAppSelector(
    (state) => state.notifications
  );
  
  const [accumulatedNotifications, setAccumulatedNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchNotifications({ page: currentPage, limit: 10 }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (currentPage === 1) {
      setAccumulatedNotifications(notifications);
    } else {
      setAccumulatedNotifications((prev) => {
        const newOnes = notifications.filter(
          (n) => !prev.some((p) => p._id === n._id)
        );
        return [...prev, ...newOnes];
      });
    }
  }, [notifications, currentPage]);

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const handleMarkRead = (notification) => {
    if (!notification.read) {
      dispatch(markNotificationRead(notification._id));
    }

    const entityId = notification.metadata?.entityId;
    if (entityId) {
      const routeMap = {
        Complaint: "/complaints",
        Certificate: "/certificates",
        Emergency: "/emergencies",
        Volunteer: "/volunteers",
      };

      const baseUrl = routeMap[notification.type];
      if (baseUrl) {
        navigate(`${baseUrl}?id=${entityId}`);
      }
    }
  };

  const handleLoadMore = () => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  if (loading && currentPage === 1) {
    return <LoaderPanel label="Loading notifications..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-950">Notifications</h1>
          <p className="text-ink-600">Stay updated on your requests and assignments</p>
        </div>

        {accumulatedNotifications.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-sm font-bold text-leaf-600 hover:text-leaf-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      {accumulatedNotifications.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-12 w-12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-ink-900">No notifications available</h3>
          <p className="text-ink-600">You're all caught up!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {accumulatedNotifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleMarkRead(notification)}
              className={`glass-panel cursor-pointer transition-all hover:shadow-md ${
                notification.read ? "opacity-75" : "border-l-4 border-leaf-500 shadow-sm"
              }`}
            >
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className={`font-bold text-ink-950 ${notification.read ? "" : "text-lg"}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-ink-500 whitespace-nowrap">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-ink-700">{notification.message}</p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusTone(notification.type)}`}>
                      {notification.type}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {notification.action}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getPriorityTone(notification.priority)}`}>
                      {notification.priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {pagination && pagination.page < pagination.totalPages && (
            <div className="flex justify-center pt-6">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loading}
                className="rounded-full bg-white px-8 py-3 text-sm font-bold text-ink-950 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
