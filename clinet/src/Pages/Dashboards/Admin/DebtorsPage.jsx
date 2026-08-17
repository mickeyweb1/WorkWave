import { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { CreditCard, CheckCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import './DebtorsPage.css';

export default function DebtorsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'paid'

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const res = await api.get('/product-records/credits');
      setRecords(res.data);
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (recordId) => {
    try {
      await api.put(`/product-records/${recordId}/mark-paid`);
      fetchCredits();
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  // Calculate totals
  const pendingRecords = records.filter(r => r.paymentStatus === 'pending');
  const paidRecords = records.filter(r => r.paymentStatus === 'paid');
  const totalOwed = pendingRecords.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const totalPaid = paidRecords.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  // Filter records
  const filteredRecords = filter === 'all' ? records : records.filter(r => r.paymentStatus === filter);

  if (loading) {
    return (
      <div className="debtors-loading">
        <Loader2 size={40} className="spin" />
        <p>Loading debtors...</p>
      </div>
    );
  }

  return (
    <div className="debtors-page">
      {/* Header */}
      <div className="debtors-header">
        <div>
          <h1 className="debtors-title">💰 Credit & Debtors</h1>
          <p className="debtors-subtitle">Track customers who buy on credit</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="debtors-summary">
        <div className="debtors-card owed">
          <AlertTriangle size={28} />
          <div>
            <p>Total Owed (Pending)</p>
            <h3>₦{totalOwed.toLocaleString()}</h3>
            <span>{pendingRecords.length} customers</span>
          </div>
        </div>
        <div className="debtors-card paid">
          <CheckCircle size={28} />
          <div>
            <p>Total Collected (Paid)</p>
            <h3>₦{totalPaid.toLocaleString()}</h3>
            <span>{paidRecords.length} payments</span>
          </div>
        </div>
        <div className="debtors-card total">
          <CreditCard size={28} />
          <div>
            <p>Total Credit Sales</p>
            <h3>₦{(totalOwed + totalPaid).toLocaleString()}</h3>
            <span>{records.length} records</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All ({records.length})
        </button>
        <button className={`filter-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
          ⏳ Owing ({pendingRecords.length})
        </button>
        <button className={`filter-tab ${filter === 'paid' ? 'active' : ''}`} onClick={() => setFilter('paid')}>
          ✅ Paid ({paidRecords.length})
        </button>
      </div>

      {/* Debtors Table */}
      <div className="debtors-table-container">
        <table className="debtors-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Product</th>
              <th>KG</th>
              <th>Discount</th>
              <th>Amount</th>
              <th>Date Sold</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record._id} className={record.paymentStatus}>
                <td className="customer-cell">{record.customerName || 'Unknown'}</td>
                <td>{record.productId?.name || '-'}</td>
                <td className="kg-cell">{record.kg} kg</td>
                <td>{record.discount ? `₦${record.discount.toLocaleString()}` : '-'}</td>
                <td className="amount-cell">₦{(record.totalAmount || 0).toLocaleString()}</td>
                <td>{record.dateOut ? new Date(record.dateOut).toLocaleDateString() : '-'}</td>
                <td>
                  <span className={`status-badge ${record.paymentStatus}`}>
                    {record.paymentStatus === 'pending' ? '⏳ Owing' : '✅ Paid'}
                  </span>
                </td>
                <td>
                  {record.paymentStatus === 'pending' && (
                    <button className="mark-paid-btn" onClick={() => markAsPaid(record._id)}>
                      <CheckCircle size={14} />
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan="8" className="empty-row">
                  No credit records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}