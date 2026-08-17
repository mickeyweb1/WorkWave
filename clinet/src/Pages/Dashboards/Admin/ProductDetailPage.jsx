import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import './AdminProductDetalis.css';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Package, Loader2, Sun, Moon, ShoppingCart, Layers } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ totalProduced: 0, totalSold: 0, currentStock: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  // Single Production Modal
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [productionForm, setProductionForm] = useState({
    kg: '', size: '', thickness: '', shift: 'morning'
  });

  // Bulk Production Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRolls, setBulkRolls] = useState([
    { kg: '', size: '', thickness: '', shift: 'morning' }
  ]);

  // Sale Modal
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [saleForm, setSaleForm] = useState({
    customerName: '', pricePerKg: '', discount: '', totalAmount: '', paymentType: 'cash'
  });

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      const [productRes, recordsRes, summaryRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/product-records/product/${id}`),
        api.get(`/product-records/product/${id}/summary`)
      ]);
      setProduct(productRes.data.product || productRes.data);
      
      // Sort records: Available first (dateIn newest first), then Sold (dateOut newest first)
      const allRecords = recordsRes.data;
      const available = allRecords
        .filter(r => r.status !== 'sold')
        .sort((a, b) => new Date(b.dateIn) - new Date(a.dateIn));
      const sold = allRecords
        .filter(r => r.status === 'sold')
        .sort((a, b) => new Date(b.dateOut) - new Date(a.dateOut));
      
      setRecords([...available, ...sold]);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Single Production Submit
  const handleProduction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/product-records/production', {
        productId: id,
        kg: parseFloat(productionForm.kg),
        size: productionForm.size,
        thickness: productionForm.thickness,
        shift: productionForm.shift
      });
      setShowProductionModal(false);
      setProductionForm({ kg: '', size: '', thickness: '', shift: 'morning' });
      fetchAll();
    } catch (error) {
      console.error('Error recording production:', error);
    }
  };

  // Handle Bulk Production Submit
  const handleBulkProduction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/product-records/production/bulk', {
        productId: id,
        rolls: bulkRolls.map(roll => ({
          ...roll,
          kg: parseFloat(roll.kg)
        }))
      });
      setShowBulkModal(false);
      setBulkRolls([{ kg: '', size: '', thickness: '', shift: 'morning' }]);
      fetchAll();
    } catch (error) {
      console.error('Error recording bulk production:', error);
    }
  };

  // Add a new row to the bulk table
  const addBulkRow = () => {
    setBulkRolls([...bulkRolls, { kg: '', size: '', thickness: '', shift: 'morning' }]);
  };

  // Remove a row from the bulk table
  const removeBulkRow = (index) => {
    const updated = bulkRolls.filter((_, i) => i !== index);
    setBulkRolls(updated.length > 0 ? updated : [{ kg: '', size: '', thickness: '', shift: 'morning' }]);
  };

  // Update a bulk row field
  const updateBulkRow = (index, field, value) => {
    const updated = [...bulkRolls];
    updated[index][field] = value;
    setBulkRolls(updated);
  };

  // Handle Sale Submit
  const handleSale = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/product-records/sell/${selectedRecord._id}`, {
        customerName: saleForm.customerName,
        pricePerKg: parseFloat(saleForm.pricePerKg) || 0,
        discount: parseFloat(saleForm.discount) || 0,
        totalAmount: parseFloat(saleForm.totalAmount) || 0,
        paymentType: saleForm.paymentType
      });
      setShowSaleModal(false);
      setSelectedRecord(null);
      setSaleForm({ customerName: '', pricePerKg: '', discount: '', totalAmount: '', paymentType: 'cash' });
      fetchAll();
    } catch (error) {
      console.error('Error recording sale:', error);
    }
  };

  const openSaleModal = (record) => {
    setSelectedRecord(record);
    setShowSaleModal(true);
  };

  if (loading) {
    return (
      <div className="products-loading">
        <Loader2 size={40} className="spin" />
        <p>Loading book...</p>
      </div>
    );
  }

  // Split records for display
  const availableRecords = records.filter(r => r.status !== 'sold');
  const soldRecords = records.filter(r => r.status === 'sold');

  return (
    <div className="product-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/products')}>
          <ArrowLeft size={20} />
          Back to Products
        </button>
        <h1 className="detail-title">📖 {product?.name || 'Product'} Record Book</h1>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card in">
          <TrendingUp size={24} />
          <div>
            <p className="summary-label">Total Produced</p>
            <h3>{summary.totalProduced} kg</h3>
          </div>
        </div>
        <div className="summary-card out">
          <TrendingDown size={24} />
          <div>
            <p className="summary-label">Total Sold</p>
            <h3>{summary.totalSold} kg</h3>
          </div>
        </div>
        <div className="summary-card stock">
          <Package size={24} />
          <div>
            <p className="summary-label">In Stock</p>
            <h3>{summary.currentStock} kg</h3>
          </div>
        </div>
        <div className="summary-card revenue">
          <span className="naira">₦</span>
          <div>
            <p className="summary-label">Total Revenue</p>
            <h3>₦{summary.totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn-production" onClick={() => setShowProductionModal(true)}>
          <Plus size={20} />
          Record Single Roll
        </button>
        <button className="btn-production bulk" onClick={() => setShowBulkModal(true)} style={{ background: '#7c3aed' }}>
          <Layers size={20} />
          Bulk Entry (Multiple Rolls)
        </button>
      </div>

      {/* AVAILABLE ROLLS SECTION */}
      <div className="records-section">
        <div className="records-section-header">
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📦 Available Rolls ({availableRecords.length})
          </h2>
        </div>
        <div className="records-table-container">
          <table className="records-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Size</th>
                <th>KG</th>
                <th>Thickness</th>
                <th>Shift</th>
                <th>Date Delivered</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {availableRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-row">
                    No available rolls. Click "Record Single Roll" or "Bulk Entry" to add stock.
                  </td>
                </tr>
              ) : (
                availableRecords.map((record, index) => (
                  <tr key={record._id} className={record.status}>
                    <td className="font-bold">#{index + 1}</td>
                    <td className="size-cell">{record.size || '-'}</td>
                    <td className="kg-cell">{record.kg} kg</td>
                    <td>{record.thickness || '-'}</td>
                    <td>
                      {record.shift === 'morning' && <span className="shift-badge morning"><Sun size={14} /> AM</span>}
                      {record.shift === 'night' && <span className="shift-badge night"><Moon size={14} /> PM</span>}
                    </td>
                    <td>{new Date(record.dateIn).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${record.status}`}>
                        {record.status === 'pending' ? '⏳ Pending' : '✅ In Stock'}
                      </span>
                    </td>
                    <td>
                      {record.status === 'verified' && (
                        <button className="sell-btn" onClick={() => openSaleModal(record)}>
                          <ShoppingCart size={14} />
                          Sell
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SOLD ROLLS SECTION */}
      <div className="records-section" style={{ marginTop: '32px' }}>
        <div className="records-section-header">
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📤 Sold Rolls ({soldRecords.length})
          </h2>
        </div>
        <div className="records-table-container">
          <table className="records-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Size</th>
                <th>KG</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Date Delivered</th>
                <th>Date Sold</th>
              </tr>
            </thead>
            <tbody>
              {soldRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-row">
                    No rolls sold yet.
                  </td>
                </tr>
              ) : (
                soldRecords.map((record, index) => (
                  <tr key={record._id} className="sold-row" style={{ background: '#f8fafc' }}>
                    <td className="font-bold">#{index + 1}</td>
                    <td className="size-cell">{record.size || '-'}</td>
                    <td className="kg-cell">{record.kg} kg</td>
                    <td>{record.customerName || 'Walk-in'}</td>
                    <td>{record.totalAmount ? `₦${record.totalAmount.toLocaleString()}` : '-'}</td>
                    <td>{new Date(record.dateIn).toLocaleDateString()}</td>
                    <td>{record.dateOut ? new Date(record.dateOut).toLocaleDateString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SINGLE PRODUCTION MODAL */}
      {showProductionModal && (
        <div className="modal-overlay" onClick={() => setShowProductionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>⬇️ Record Single Roll (Goods IN)</h2>
            <form onSubmit={handleProduction}>
              <div className="form-group">
                <label>Weight (KG) *</label>
                <input type="number" step="0.01" value={productionForm.kg} onChange={(e) => setProductionForm({ ...productionForm, kg: e.target.value })} placeholder="e.g., 12.5" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Size</label>
                  <input type="text" value={productionForm.size} onChange={(e) => setProductionForm({ ...productionForm, size: e.target.value })} placeholder="e.g., 15.2 X 0.18" />
                </div>
                <div className="form-group">
                  <label>Thickness</label>
                  <input type="text" value={productionForm.thickness} onChange={(e) => setProductionForm({ ...productionForm, thickness: e.target.value })} placeholder="e.g., 2mm" />
                </div>
              </div>
              <div className="form-group">
                <label>Shift</label>
                <div className="shift-selector">
                  <button type="button" className={`shift-option ${productionForm.shift === 'morning' ? 'active' : ''}`} onClick={() => setProductionForm({ ...productionForm, shift: 'morning' })}>
                    <Sun size={18} /> Morning
                  </button>
                  <button type="button" className={`shift-option ${productionForm.shift === 'night' ? 'active' : ''}`} onClick={() => setProductionForm({ ...productionForm, shift: 'night' })}>
                    <Moon size={18} /> Night
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowProductionModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">Save Roll</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK PRODUCTION MODAL */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal-content bulk-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2>📦 Bulk Entry - Record Multiple Rolls</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
              Add all rolls from this delivery. Click "+ Add Row" for each roll.
            </p>
            <form onSubmit={handleBulkProduction}>
              <div style={{ marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Weight (KG) *</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Size</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Thickness</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRolls.map((roll, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontWeight: '700', color: '#64748b' }}>{index + 1}</td>
                        <td style={{ padding: '8px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={roll.kg}
                            onChange={(e) => updateBulkRow(index, 'kg', e.target.value)}
                            placeholder="12.5"
                            required
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input
                            type="text"
                            value={roll.size}
                            onChange={(e) => updateBulkRow(index, 'size', e.target.value)}
                            placeholder="15.2 X 0.18"
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input
                            type="text"
                            value={roll.thickness}
                            onChange={(e) => updateBulkRow(index, 'thickness', e.target.value)}
                            placeholder="2mm"
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        </td>
                        <td style={{ padding: '8px' }}>
                          {bulkRolls.length > 1 && (
                            <button type="button" onClick={() => removeBulkRow(index)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button type="button" onClick={addBulkRow} style={{ background: '#eff6ff', color: '#2563eb', border: '1px dashed #93c5fd', borderRadius: '8px', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Plus size={18} /> Add Row
              </button>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowBulkModal(false)}>Cancel</button>
                <button type="submit" className="btn-save" style={{ background: '#7c3aed' }}>
                  Submit {bulkRolls.length} Roll{bulkRolls.length > 1 ? 's' : ''}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SALE MODAL */}
      {showSaleModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowSaleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>⬆️ Record Sale (Goods OUT)</h2>
            <p className="sale-context">
              Selling: <strong>{selectedRecord.kg} kg</strong> | Size: <strong>{selectedRecord.size || '-'}</strong> | Date In: <strong>{new Date(selectedRecord.dateIn).toLocaleDateString()}</strong>
            </p>
            <form onSubmit={handleSale}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input type="text" value={saleForm.customerName} onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })} placeholder="e.g., Mr. Ade, Cash Sale" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price per KG (₦)</label>
                  <input type="number" value={saleForm.pricePerKg} onChange={(e) => setSaleForm({ ...saleForm, pricePerKg: e.target.value })} placeholder="e.g., 500" />
                </div>
                <div className="form-group">
                  <label>Discount (₦)</label>
                  <input type="number" value={saleForm.discount} onChange={(e) => setSaleForm({ ...saleForm, discount: e.target.value })} placeholder="e.g., 500" />
                </div>
              </div>
              <div className="form-group">
                <label>Total Amount (₦)</label>
                <input type="number" value={saleForm.totalAmount} onChange={(e) => setSaleForm({ ...saleForm, totalAmount: e.target.value })} placeholder="e.g., 15000" />
              </div>
              <div className="form-group">
                <label>Payment Type</label>
                <div className="payment-selector">
                  <button type="button" className={`payment-option ${saleForm.paymentType === 'cash' ? 'active' : ''}`} onClick={() => setSaleForm({ ...saleForm, paymentType: 'cash' })}>
                    💵 Cash
                  </button>
                  <button type="button" className={`payment-option ${saleForm.paymentType === 'credit' ? 'active' : ''}`} onClick={() => setSaleForm({ ...saleForm, paymentType: 'credit' })}>
                    📝 Credit
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowSaleModal(false)}>Cancel</button>
                <button type="submit" className="btn-save btn-sell-save">Confirm Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}