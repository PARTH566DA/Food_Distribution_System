import { useEffect, useMemo, useState } from 'react';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications';

const formatRelativeTime = (raw) => {
  if (!raw) return 'Just now';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const feed = await fetchNotifications();
      setNotifications(feed.items);
      setUnreadCount(feed.unreadCount);
    } catch (err) {
      setError(err.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const hasNotifications = notifications.length > 0;
  const titleLabel = useMemo(() => {
    if (!hasNotifications) return 'Notifications';
    if (unreadCount <= 0) return 'All caught up';
    return `${unreadCount} unread`;
  }, [hasNotifications, unreadCount]);

  const renderIcon = (type) => {
    if (type === 'location') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#FF8B77" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#FF8B77" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    );
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err.message || 'Could not mark all notifications as read.');
    }
  };

  const handleOpenNotification = async (item) => {
    if (item.read) return;
    try {
      await markNotificationRead(item.notificationId);
      setNotifications((prev) => prev.map((entry) => {
        if (entry.notificationId !== item.notificationId) return entry;
        return { ...entry, read: true };
      }));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err.message || 'Could not update notification status.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-[#A88E88]">{titleLabel}</p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="rounded-full border border-[#F1D8D3] px-3 py-1 text-[11px] font-semibold text-[#8F726C] hover:bg-[#FFF3F1]"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading && (
        <div className="rounded-xl border border-[#F3DFDB] bg-white p-4 text-xs text-[#9E827D]">
          Loading notifications...
        </div>
      )}

      {!loading && error && (
        <div className="mb-3 rounded-xl border border-[#F7C6C0] bg-[#FFF0EE] p-3 text-xs text-[#A14B41]">
          {error}
        </div>
      )}

      {!loading && hasNotifications ? (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <button
              type="button"
              key={notification.notificationId}
              onClick={() => handleOpenNotification(notification)}
              className={`bg-white rounded-xl p-4 shadow-sm text-left border transition-colors ${
                notification.read
                  ? 'border-transparent'
                  : 'border-[#FFD8D2] bg-[#FFF9F8]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FED0CB] flex items-center justify-center shrink-0">
                  {renderIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#6B5454]">{notification.title}</p>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-[#FF8B77] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#C0ABA6] mt-1">{notification.message}</p>
                  <p className="text-xs text-[#D9C7C3] mt-2">{formatRelativeTime(notification.createdAt)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        !loading && (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#C0ABA6" className="w-16 h-16 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <p className="text-[#C0ABA6] text-sm">No notifications yet</p>
        </div>
        )
      )}
    </div>
  );
};

export default Notification;
