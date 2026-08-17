import { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Package, Plus, Layers, AlertCircle, CheckCircle, Loader2, Sun, Moon } from 'lucide-react';

export default function WorkerRestock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Bulk Entry Modal States
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [bulkRolls, setBulkRolls] = useState([
    { kg: '', size: '', thickness: '', shift: 'morning' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userString = localStorage.getItem('workwave_user');
  const user = userString ? JSON.parse(userString) : {};
  const workerBranchId = user.branchId ? user.branchId.toString() : '';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      const allProducts = res.data.products || [];
      
      const myBranchProducts = allProducts.filter(p => {
        if (!p.branchInventory || !Array.isArray(p.branchInventory)) return false;
        return p.branchInventory.some(inv => {
          if (!inv.branchId) return false;
          const invId = typeof inv.branchId === 'object' 
            ? inv.branchId._id?.toString() 
            : inv.branchId.toString();
          return invId === workerBranchId;
        });
      });
      setProducts(myBranchProducts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  // Bulk Entry Functions
  const addBulkRow = () => {
    setBulkRolls([...bulkRolls, { kg: '', size: '', thickness: '', shift: 'morning' }]);
  };

  const removeBulkRow = (index) => {
    const updated = bulkRolls.filter((_, i) => i !== index);
    setBulkRolls(updated.length > 0 ? updated : [{ kg: '', size: '', thickness: '', shift: 'morning' }]);
  };

  const updateBulkRow = (index, field, value) => {
    const updated = [...bulkRolls];
    updated[index][field] = value;
    setBulkRolls(updated);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (!selectedProductId) {
      setError('Please select a product');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/product-records/production/bulk', {
        productId: selectedProductId,
        rolls: bulkRolls.map(roll => ({
          ...roll,
          kg: parseFloat(roll.kg)
        }))
      });
      
      setSuccess(res.data.message || 'Delivery recorded successfully!');
      setShowBulkModal(false);
      setSelectedProductId('');
      setBulkRolls([{ kg: '', size: '', thickness: '', shift: 'morning' }]);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to record delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple restock function (existing)
  const handleSimpleRestock = async (productId, quantity) => {
    try {
      await api.put(`/products/${productId}/restock`, { quantityToAdd: quantity });
      setSuccess('Stock updated successfully!');
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to restock');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <Loader2 size={40} className="spin" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={28} color="#16a34a" /> Restock & Deliveries
        </h1>
        <p style={{ color: '#666' }}>Record new deliveries and manage branch inventory.</p>
      </div>

      {/* Messages */}
      {success && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} /> {success}
        </div>
      )}
      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Action Button */}
      <div style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => setShowBulkModal(true)}
          style={{
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            padding: '14px 24px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layers size={20} />
          Record Bulk Delivery (Multiple Rolls)
        </button>
      </div>

      {/* Product List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <Package size={48} style={{ opacity: 0.3 }} />
            <p>No products assigned to your branch yet.</p>
          </div>
        ) : (
          products.map(product => {
            const myBranchInv = product.branchInventory?.find(inv => {
              const invId = typeof inv.branchId === 'object' ? inv.branchId._id?.toString() : inv.branchId?.toString();
              return invId === workerBranchId;
            });
            
            return (
              <div key={product._id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                    {product.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    Current Stock: <strong>{myBranchInv?.stockQuantity || 0}</strong> {product.unit || 'units'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    placeholder="Qty"
                    style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    id={`restock-${product._id}`}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(`restock-${product._id}`);
                      if (input.value) {
                        handleSimpleRestock(product._id, parseFloat(input.value));
                        input.value = '';
                      }
                    }}
                    style={{ background: '#16a34a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    <Plus size={16} /> Restock
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* BULK ENTRY MODAL */}
      {showBulkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
              📦 Record Bulk Delivery
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px' }}>
              Record all rolls/items from this delivery. Click "+ Add Row" for each item.
            </p>

            <form onSubmit={handleBulkSubmit}>
              {/* Product Selector */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Select Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  <option value="">-- Choose a product --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Bulk Table */}
              <div style={{ marginBottom: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>#</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Weight (KG) *</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Size</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Thickness</th>
                      <th style={{ padding: '8px' }}></th>
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

              {/* Add Row Button */}
              <button type="button" onClick={addBulkRow} style={{ background: '#eff6ff', color: '#2563eb', border: '1px dashed #93c5fd', borderRadius: '8px', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Plus size={18} /> Add Row
              </button>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowBulkModal(false)} style={{ background: '#f1f5f9', color: '#334155', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} style={{ background: isSubmitting ? '#94a3b8' : '#7c3aed', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSubmitting ? <Loader2 size={18} className="spin" /> : <Layers size={18} />}
                  Submit {bulkRolls.length} Roll{bulkRolls.length > 1 ? 's' : ''}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}