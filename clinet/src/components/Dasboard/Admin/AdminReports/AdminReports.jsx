import { useState, useEffect } from 'react';
import { 
  Download, FileText, TrendingUp, TrendingDown, DollarSign, 
  Calendar, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../../utils/api';
import './AdminReports.css';

export default function AdminReports() {
  const [reportPeriod, setReportPeriod] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [reportPeriod]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [summaryRes, trendRes, productsRes] = await Promise.all([
        api.get(`/reports/summary?period=${reportPeriod}`),
        api.get(`/reports/trend?period=${reportPeriod}`),
        api.get(`/reports/top-products?period=${reportPeriod}`)
      ]);

      setSummary(summaryRes.data.summary);
      setTrends(summaryRes.data.trends);
      setTrendData(trendRes.data.trendData);
      setTopProducts(productsRes.data.topProducts);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!summary) return;
    
    const csvContent = [
      ['Metric', 'Amount'],
      ['Total Revenue', `₦${summary.totalRevenue.toLocaleString()}`],
      ['Total Expenses', `₦${summary.totalExpenses.toLocaleString()}`],
      ['Net Profit', `₦${summary.netProfit.toLocaleString()}`],
      ['Profit Margin', `${summary.profitMargin}%`],
      ['Total Sales', summary.totalSales],
      ['Total Expenses Count', summary.totalExpensesCount]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workwave-report-${reportPeriod}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={40} className="spin" />
      </div>
    );
  }

  const plSummary = summary ? [
    { 
      title: "Total Revenue", 
      amount: `₦${summary.totalRevenue.toLocaleString()}`, 
      trend: `${trends.revenue >= 0 ? '+' : ''}${trends.revenue}%`, 
      isPositive: trends.revenue >= 0, 
      icon: TrendingUp, 
      color: "blue" 
    },
    { 
      title: "Total Expenses", 
      amount: `₦${summary.totalExpenses.toLocaleString()}`, 
      trend: `${trends.expenses >= 0 ? '+' : ''}${trends.expenses}%`, 
      isPositive: trends.expenses <= 0, 
      icon: TrendingDown, 
      color: "red" 
    },
    { 
      title: "Net Profit", 
      amount: `₦${summary.netProfit.toLocaleString()}`, 
      trend: `${trends.profit >= 0 ? '+' : ''}${trends.profit}%`, 
      isPositive: trends.profit >= 0, 
      icon: DollarSign, 
      color: "green" 
    },
    { 
      title: "Profit Margin", 
      amount: `${summary.profitMargin}%`, 
      trend: "Healthy", 
      isPositive: summary.profitMargin > 0, 
      icon: FileText, 
      color: "purple" 
    },
  ] : [];

  return (
    <div className="reports-page-container">
      
      {/* --- HEADER & EXPORT ACTIONS --- */}
      <div className="reports-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Deep dive into your business performance, profitability, and growth trends.</p>
        </div>
        <div className="export-actions">
          <button className="export-btn secondary" onClick={exportCSV}>
            <FileText size={18} /> Download CSV
          </button>
        </div>
      </div>

      {/* --- PERIOD FILTER --- */}
      <div className="period-filter">
        <Calendar size={16} className="filter-icon" />
        <select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}>
          <option value="30days">Last 30 Days</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* --- P&L SUMMARY CARDS --- */}
      <div className="pl-summary-grid">
        {plSummary.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className={`pl-card card-${item.color}`}>
              <div className="pl-card-header">
                <span className="pl-title">{item.title}</span>
                <div className={`pl-icon-box bg-${item.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <h2 className="pl-amount">{item.amount}</h2>
              <div className={`pl-trend ${item.isPositive ? 'trend-up' : 'trend-down'}`}>
                {item.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{item.trend} vs previous period</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MAIN TREND CHART --- */}
      <div className="report-panel chart-panel">
        <div className="panel-header">
          <h3>Revenue vs Expenses Trend</h3>
          <span className="panel-subtitle">Financial Performance Over Time</span>
        </div>
        <div className="chart-container-large">
          {trendData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <FileText size={48} style={{ opacity: 0.3 }} />
              <p>No data available for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `₦${val/1000000}M`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                  formatter={(value) => `₦${value.toLocaleString()}`}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="sales" name="Total Sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="expenses" name="Total Expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* --- TOP PRODUCTS TABLE --- */}
      <div className="report-panel">
        <div className="panel-header">
          <h3>Top Performing Products</h3>
        </div>
        <div className="table-container">
          <table className="simple-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Units Sold</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                    No sales data for this period
                  </td>
                </tr>
              ) : (
                topProducts.map((product) => (
                  <tr key={product.rank}>
                    <td className="font-bold">#{product.rank}</td>
                    <td className="font-medium">{product.name}</td>
                    <td>{product.unitsSold}</td>
                    <td className="font-semibold">₦{product.revenue.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}