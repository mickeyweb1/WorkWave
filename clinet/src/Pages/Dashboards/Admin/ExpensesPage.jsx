import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../../../utils/api';
import { Loader2, CheckCircle, TrendingDown } from 'lucide-react';
import './ExpensesPage.css';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const prevCountRef = useRef(0);

  // Added 'customCategory' to the state
  const [inputRows, setInputRows] = useState(
    Array.from({ length: 5 }, () => ({ description: '', category: 'Raw Materials', customCategory: '', amount: '', date: '' }))
  );

  const styles = {
    dayGroup: { marginBottom: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    dayHeader: { padding: '14px 20px', background: '#fef2f2', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    dayDate: { fontWeight: '700', color: '#991b1b', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' },
    dayTotal: { fontWeight: '800', color: '#ef4444', fontSize: '18px' },
    recordRow: { padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' },
    recordInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
    recordTitle: { fontWeight: '700', color: '#0f172a', fontSize: '16px' },
    recordMeta: { fontSize: '13px', color: '#64748b', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' },
    branchBadge: { background: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' },
    catBadge: { background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' },
    amount: { fontWeight: '800', fontSize: '18px', color: '#ef4444', whiteSpace: 'nowrap' }
  };

  const fetchData = async (checkForChanges = false) => {
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data.expenses);
      if (checkForChanges && prevCountRef.current > 0 && res.data.expenses.length > prevCountRef.current) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
      prevCountRef.current = res.data.expenses.length;
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const groupedExpenses = useMemo(() => {
    const groups = {};
    expenses.forEach((exp) => {
      const dateKey = new Date(exp.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(exp);
    });
    return groups;
  }, [expenses]);

  const getDailyTotals = (dayExpenses) => dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handleRowChange = (index, field, value) => {
    setInputRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Clear custom category if they switch away from "Other"
      if (field === 'category' && value !== 'Other') {
        updated[index].customCategory = '';
      }
      return updated;
    });
  };

  const handleSaveRow = async (index) => {
    const row = inputRows[index];
    // If "Other" is selected, use the custom text. Otherwise, use the dropdown value.
    const finalCategory = row.category === 'Other' ? row.customCategory.trim() : row.category;

    if (!row.description || !row.amount) {
      alert("Please fill in Description and Amount.");
      return;
    }
    if (row.category === 'Other' && !finalCategory) {
      alert("Please specify the custom category name.");
      return;
    }

    try {
      await api.post('/expenses', {
        description: row.description,
        category: finalCategory, // Sends the custom category to the backend
        amount: row.amount,
        date: row.date || new Date().toISOString()
      });
      
      // 🚀 MAGIC FIX: Tell the Home Dashboard to refresh its data instantly!
      window.dispatchEvent(new Event("workwave-data-updated"));

      setInputRows(prev => {
        const updated = [...prev];
        updated[index] = { description: '', category: 'Raw Materials', customCategory: '', amount: '', date: '' };
        return updated;
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save');
    }
  };

  if (loading) return <div className="ep-loading"><Loader2 size={40} className="spin" /></div>;

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="ep-page">
      {showToast && <div className="ep-toast"><CheckCircle size={16} /> Records updated</div>}

      <div className="ep-header">
        <div>
          <h1 className="ep-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingDown size={28} color="#ef4444" /> Expenses
          </h1>
          <p className="ep-subtitle">Track money going out of the business</p>
        </div>
        <div className="ep-summary">
          <span>Total Recorded:</span>
          <strong>₦{totalExpenses.toLocaleString()}</strong>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#334155', marginBottom: '16px', marginTop: '8px' }}>Expense History</h2>
      
      {Object.keys(groupedExpenses).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: 'white', borderRadius: '12px', border: '2px dashed #e2e8f0', marginBottom: '32px' }}>
          <p>No expenses recorded yet.</p>
        </div>
      ) : (
        Object.entries(groupedExpenses).map(([date, dayExpenses]) => {
          const total = getDailyTotals(dayExpenses);
          return (
            <div key={date} style={styles.dayGroup}>
              <div style={styles.dayHeader}>
                <span style={styles.dayDate}>📅 {date}</span>
                <span style={styles.dayTotal}>-₦{total.toLocaleString()}</span>
              </div>
              {dayExpenses.map((exp) => (
                <div key={exp._id} style={styles.recordRow}>
                  <div style={styles.recordInfo}>
                    <span style={styles.recordTitle}>{exp.description || exp.category}</span>
                    <div style={styles.recordMeta}>
                      {exp.branchId?.name && <span style={styles.branchBadge}>🏢 {exp.branchId.name}</span>}
                      <span style={styles.catBadge}>🏷️ {exp.category}</span>
                      <span>👤 {exp.recordedBy?.name || 'Unknown'}</span>
                    </div>
                  </div>
                  <span style={styles.amount}>-₦{exp.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          );
        })
      )}

      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#334155', marginBottom: '16px', marginTop: '32px' }}>Quick Entry</h2>
      <div className="ep-table-wrapper">
        <table className="ep-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th>Amount (₦)</th>
              <th>Date</th>
              <th>By</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {inputRows.map((row, index) => (
              <tr key={`input-${index}`} className="ep-input-row">
                <td><input type="text" value={row.description} onChange={(e) => handleRowChange(index, 'description', e.target.value)} className="ep-cell-input" placeholder="e.g., Fuel" /></td>
                <td>
                  <select 
                    value={row.category} 
                    onChange={(e) => handleRowChange(index, 'category', e.target.value)} 
                    className="ep-cell-select"
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Fuel/Power">Fuel/Power</option>
                    <option value="Transport">Transport</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Other">Other (Type below)</option>
                  </select>
                  {/* 👇 THIS IS THE CUSTOM INPUT BOX THAT APPEARS WHEN "OTHER" IS SELECTED 👇 */}
                  {row.category === 'Other' && (
                    <input 
                      type="text" 
                      value={row.customCategory} 
                      onChange={(e) => handleRowChange(index, 'customCategory', e.target.value)} 
                      className="ep-cell-input" 
                      placeholder="e.g., Fuel, Internet"
                      style={{ marginTop: '6px', fontSize: '13px', borderColor: '#f59e0b' }}
                    />
                  )}
                </td>
                <td><input type="number" value={row.amount} onChange={(e) => handleRowChange(index, 'amount', e.target.value)} className="ep-cell-input" placeholder="0" /></td>
                <td><input type="date" value={row.date} onChange={(e) => handleRowChange(index, 'date', e.target.value)} className="ep-cell-input" /></td>
                <td className="ep-auto-by">Auto</td>
                <td><button className="ep-save-btn" onClick={() => handleSaveRow(index)} disabled={!row.description || !row.amount}>✓</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}