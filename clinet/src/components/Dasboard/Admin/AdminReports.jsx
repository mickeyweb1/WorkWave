import { useState, useEffect } from 'react';
import api from '../../../utils/api'; // Adjust path if needed
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Trophy, AlertTriangle } from 'lucide-react';

const COLORS = ['#7a91c2', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#06b6d4'];

export default function AdminReports() {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]); // <-- NEW: Added products
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const saleRes = await api.get('/sales');
      const expRes = await api.get('/expenses');
      const prodRes = await api.get('/products'); // <-- NEW: Fetch products
      
      setSales(saleRes.data.sales || []);
      setExpenses(expRes.data.expenses || []);
      setProducts(prodRes.data.products || []);
      setLoading(false);
    } catch (err) {
      console.error("Reports Error:", err);
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Generating analytics...</div>;

  // --- MATH: Calculate Totals ---
  const totalSales = sales.filter(s => s.status === 'completed').reduce((acc, s) => acc + s.totalPrice, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalSales - totalExpenses;

  // --- MATH: Prepare Last 7 Days Data for Bar Chart ---
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

    const daySales = sales
      .filter(s => s.status === 'completed' && s.createdAt.startsWith(dateStr))
      .reduce((acc, s) => acc + s.totalPrice, 0);

    const dayExpenses = expenses
      .filter(e => e.createdAt.startsWith(dateStr))
      .reduce((acc, e) => acc + e.amount, 0);

    last7Days.push({ name: dayName, Sales: daySales, Expenses: dayExpenses });
  }

  // --- MATH: Sales by Branch (For Pie Chart AND Top 3 List) ---
  const branchSales = {};
  sales.filter(s => s.status === 'completed').forEach(sale => {
    const branchName = sale.branchId?.name || 'Unknown Branch';
    branchSales[branchName] = (branchSales[branchName] || 0) + sale.totalPrice;
  });
  const pieData = Object.keys(branchSales).map(key => ({ name: key, value: branchSales[key] }));

  // --- NEW MATH: Top 3 Branches ---
  const topBranches = Object.entries(branchSales)
    .sort((a, b) => b[1] - a[1]) // Sort highest to lowest
    .slice(0, 3); // Take only the top 3

  // --- NEW MATH: Critical Stock (Products with 20 or less) ---
  const criticalStock = products
    .filter(p => p.stockQuantity <= 20)
    .sort((a, b) => a.stockQuantity - b.stockQuantity); // Sort lowest stock first

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <TrendingUp size={28} color="#2563eb" /> Business Command Center
      </h1>

      {/* 1. SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={cardStyle('#dcfce7', '#166534')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><p style={cardLabel}>Total Revenue</p><p style={cardValue}>₦{totalSales.toLocaleString()}</p></div>
            <TrendingUp size={32} opacity={0.5} />
          </div>
        </div>
        <div style={cardStyle('#fee2e2', '#991b1b')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><p style={cardLabel}>Total Expenses</p><p style={cardValue}>₦{totalExpenses.toLocaleString()}</p></div>
            <TrendingDown size={32} opacity={0.5} />
          </div>
        </div>
        <div style={cardStyle(netProfit >= 0 ? '#dbeafe' : '#fee2e2', netProfit >= 0 ? '#1e40af' : '#991b1b')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><p style={cardLabel}>Net Profit</p><p style={cardValue}>₦{netProfit.toLocaleString()}</p></div>
            <Wallet size={32} opacity={0.5} />
          </div>
        </div>
      </div>

      {/* 2. CHARTS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={chartContainer}>
          <h3 style={chartTitle}>Sales vs Expenses (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="Sales" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={chartContainer}>
          <h3 style={chartTitle}>Revenue by Branch</h3>
          <ResponsiveContainer width="100%" height={300}>
            {pieData.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', marginTop: '100px' }}>No branch sales data yet.</p>
            ) : (
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. NEW: TOP BRANCHES & CRITICAL STOCK */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* TOP 3 BRANCHES */}
        <div style={chartContainer}>
          <h3 style={{...chartTitle, display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309'}}>
            <Trophy size={20} /> Top Performing Branches
          </h3>
          {topBranches.length === 0 ? (
            <p style={{ color: '#666' }}>No sales recorded yet.</p>
          ) : (
            topBranches.map((branch, index) => (
              <div key={branch[0]} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ backgroundColor: index === 0 ? '#fef3c7' : '#f1f5f9', color: index === 0 ? '#92400e' : '#64748b', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {index + 1}
                  </span>
                  <strong style={{ color: '#334155' }}>{branch[0]}</strong>
                </div>
                <span style={{ fontWeight: 'bold', color: '#16a34a' }}>₦{branch[1].toLocaleString()}</span>
              </div>
            ))
          )}
        </div>

        {/* CRITICAL STOCK ALERTS */}
        <div style={chartContainer}>
          <h3 style={{...chartTitle, display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b'}}>
            <AlertTriangle size={20} /> Critical Stock (Running Out)
          </h3>
          {criticalStock.length === 0 ? (
            <p style={{ color: '#16a34a', fontWeight: 'bold' }}>✅ All stock levels are healthy!</p>
          ) : (
            criticalStock.slice(0, 5).map(product => (
              <div key={product._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <strong style={{ color: '#334155' }}>{product.name}</strong>
                <span style={{ backgroundColor: product.stockQuantity === 0 ? '#fee2e2' : '#fef3c7', color: product.stockQuantity === 0 ? '#991b1b' : '#92400e', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' }}>
                  {product.stockQuantity} left
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

const cardStyle = (bg, color) => ({ backgroundColor: bg, padding: '24px', borderRadius: '16px', color: color, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' });
const cardLabel = { fontSize: '14px', fontWeight: '600', marginBottom: '4px', opacity: 0.8 };
const cardValue = { fontSize: '28px', fontWeight: 'bold', margin: 0 };
const chartContainer = { backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const chartTitle = { fontSize: '16px', fontWeight: 'bold', color: '#334155', marginBottom: '16px' };
