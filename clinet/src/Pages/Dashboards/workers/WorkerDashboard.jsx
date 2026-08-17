import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { DollarSign, TrendingDown, TrendingUp, Package, Loader2, ClipboardList } from 'lucide-react';

export default function WorkerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // 📅 PERIOD SELECTOR STATE (Default to 'today')
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    fetchStats();
  }, [period]); // Re-fetch whenever the period changes

  const fetchStats = async () => {
    setLoading(true); // Show loading spinner while fetching
    try {
      // Send the selected period to the backend
      const res = await api.get(`/dashboard/stats?period=${period}`);
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Loader2 size={40} className="spin" /></div>;
  }

  const workerName = JSON.parse(localStorage.getItem('workwave_user'))?.name || 'Supervisor';

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER WITH PERIOD SELECTOR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>👋 Welcome back, {workerName}</h1>
          <p style={{ color: '#64748b' }}>Here is the summary of the business.</p>
        </div>

        {/* PERIOD DROPDOWN */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            outline: 'none',
            backgroundColor: 'white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <option value="today">📅 Today</option>
          <option value="week">📆 This Week</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #10b981', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '8px', color: '#10b981' }}><TrendingUp size={24} /></div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Total Sales</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '20px' }}>₦{(stats?.totalRevenue || 0).toLocaleString()}</h3>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ef4444', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '8px', color: '#ef4444' }}><TrendingDown size={24} /></div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Total Expenses</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '20px' }}>₦{(stats?.totalExpenses || 0).toLocaleString()}</h3>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #2563eb', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', color: '#2563eb' }}><DollarSign size={24} /></div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Net Profit</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '20px', color: (stats?.netProfit || 0) >= 0 ? '#10b981' : '#ef4444' }}>
              ₦{(stats?.netProfit || 0).toLocaleString()}
            </h3>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px', color: '#f59e0b' }}><Package size={24} /></div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Current Stock</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '20px' }}>{stats?.currentStock || 0} kg</h3>
          </div>
        </div>
      </div>

      {/* Quick Actions for Secretary */}
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>🚀 Quick Actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <button onClick={() => navigate('/workerSales')} style={{ padding: '20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}>
          <DollarSign size={20} /> Record Sale
        </button>
        <button onClick={() => navigate('/workerExpenses')} style={{ padding: '20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)' }}>
          <TrendingDown size={20} /> Record Expense
        </button>
        <button onClick={() => navigate('/factory-worker')} style={{ padding: '20px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(245, 158, 11, 0.2)' }}>
          <ClipboardList size={20} /> View Production
        </button>
      </div>
    </div>
  );
}