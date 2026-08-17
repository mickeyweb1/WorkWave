import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../utils/api';
import { ArrowLeft, Loader2, CheckCircle, Layers, Trash2 } from 'lucide-react';
import './MaterialDetailPage.css';

export default function MaterialDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [material, setMaterial] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const prevCountRef = useRef(0);
  
  // Batch Record
  const [showBatch, setShowBatch] = useState(false);
  const [batchTemplate, setBatchTemplate] = useState({
    type: 'in',
    quantity: '',
    details: '',
    by: ''
  });
  const [batchCount, setBatchCount] = useState('');
  
  // Input rows (always 5 default empty rows)
  const [inputRows, setInputRows] = useState(
    Array.from({ length: 5 }, () => ({ type: 'in', quantity: '', details: '', by: '' }))
  );

  const fetchData = useCallback(async (checkForChanges = false) => {
    try {
      const res = await api.get(`/raw-materials/${id}/transactions`);
      setMaterial(res.data.material);
      setTransactions(res.data.transactions);
      
      if (checkForChanges && prevCountRef.current > 0 && res.data.transactions.length > prevCountRef.current) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
      prevCountRef.current = res.data.transactions.length;
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

    const handleDeleteMaterial = async () => {
    if (!window.confirm(`Are you sure you want to delete "${material.name}" and all its records? This cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/raw-materials/${id}`);
      // After successful deletion, navigate back to the main list
      navigate('/raw-materials'); 
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete material');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRowChange = (index, field, value) => {
    setInputRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveRow = async (index) => {
    const row = inputRows[index];
    if (!row.quantity) return;
    
    try {
      await api.post(`/raw-materials/${id}/transaction`, {
        type: row.type,
        quantity: row.quantity,
        details: row.details,
      });
      
      setInputRows(prev => {
        const updated = [...prev];
        updated[index] = { type: 'in', quantity: '', details: '', by: '' };
        return updated;
      });
      
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save');
    }
  };

  const handleBatchGenerate = () => {
    const count = parseInt(batchCount);
    if (!count || count < 1 || count > 50) {
      alert('Please enter a valid number between 1 and 50');
      return;
    }
    
    // Create N new rows pre-filled with template values
    const newRows = Array.from({ length: count }, () => ({
      type: batchTemplate.type,
      quantity: batchTemplate.quantity,
      details: batchTemplate.details,
      by: batchTemplate.by
    }));
    
    // Add these new rows to the existing input rows
    setInputRows(prev => [...newRows, ...prev]);
    
    // Close batch panel and reset
    setShowBatch(false);
    setBatchTemplate({ type: 'in', quantity: '', details: '', by: '' });
    setBatchCount('');
  };

  if (loading) {
    return <div className="md-loading"><Loader2 size={40} className="spin" /></div>;
  }

  // 👇 PASTE THIS HERE 👇
  const currentUserRole = (() => {
    try {
      return JSON.parse(localStorage.getItem("workwave_user") || "{}")?.role;
    } catch {
      return null;
    }
  })();
  const isAdmin = currentUserRole === "admin";
  // 👆 PASTE THIS HERE 👆

  return (
    <div className="md-page">
      {showToast && (
        <div className="md-toast">
          <CheckCircle size={16} /> Records updated
        </div>
      )}

      {/* Header */}
      <div className="md-header">
        <button className="md-back-btn" onClick={() => navigate('/raw-materials')}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className="md-header-info">
          <h1 className="md-title">📖 {material?.name}</h1>
          <p className="md-stock">
            Current Stock: <strong>{material?.currentStock} {material?.unit}</strong>
          </p>
        </div>
        
        <div className="md-header-actions">
          {/* Admin Delete Button */}
          {isAdmin && (
            <button className="md-delete-btn" onClick={handleDeleteMaterial}>
              <Trash2 size={18} /> Delete
            </button>
          )}
          
          {/* Existing Batch Record Button */}
          <button className="md-batch-btn" onClick={() => setShowBatch(!showBatch)}>
            <Layers size={18} /> Batch Record
          </button>
        </div>
      </div>

      {/* Batch Panel - Template Row + Number Input */}
      {showBatch && (
        <div className="md-batch-panel">
          <h3 className="md-batch-title">📋 Fill Template (Pre-fills all generated rows)</h3>
          
          {/* Template Row */}
          <div className="md-batch-template-row">
            <div className="md-batch-cell">
              <div className="md-toggle-sm">
                <button
                  type="button"
                  className={`md-toggle-btn-sm ${batchTemplate.type === 'in' ? 'active-in' : ''}`}
                  onClick={() => setBatchTemplate({ ...batchTemplate, type: 'in' })}
                >IN</button>
                <button
                  type="button"
                  className={`md-toggle-btn-sm ${batchTemplate.type === 'out' ? 'active-out' : ''}`}
                  onClick={() => setBatchTemplate({ ...batchTemplate, type: 'out' })}
                >OUT</button>
              </div>
            </div>
            <div className="md-batch-cell">
              <input
                type="number"
                step="0.01"
                value={batchTemplate.quantity}
                onChange={(e) => setBatchTemplate({ ...batchTemplate, quantity: e.target.value })}
                className="md-cell-input"
                placeholder="Quantity (optional)"
              />
            </div>
            <div className="md-batch-cell">
              <input
                type="text"
                value={batchTemplate.details}
                onChange={(e) => setBatchTemplate({ ...batchTemplate, details: e.target.value })}
                className="md-cell-input"
                placeholder="Details (optional)"
              />
            </div>
            <div className="md-batch-cell">
              <input
                type="text"
                value={batchTemplate.by}
                onChange={(e) => setBatchTemplate({ ...batchTemplate, by: e.target.value })}
                className="md-cell-input"
                placeholder="By (optional)"
              />
            </div>
          </div>

          {/* Number Input + Generate Button */}
          <div className="md-batch-actions">
            <div className="md-batch-field">
              <label>How many rows?</label>
              <input
                type="number"
                min="1"
                max="50"
                value={batchCount}
                onChange={(e) => setBatchCount(e.target.value)}
                placeholder="e.g., 6"
              />
            </div>
            <button className="md-batch-generate" onClick={handleBatchGenerate}>
              Generate Rows
            </button>
            <button className="md-batch-cancel" onClick={() => setShowBatch(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="md-table-wrapper">
        <table className="md-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Quantity</th>
              <th>Details</th>
              <th>By</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {/* Existing Records */}
            {transactions.map((t) => (
              <tr key={t._id} className="md-existing-row">
                <td>
                  <span className={`md-type-badge ${t.type}`}>
                    {t.type === 'in' ? 'IN' : 'OUT'}
                  </span>
                </td>
                <td className="md-qty">
                  {t.type === 'in' ? '+' : '-'}{t.quantity}
                </td>
                <td>{t.details || '—'}</td>
                <td>{t.recordedBy?.name || '—'}</td>
                <td className="md-date-cell">
                  {new Date(t.date).toLocaleDateString()}
                </td>
                <td></td>
              </tr>
            ))}
            
            {/* Input Rows */}
            {inputRows.map((row, index) => (
              <tr key={`input-${index}`} className="md-input-row">
                <td>
                  <div className="md-toggle-sm">
                    <button
                      type="button"
                      className={`md-toggle-btn-sm ${row.type === 'in' ? 'active-in' : ''}`}
                      onClick={() => handleRowChange(index, 'type', 'in')}
                    >IN</button>
                    <button
                      type="button"
                      className={`md-toggle-btn-sm ${row.type === 'out' ? 'active-out' : ''}`}
                      onClick={() => handleRowChange(index, 'type', 'out')}
                    >OUT</button>
                  </div>
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={row.quantity}
                    onChange={(e) => handleRowChange(index, 'quantity', e.target.value)}
                    className="md-cell-input"
                    placeholder="0"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.details}
                    onChange={(e) => handleRowChange(index, 'details', e.target.value)}
                    className="md-cell-input"
                    placeholder="Optional"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.by}
                    onChange={(e) => handleRowChange(index, 'by', e.target.value)}
                    className="md-cell-input"
                    placeholder="Optional"
                  />
                </td>
                <td className="md-auto-date">Auto</td>
                <td>
                  <button 
                    className="md-save-btn"
                    onClick={() => handleSaveRow(index)}
                    disabled={!row.quantity}
                  >
                    ✓
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}