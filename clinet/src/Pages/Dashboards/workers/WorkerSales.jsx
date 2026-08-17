import { useState, useEffect, useMemo } from 'react';
import api from '../../../utils/api';
import { ShoppingCart, Plus, AlertCircle, Search, Loader2 } from 'lucide-react';
import './WorkerSales.css'; // <-- ADDED THIS IMPORT

export default function WorkerSales() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 🛡️ THE LOADING SHIELD (Prevents double-clicks!)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userString = localStorage.getItem('workwave_user');
  const user = userString ? JSON.parse(userString) : {};
  const workerBranchId = user.branchId ? user.branchId.toString() : '';

  const [formData, setFormData] = useState({
    productId: '', productName: '', quantity: 1, unitPrice: 0, totalPrice: 0, buyerName: '', paymentMethod: 'Cash'
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const productRes = await api.get('/products');
      const allProducts = productRes.data.products || [];
      
      const myBranchProducts = allProducts.filter(p => {
        if (!p.branchInventory || !Array.isArray(p.branchInventory)) return false;
        
        return p.branchInventory.some(inv => {
          if (!inv.branchId) return false;
          // Handle both object { _id: "..." } and plain string "..."
          const invId = typeof inv.branchId === 'object' 
            ? inv.branchId._id?.toString() 
            : inv.branchId.toString();
            
          return invId === workerBranchId;
        });
      });
      setProducts(myBranchProducts);

      const saleRes = await api.get('/sales');
      const allSales = saleRes.data.sales || [];
      
      const myBranchSales = allSales.filter(sale => {
        const saleBranchId = typeof sale.branchId === 'object' ? sale.branchId._id : sale.branchId;
        return saleBranchId === workerBranchId;
      });
       
      setSales(myBranchSales);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setLoading(false);
    }
  };

  // 📅 GROUP SALES BY DATE
  const groupedSales = useMemo(() => {
    const groups = {};
    sales.forEach((sale) => {
      const dateKey = new Date(sale.createdAt).toLocaleDateString('en-GB', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(sale);
    });
    return groups;
  }, [sales]);

  // 💰 CALCULATE DAILY TOTALS
  const getDailyTotals = (daySales) => {
    const totalRevenue = daySales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalQty = daySales.reduce((sum, s) => sum + s.quantity, 0);
    return { totalRevenue, totalQty };
  };

  const handleProductChange = (e) => {
    const typedName = e.target.value;
    setFormData({ ...formData, productName: typedName });

    const foundProduct = products.find(p => p.name.toLowerCase() === typedName.toLowerCase());
    
    if (foundProduct && foundProduct.branchInventory) {
      const myBranchInventory = foundProduct.branchInventory.find(
        inv => inv.branchId && inv.branchId._id?.toString() === workerBranchId
      );

      if (myBranchInventory) {
        const newTotal = formData.quantity * myBranchInventory.sellingPrice;
        setFormData(prev => ({ ...prev, productId: foundProduct._id, unitPrice: myBranchInventory.sellingPrice, totalPrice: newTotal }));
      } else {
        setFormData(prev => ({ ...prev, productId: '', unitPrice: 0, totalPrice: 0 }));
      }
    } else {
      setFormData(prev => ({ ...prev, productId: '', unitPrice: 0, totalPrice: 0 }));
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    let newQuantity = formData.quantity;
    let newPrice = formData.unitPrice;
    if (name === 'quantity') newQuantity = numValue;
    if (name === 'unitPrice') newPrice = numValue;
    setFormData({ ...formData, [name]: numValue, totalPrice: newQuantity * newPrice });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // 🛑 Shield active!
    setIsSubmitting(true); // 🔒 Lock button
    setError(''); setSuccess('');

    if (!formData.productId) {
      setError("Please select a valid product from your branch inventory.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/sales', formData);
      setSuccess(res.data.message || "Sale recorded successfully!");
      setFormData({ productId: '', productName: '', quantity: 1, unitPrice: 0, totalPrice: 0, buyerName: '', paymentMethod: 'Cash' });
      fetchData(); 
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to record sale.';
      setError(errMsg);
    } finally {
      setIsSubmitting(false); // 🔓 Unlock button
    }
  };

  if (loading) return <div style={{padding: '20px'}}>Loading sales data...</div>;

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShoppingCart size={28} color="#16a34a" /> Record Sale
        </h1>
        <p style={{ color: '#666' }}>Process a new transaction. Stock will be automatically deducted.</p>
      </div>

      {error && <div style={msgStyle('#fee2e2', '#991b1b')}><AlertCircle size={18}/> {error}</div>}
      {success && <div style={msgStyle('#dcfce7', '#166534')}>✅ {success}</div>}

      <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div style={{ gridColumn: 'span 2' }}>
            <label htmlFor="productName" style={labelStyle}>Product Name *</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              <input id="productName" type="text" list="product-list" name="productName" value={formData.productName} onChange={handleProductChange} placeholder="Start typing to search..." required style={{ ...inputStyle, paddingLeft: '36px' }} />
              <datalist id="product-list">
                {products.map(p => <option key={p._id} value={p.name} />)}
              </datalist>
            </div>
          </div>

          <div>
            <label htmlFor="quantity" style={labelStyle}>Quantity *</label>
            <input id="quantity" type="number" name="quantity" value={formData.quantity} onChange={handleNumberChange} min="1" required style={inputStyle} />
          </div>

          <div>
            <label htmlFor="unitPrice" style={labelStyle}>Unit Price (₦) *</label>
            <input id="unitPrice" type="number" name="unitPrice" value={formData.unitPrice} onChange={handleNumberChange} required style={inputStyle} />
          </div>

          <div>
            <label htmlFor="totalPrice" style={labelStyle}>Total Price (₦)</label>
            <input id="totalPrice" type="text" value={`₦${formData.totalPrice.toLocaleString()}`} readOnly style={{ ...inputStyle, backgroundColor: '#e2e8f0', fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }} />
          </div>

          <div>
            <label htmlFor="paymentMethod" style={labelStyle}>Payment Method</label>
            <select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} style={inputStyle}>
              <option value="Cash">Cash</option><option value="Transfer">Transfer</option><option value="POS">POS</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label htmlFor="buyerName" style={labelStyle}>Customer Name (Optional)</label>
            <input id="buyerName" type="text" name="buyerName" value={formData.buyerName} onChange={handleChange} placeholder="Walk-in Customer" style={inputStyle} />
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              disabled={!formData.productId || isSubmitting} 
              style={{ 
                backgroundColor: (!formData.productId || isSubmitting) ? '#94a3b8' : '#16a34a', 
                color: 'white', 
                padding: '12px 32px', 
                borderRadius: '8px', 
                border: 'none', 
                cursor: (!formData.productId || isSubmitting) ? 'not-allowed' : 'pointer', 
                fontWeight: 'bold', 
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}
            >
              {isSubmitting ? (
                <><Loader2 size={20} className="spin" /> Saving...</>
              ) : (
                <><Plus size={20} /> Record Sale & Deduct Stock</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 👇 NEW DAILY GROUPING SECTION 👇 */}
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', marginTop: '32px' }}>Sales Records</h2>
      
      {Object.keys(groupedSales).length === 0 ? (
        <div className="ws-empty-state">
          <p>No sales recorded yet.</p>
        </div>
      ) : (
        Object.entries(groupedSales).map(([date, daySales]) => {
          const { totalRevenue, totalQty } = getDailyTotals(daySales);
          
          return (
            <div key={date} className="ws-day-group">
              <div className="ws-day-header">
                <span className="ws-day-date">📅 {date}</span>
                <div className="ws-day-summary">
                  <span className="ws-day-total">
                    Total Earned: <strong>₦{totalRevenue.toLocaleString()}</strong>
                  </span>
                  <span className="ws-day-qty">
                    {totalQty} item{totalQty > 1 ? 's' : ''} sold
                  </span>
                </div>
              </div>

              <div className="ws-day-records">
                {daySales.map((sale) => (
                  <div key={sale._id} className="ws-record-row">
                    <div className="ws-record-info">
                      <strong>{sale.productName}</strong>
                      <span className="ws-record-note">
                        {sale.buyerName || 'Walk-in'} • {sale.quantity}x @ ₦{(sale.totalPrice / sale.quantity).toLocaleString()}
                      </span>
                    </div>
                    <div className="ws-record-right">
                       <span className="ws-payment-badge">{sale.paymentMethod}</span>
                       <span className="ws-record-amount">+₦{sale.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// --- Styles ---
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '14px', boxSizing: 'border-box' };
const labelStyle = { fontSize: '14px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' };
const msgStyle = (bg, color) => ({ backgroundColor: bg, color, padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' });