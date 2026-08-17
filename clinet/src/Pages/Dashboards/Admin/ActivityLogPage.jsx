import { useState, useEffect } from 'react';
import api from '../../../utils/api'; // Adjust path if needed
import { ShieldAlert, LogIn, ShoppingCart, XCircle, TrendingDown, User } from 'lucide-react';

export function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/activity');
        setLogs(res.data.logs);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Helper to pick the right icon and color based on the action
  const getActionStyle = (action) => {
    switch(action) {
      case 'LOGIN': return { icon: <LogIn size={18}/>, color: '#2563eb', bg: '#dbeafe' };
      case 'RECORD_SALE': return { icon: <ShoppingCart size={18}/>, color: '#16a34a', bg: '#dcfce7' };
      case 'VOID_SALE': return { icon: <XCircle size={18}/>, color: '#dc2626', bg: '#fee2e2' };
      case 'RECORD_EXPENSE': return { icon: <TrendingDown size={18}/>, color: '#ea580c', bg: '#ffedd5' };
      default: return { icon: <User size={18}/>, color: '#64748b', bg: '#f1f5f9' };
    }
  };

  if (loading) return <div style={{padding: '24px'}}>Loading security logs...</div>;

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={28} color="#dc2626" /> Security & Activity Log
        </h1>
        <p style={{ color: '#666' }}>A permanent, unbreakable record of every action taken in the system.</p>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
        {logs.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No activity recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {logs.map(log => {
              const style = getActionStyle(log.action);
              return (
                <div key={log._id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                  {/* Icon Badge */}
                  <div style={{ backgroundColor: style.bg, color: style.color, padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {style.icon}
                  </div>
                  
                  {/* Text Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <p style={{ margin: 0, fontWeight: 'bold', color: '#0f172a' }}>
                        {log.userName} <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>({log.userRole})</span>
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#334155' }}>
                      <strong style={{color: style.color}}>{log.action.replace('_', ' ')}:</strong> {log.details}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}