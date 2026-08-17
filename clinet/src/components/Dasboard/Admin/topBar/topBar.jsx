import { useState, useEffect, useRef } from "react";
import { Bell, Menu, ChevronDown, LogOut, User, Check, Trash2, HelpCircle } from "lucide-react"; // 👈 Added HelpCircle here
import api from "../../../../utils/api";
import { useNavigate } from "react-router-dom";
import "./topBar.css";

export function AdminTopBar({ pageTitle, isSidebarOpen, toggleSidebar }) {
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications);
      const unread = res.data.notifications.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Notification fetch error:", err);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      fetchNotifications();
    } catch (err) {
      console.error("Mark all as read error:", err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      await api.delete('/notifications/clear-all');
      fetchNotifications();
    } catch (err) {
      console.error("Clear all error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const userString = localStorage.getItem("workwave_user");
  const user = userString ? JSON.parse(userString) : { name: "Admin", role: "admin" };
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "A";
  const roleLabel = user?.role === 'admin' ? 'Administrator' : user?.role === 'worker' ? 'Secretary' : 'Factory Worker';

  return (
    <header className="admin-topbar">
      <div className="topbar-left">
        <button className="sidebar-toggle-btn" onClick={toggleSidebar} aria-label={isSidebarOpen ? "Collapse sidebar" : "Open sidebar"}>
          <Menu size={21} />
        </button>
        <h2 className="topbar-page-title">{pageTitle}</h2>
      </div>

      <div className="topbar-right">
        {/* NOTIFICATIONS */}
        <div className="notification-wrapper" ref={notifRef}>
          <button
            className="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={21} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <div>
                  <h3>Notifications</h3>
                  <span>{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      style={{
                        background: '#eff6ff',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        color: '#2563eb',
                        fontWeight: '600',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Check size={14} /> Mark All Read
                    </button>
                  )}
                  <button
  onClick={() => navigate('/helpCenter')}
  style={{
    background: '#eff6ff',
    border: '1px solid #dbeafe',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#2563eb',
    fontWeight: '600',
    fontSize: '14px'
  }}
>
  <HelpCircle size={18} />
  Help
</button>
                  {notifications.length > 0 && (
                    <button 
                      onClick={handleClearAll}
                      style={{
                        background: '#fef2f2',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        color: '#ef4444',
                        fontWeight: '600',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={14} /> Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="empty-notifications">
                    <Bell size={25} />
                    <p>No notifications yet.</p>
                    <span>You're all caught up.</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`notification-item ${notif.isRead ? "read" : "unread"}`}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                    >
                      <div className="notification-dot" />
                      <div className="notification-content">
                        <p className="notification-title">{notif.title}</p>
                        <p className="notification-message">{notif.message}</p>
                        <p className="notification-time">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div className="profile-wrapper" ref={dropdownRef}>
          <button className="profile-btn" onClick={() => setShowDropdown(!showDropdown)} aria-label="Open profile menu">
            <div className="profile-avatar">{userInitial}</div>
            <span className="profile-name">{user.name}</span>
            <ChevronDown className={`profile-chevron ${showDropdown ? "open" : ""}`} size={16} />
          </button>

          {showDropdown && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-avatar">{userInitial}</div>
                <div>
                  <strong>{user.name}</strong>
                  <span>{roleLabel}</span>
                </div>
              </div>
              <div className="profile-dropdown-divider" />
              <button className="dropdown-btn">
                <User size={16} />
                <span>Profile Settings</span>
              </button>
              <button onClick={handleLogout} className="dropdown-btn logout-btn">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}