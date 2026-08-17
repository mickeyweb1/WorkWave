import { useState, useEffect } from 'react';
import api from '../../../utils/api'; // Adjust path if needed
import { Bell, CheckCircle, CheckCheck, AlertTriangle, Info, XCircle, Trash2 } from 'lucide-react';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      fetchNotifications();
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error("Mark single read error:", err);
    }
  };

  // Filter logic
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  // Helper to pick icon and color based on notification type
  const getTypeStyle = (type) => {
    switch(type) {
      case 'warning': return { icon: <AlertTriangle size={20}/>, color: '#b45309', bg: '#fef3c7' };
      case 'danger': return { icon: <XCircle size={20}/>, color: '#991b1b', bg: '#fee2e2' };
      case 'success': return { icon: <CheckCircle size={20}/>, color: '#166534', bg: '#dcfce7' };
      default: return { icon: <Info size={20}/>, color: '#1e40af', bg: '#dbeafe' };
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading notifications...</div>;

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Bell size={28} color="#2563eb" /> Notifications
        </h1>
        
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllRead}
            style={{ 
              backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', 
              borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px'
            }}
          >
            <CheckCheck size={16} /> Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => setFilter('all')}
          style={filterBtnStyle(filter === 'all')}
        >
          All ({notifications.length})
        </button>
        <button 
          onClick={() => setFilter('unread')}
          style={filterBtnStyle(filter === 'unread')}
        >
          Unread ({notifications.filter(n => !n.isRead).length})
        </button>
      </div>

      {/* Notification List */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <Bell size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontWeight: 'bold' }}>You're all caught up!</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px' }}>No notifications to show right now.</p>
          </div>
        ) : (
          filteredNotifications.map(notif => {
            const style = getTypeStyle(notif.type);
            return (
              <div 
                key={notif._id} 
                style={{ 
                  display: 'flex', gap: '16px', padding: '20px', borderBottom: '1px solid #f1f5f9',
                  backgroundColor: notif.isRead ? 'white' : '#f8fafc',
                  transition: 'background 0.2s'
                }}
              >
                {/* Icon Badge */}
                <div style={{ backgroundColor: style.bg, color: style.color, padding: '10px', borderRadius: '50%', height: 'fit-content', flexShrink: 0 }}>
                  {style.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: notif.isRead ? 'normal' : 'bold', color: '#0f172a', fontSize: '15px' }}>
                        {notif.title}
                        {!notif.isRead && <span style={{ backgroundColor: '#ef4444', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', marginLeft: '8px' }}></span>}
                      </p>
                      <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#475569' }}>{notif.message}</p>
                      <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Action Button */}
                    {!notif.isRead && (
                      <button 
                        onClick={() => handleMarkSingleRead(notif._id)}
                        style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Helper for filter buttons
const filterBtnStyle = (isActive) => ({
  padding: '8px 16px', borderRadius: '20px', border: `1px solid ${isActive ? '#2563eb' : '#e2e8f0'}`,
  backgroundColor: isActive ? '#eff6ff' : 'white', color: isActive ? '#1e40af' : '#64748b',
  fontWeight: isActive ? 'bold' : 'normal', cursor: 'pointer', fontSize: '13px'
});

