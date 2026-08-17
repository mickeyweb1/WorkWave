import { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { 
  CheckCircle, XCircle, Clock, Package, User, 
  Sun, Moon, Loader2, AlertCircle 
} from 'lucide-react';

export default function ProductionApproval() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [toast, setToast] = useState(null);

  const styles = {
    page: { padding: '24px', minHeight: '100vh', background: '#f8fafc' },
    header: { marginBottom: '32px' },
    title: { fontSize: '28px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 },
    subtitle: { color: '#64748b', fontSize: '15px', marginTop: '6px' },
    
    // Stats Cards
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' },
    statCard: { background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' },
    statIcon: { padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    statInfo: { flex: 1 },
    statLabel: { fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' },
    statValue: { fontSize: '24px', fontWeight: '800', margin: '4px 0 0' },
    
    // Records List
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#334155', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
    recordCard: { background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', transition: 'all 0.2s' },
    recordInfo: { flex: 1 },
    recordTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' },
    recordMeta: { display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' },
    metaItem: { display: 'flex', alignItems: 'center', gap: '4px' },
    
    // Action Buttons
    actionGroup: { display: 'flex', gap: '8px' },
    approveBtn: { background: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', transition: 'all 0.2s' },
    rejectBtn: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', transition: 'all 0.2s' },
    
    // Empty State
    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', border: '2px dashed #e2e8f0', borderRadius: '12px' },
    emptyIcon: { margin: '0 auto 16px', opacity: 0.5 },
    emptyTitle: { fontSize: '18px', fontWeight: '700', color: '#334155', margin: '0 0 8px' },
    emptyText: { color: '#94a3b8', fontSize: '14px', margin: 0 },
    
    // Toast
    toast: { position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', borderRadius: '10px', color: 'white', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1000, animation: 'slideIn 0.3s ease' },
    
    // Loading
    loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }
  };

  useEffect(() => {
    fetchPendingRecords();
  }, []);

  const fetchPendingRecords = async () => {
    try {
      const res = await api.get('/product-records/pending-review');
      setRecords(res.data);
    } catch (error) {
      console.error('Error fetching records:', error);
      showToast('Failed to load pending records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recordId) => {
    setActionInProgress(recordId);
    try {
      await api.put(`/product-records/${recordId}/approve`);
      showToast('Production approved successfully!', 'success');
      fetchPendingRecords();
    } catch (error) {
      showToast('Failed to approve production', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (recordId) => {
    if (!window.confirm('Are you sure you want to reject this production record? It will be permanently deleted.')) {
      return;
    }
    
    setActionInProgress(recordId);
    try {
      await api.put(`/product-records/${recordId}/reject`);
      showToast('Production rejected and removed', 'warning');
      fetchPendingRecords();
    } catch (error) {
      showToast('Failed to reject production', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const totalKg = records.reduce((sum, r) => sum + r.kg, 0);
  const morningShifts = records.filter(r => r.shift === 'morning').length;
  const nightShifts = records.filter(r => r.shift === 'night').length;

  if (loading) {
    return (
      <div style={styles.loading}>
        <Loader2 size={40} className="spin" />
        <p style={{ color: '#64748b' }}>Loading pending approvals...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.type === 'success' ? '#10b981' : toast.type === 'warning' ? '#f59e0b' : '#ef4444'
        }}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : 
           toast.type === 'warning' ? <AlertCircle size={20} /> : 
           <XCircle size={20} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          <CheckCircle size={28} /> Production Approval
        </h1>
        <p style={styles.subtitle}>
          Review and approve production records submitted by factory workers
        </p>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#fef3c7', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div style={styles.statInfo}>
            <p style={styles.statLabel}>Pending Approvals</p>
            <h3 style={{ ...styles.statValue, color: '#f59e0b' }}>{records.length}</h3>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#dbeafe', color: '#2563eb' }}>
            <Package size={24} />
          </div>
          <div style={styles.statInfo}>
            <p style={styles.statLabel}>Total KG Pending</p>
            <h3 style={{ ...styles.statValue, color: '#2563eb' }}>{totalKg.toLocaleString()}</h3>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#fef3c7', color: '#f59e0b' }}>
            <Sun size={24} />
          </div>
          <div style={styles.statInfo}>
            <p style={styles.statLabel}>Morning Shift</p>
            <h3 style={{ ...styles.statValue, color: '#f59e0b' }}>{morningShifts}</h3>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#e0e7ff', color: '#6366f1' }}>
            <Moon size={24} />
          </div>
          <div style={styles.statInfo}>
            <p style={styles.statLabel}>Night Shift</p>
            <h3 style={{ ...styles.statValue, color: '#6366f1' }}>{nightShifts}</h3>
          </div>
        </div>
      </div>

      {/* Pending Records */}
      <h2 style={styles.sectionTitle}>
        <Clock size={20} /> Pending Production Records
      </h2>

      {records.length === 0 ? (
        <div style={styles.emptyState}>
          <CheckCircle size={48} style={styles.emptyIcon} />
          <h3 style={styles.emptyTitle}>All Caught Up!</h3>
          <p style={styles.emptyText}>No pending production records to review.</p>
        </div>
      ) : (
        records.map((record) => (
          <div key={record._id} style={styles.recordCard}>
            <div style={styles.recordInfo}>
              <h3 style={styles.recordTitle}>{record.productId?.name || 'Unknown Product'}</h3>
              <div style={styles.recordMeta}>
                <span style={styles.metaItem}>
                  <Package size={14} /> {record.kg} kg
                </span>
                {record.size && (
                  <span style={styles.metaItem}>
                    📏 {record.size}
                  </span>
                )}
                {record.thickness && (
                  <span style={styles.metaItem}>
                    📐 {record.thickness}
                  </span>
                )}
                <span style={styles.metaItem}>
                  {record.shift === 'morning' ? <Sun size={14} /> : <Moon size={14} />}
                  {record.shift === 'morning' ? 'Morning' : 'Night'} Shift
                </span>
                <span style={styles.metaItem}>
                  <User size={14} /> {record.recordedBy?.name || 'Unknown'}
                </span>
                <span style={styles.metaItem}>
                  📅 {new Date(record.dateIn).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div style={styles.actionGroup}>
              <button
                onClick={() => handleApprove(record._id)}
                disabled={actionInProgress === record._id}
                style={{
                  ...styles.approveBtn,
                  opacity: actionInProgress === record._id ? 0.6 : 1,
                  cursor: actionInProgress === record._id ? 'not-allowed' : 'pointer'
                }}
              >
                {actionInProgress === record._id ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                Approve
              </button>
              <button
                onClick={() => handleReject(record._id)}
                disabled={actionInProgress === record._id}
                style={{
                  ...styles.rejectBtn,
                  opacity: actionInProgress === record._id ? 0.6 : 1,
                  cursor: actionInProgress === record._id ? 'not-allowed' : 'pointer'
                }}
              >
                {actionInProgress === record._id ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <XCircle size={16} />
                )}
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}