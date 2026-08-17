import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export function FactoryWorkerLayout() {
  const navigate = useNavigate();
  const workerName = JSON.parse(localStorage.getItem('workwave_user'))?.name || 'Factory Worker';

  const handleLogout = () => {
    localStorage.removeItem('workwave_token');
    localStorage.removeItem('workwave_user');
    localStorage.removeItem('workwave_user_role');
    window.dispatchEvent(new Event('workwave-auth-changed'));
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Simple Topbar ONLY - No Sidebar! */}
      <header style={{
        background: 'white', padding: '12px 24px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>🏭 WorkWave Factory Floor</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: 600, color: '#475569' }}>👋 {workerName}</span>
          <button onClick={handleLogout} style={{
            background: '#fee2e2', color: '#dc2626', border: 'none',
            padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600
          }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}