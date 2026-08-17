import { useState, useEffect } from "react";
import api from "../../../../utils/api";
import { useNavigate } from "react-router-dom";
import "./homeDashboard.css";
import {
  Wallet, TrendingUp, TrendingDown, ShoppingCart, Building2, Package,
  Clock, ArrowRight, Calendar, Plus, FileText, CheckCircle, AlertTriangle,
  DollarSign, BarChart3, Activity
} from "lucide-react";

export default function AdminHomeDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const [data, setData] = useState(null);

  const userString = localStorage.getItem("workwave_user");
  const user = userString ? JSON.parse(userString) : { name: "Admin" };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/dashboard/overview?period=${period}`);
        setData(res.data);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 🚀 MAGIC FIX: Listen for the event triggered by ExpensesPage or SalesPage
    const handleDataUpdate = () => {
      fetchData();
    };
    
    window.addEventListener("workwave-data-updated", handleDataUpdate);

    return () => {
      window.removeEventListener("workwave-data-updated", handleDataUpdate);
    };
  }, [period]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: "☀️" };
    if (hour < 17) return { text: "Good afternoon", icon: "🌤️" };
    return { text: "Good evening", icon: "🌙" };
  };

  const getPeriodLabel = () => {
    const labels = { today: "Today", week: "This Week", month: "This Month", year: "This Year", all: "All Time" };
    return labels[period] || "Today";
  };

  if (loading || !data) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-spinner"></div>
        <p>Loading your business overview...</p>
      </div>
    );
  }

  const greeting = getGreeting();
  const { stats, topBranches, topProducts, recentActivity, lowStock, infrastructure } = data;

  return (
    <div className="home-dashboard">
      <section className="welcome-banner">
        <div className="welcome-content">
          <h1>{greeting.icon} {greeting.text}, {user.name.split(' ')[0]}!</h1>
          <p>Here's what's happening with your business {getPeriodLabel().toLowerCase()}.</p>
        </div>
        <div className="period-selector">
          <Calendar size={18} />
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card stat-profit">
          <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}><DollarSign size={24} /></div>
          <div className="stat-info">
            <p className="stat-label">Net Profit</p>
            <p className="stat-value">₦{stats.netProfit.toLocaleString()}</p>
            <p className="stat-subtext">{stats.salesCount} sales</p>
          </div>
        </div>
        <div className="stat-card stat-revenue">
          <div className="stat-icon-wrapper" style={{ background: '#dbeafe', color: '#2563eb' }}><TrendingUp size={24} /></div>
          <div className="stat-info">
            <p className="stat-label">Total Revenue</p>
            <p className="stat-value">₦{stats.totalRevenue.toLocaleString()}</p>
            <p className="stat-subtext">From sales</p>
          </div>
        </div>
        <div className="stat-card stat-expenses">
          <div className="stat-icon-wrapper" style={{ background: '#fee2e2', color: '#dc2626' }}><TrendingDown size={24} /></div>
          <div className="stat-info">
            <p className="stat-label">Total Expenses</p>
            <p className="stat-value">₦{stats.totalExpenses.toLocaleString()}</p>
            <p className="stat-subtext">Operating costs</p>
          </div>
        </div>
        <div className="stat-card stat-infra">
          <div className="stat-icon-wrapper" style={{ background: '#f3e8ff', color: '#7c3aed' }}><Building2 size={24} /></div>
          <div className="stat-info">
            <p className="stat-label">Infrastructure</p>
            <p className="stat-value">{infrastructure.branches} Branches</p>
            <p className="stat-subtext">{infrastructure.totalProducts} Products</p>
          </div>
        </div>
      </section>

      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button onClick={() => navigate('/sales')} className="action-btn">
            <div className="action-icon" style={{ background: '#dbeafe', color: '#2563eb' }}><Plus size={24} /></div>
            <span>Record Sale</span>
          </button>
          <button onClick={() => navigate('/expenses')} className="action-btn">
            <div className="action-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}><Plus size={24} /></div>
            <span>Add Expense</span>
          </button>
          <button onClick={() => navigate('/production-approval')} className="action-btn">
            <div className="action-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><CheckCircle size={24} /></div>
            <span>Production</span>
          </button>
          <button onClick={() => navigate('/daily-report')} className="action-btn">
            <div className="action-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}><FileText size={24} /></div>
            <span>Daily Report</span>
          </button>
        </div>
      </section>

      <section className="two-column-grid">
        <div className="panel">
          <div className="panel-header">
            <h3><BarChart3 size={18} /> Top Branches</h3>
            <button onClick={() => navigate('/adminBranches')} className="view-all-btn">View All <ArrowRight size={14} /></button>
          </div>
          <div className="panel-body">
            {topBranches.length === 0 ? <p className="empty-message">No sales data yet</p> : topBranches.map((branch, index) => (
              <div key={branch.name} className="leaderboard-item">
                <div className="rank">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</div>
                <div className="leaderboard-info">
                  <p className="leaderboard-name">{branch.name}</p>
                  <p className="leaderboard-meta">{branch.salesCount} sales</p>
                </div>
                <div className="leaderboard-amount">₦{branch.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3><Package size={18} /> Top Products</h3>
            <button onClick={() => navigate('/products')} className="view-all-btn">View All <ArrowRight size={14} /></button>
          </div>
          <div className="panel-body">
            {topProducts.length === 0 ? <p className="empty-message">No product sales yet</p> : topProducts.map((product, index) => (
              <div key={product.name} className="leaderboard-item">
                <div className="rank">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</div>
                <div className="leaderboard-info">
                  <p className="leaderboard-name">{product.name}</p>
                  <p className="leaderboard-meta">{product.units} units sold</p>
                </div>
                <div className="leaderboard-amount">₦{product.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="two-column-grid">
        <div className="panel">
          <div className="panel-header">
            <h3><Activity size={18} /> Recent Activity</h3>
            <button onClick={() => navigate('/activityLog')} className="view-all-btn">View All <ArrowRight size={14} /></button>
          </div>
          <div className="panel-body">
            {recentActivity.length === 0 ? <p className="empty-message">No activity yet</p> : recentActivity.slice(0, 5).map((log) => (
              <div key={log._id} className="activity-item">
                <div className="activity-icon">
                  {log.action.includes('SALE') ? <ShoppingCart size={16} /> : log.action.includes('EXPENSE') ? <TrendingDown size={16} /> : <Activity size={16} />}
                </div>
                <div className="activity-content">
                  <p><strong>{log.userName}</strong> {log.details}</p>
                  <span className="activity-time"><Clock size={12} /> {new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3><AlertTriangle size={18} /> Low Stock Alerts</h3>
            <button onClick={() => navigate('/products')} className="view-all-btn">Manage <ArrowRight size={14} /></button>
          </div>
          <div className="panel-body">
            {lowStock.length === 0 ? <p className="empty-message success">✅ All stock levels are healthy!</p> : lowStock.map((product) => (
              <div key={product._id} className="stock-item">
                <div className="stock-info">
                  <p className="stock-name">{product.name}</p>
                  <p className="stock-meta">{product.category || 'General'}</p>
                </div>
                <div className={`stock-badge ${product.totalStock === 0 ? 'empty' : 'low'}`}>{product.totalStock} left</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}