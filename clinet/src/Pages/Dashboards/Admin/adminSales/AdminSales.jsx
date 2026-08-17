import { useState, useEffect, useMemo } from "react";
import api from "../../../../utils/api";
import {
  ShoppingCart, Plus, AlertCircle, Search, Download, CalendarDays, X
} from "lucide-react";
import { exportToCSV } from "../../../../utils/xportCSV";
import "./AdminSales.css";

export default function AdminSales() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [formData, setFormData] = useState({
    productId: "", productName: "", quantity: 1, unitPrice: 0, totalPrice: 0, buyerName: "", paymentMethod: "Cash",
  });

  // Inline styles for the new daily layout
  const styles = {
    dayGroup: { marginBottom: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    dayHeader: { padding: '14px 20px', background: '#f0fdf4', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    dayDate: { fontWeight: '700', color: '#166534', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' },
    dayTotal: { fontWeight: '800', color: '#16a34a', fontSize: '18px' },
    recordRow: { padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', transition: 'background 0.2s' },
    recordInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
    recordTitle: { fontWeight: '700', color: '#0f172a', fontSize: '16px' },
    recordMeta: { fontSize: '13px', color: '#64748b', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' },
    branchBadge: { background: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' },
    paymentBadge: { background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' },
    amount: { fontWeight: '800', fontSize: '18px', color: '#16a34a', whiteSpace: 'nowrap' },
    voidBtn: { padding: '8px 16px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' },
    voidedRow: { background: '#f8fafc', opacity: 0.6 }
  };

  useEffect(() => {
    fetchData();
    const handleDataChanged = () => fetchData();
    const handleStorage = (event) => { if (event.key === "workwave_data_changed") fetchData(); };
    window.addEventListener("workwave-data-changed", handleDataChanged);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("workwave-data-changed", handleDataChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const fetchData = async () => {
    try {
      const productRes = await api.get("/products");
      setProducts(productRes.data.products || []);
      const saleRes = await api.get("/sales");
      setSales(saleRes.data.sales || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setLoading(false);
    }
  };

  const handleProductChange = (e) => {
    const typedName = e.target.value;
    setFormData((prev) => ({ ...prev, productName: typedName }));
    const foundProduct = products.find((p) => p.name.toLowerCase() === typedName.toLowerCase());
    if (foundProduct) {
      const newTotal = formData.quantity * foundProduct.sellingPrice;
      setFormData((prev) => ({ ...prev, productId: foundProduct._id, unitPrice: foundProduct.sellingPrice, totalPrice: newTotal }));
    } else {
      setFormData((prev) => ({ ...prev, productId: "", unitPrice: 0, totalPrice: 0 }));
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    let newQuantity = formData.quantity;
    let newPrice = formData.unitPrice;
    if (name === "quantity") newQuantity = numValue;
    if (name === "unitPrice") newPrice = numValue;
    setFormData({ ...formData, [name]: numValue, totalPrice: newQuantity * newPrice });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const notifyDataChanged = () => {
    window.dispatchEvent(new Event("workwave-data-changed"));
    localStorage.setItem("workwave_data_changed", Date.now().toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!formData.productId) { setError("Please select a valid product."); return; }
    try {
      await api.post("/sales", formData);
      setSuccess("Sale recorded successfully! Stock updated.");
      setFormData({ productId: "", productName: "", quantity: 1, unitPrice: 0, totalPrice: 0, buyerName: "", paymentMethod: "Cash" });
      await fetchData(); notifyDataChanged();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.response?.data?.message || "Failed to record sale."); }
  };

  const handleVoid = async (saleId) => {
    if (window.confirm("⚠️ Are you sure you want to VOID this sale?")) {
      try {
        await api.put(`/sales/${saleId}/void`);
        setSuccess("Sale voided and stock restored!");
        await fetchData(); notifyDataChanged();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) { setError(err.response?.data?.message || "Failed to void sale."); }
    }
  };

  const filteredSales = sales.filter((sale) => {
    const saleDate = sale.createdAt.split("T")[0];
    const start = startDate || "0000-00-00";
    const end = endDate || "9999-12-31";
    return saleDate >= start && saleDate <= end;
  });

  // 📅 GROUP SALES BY DATE
  const groupedSales = useMemo(() => {
    const groups = {};
    filteredSales.forEach((sale) => {
      const dateKey = new Date(sale.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(sale);
    });
    return groups;
  }, [filteredSales]);

  const getDailyTotals = (daySales) => {
    return daySales.reduce((sum, s) => s.status !== 'voided' ? sum + s.totalPrice : sum, 0);
  };

  const handleExportCSV = () => {
    const columns = [
      { label: "Date", accessor: (item) => new Date(item.createdAt).toLocaleDateString() },
      { label: "Product", accessor: (item) => item.productName },
      { label: "Branch", accessor: (item) => item.branchId?.name || "Unknown" },
      { label: "Customer", accessor: (item) => item.buyerName },
      { label: "Quantity", accessor: (item) => item.quantity },
      { label: "Total Price", accessor: (item) => item.totalPrice },
      { label: "Payment", accessor: (item) => item.paymentMethod },
      { label: "Status", accessor: (item) => item.status },
    ];
    exportToCSV(filteredSales, columns, `WorkWave_Sales_${new Date().toISOString().split("T")[0]}.csv`);
  };

  if (loading) return <div className="sales-loading"><div className="sales-loading-spinner"></div><p>Loading...</p></div>;

  return (
    <div className="sales-page">
      {/* HEADER & FORM (Keep your existing header and form code here) */}
      <div className="sales-page-header">
        <div className="sales-title-area">
          <div className="sales-title-icon"><ShoppingCart size={22} /></div>
          <div><h1>Record Sale</h1><p>Process a new transaction.</p></div>
        </div>
        <button type="button" className="sales-export-btn" onClick={handleExportCSV}><Download size={17} /> Download CSV</button>
      </div>

      {error && <div className="sales-message sales-message-error"><AlertCircle size={18} /><span>{error}</span><button onClick={() => setError("")} className="sales-message-close"><X size={16} /></button></div>}
      {success && <div className="sales-message sales-message-success"><span className="sales-success-icon">✓</span><span>{success}</span><button onClick={() => setSuccess("")} className="sales-message-close"><X size={16} /></button></div>}

      <section className="sales-form-card">
        <div className="sales-section-heading"><div><h2>New Transaction</h2><p>Enter the details of the sale below.</p></div></div>
        <form onSubmit={handleSubmit} className="sales-form">
          <div className="sales-field sales-field-full">
            <label>Product Name *</label>
            <div className="sales-input-wrapper">
              <Search size={17} className="sales-input-icon" />
              <input type="text" list="product-list" name="productName" value={formData.productName} onChange={handleProductChange} placeholder="Start typing..." required className="sales-input sales-input-search" />
              <datalist id="product-list">{products.map((p) => <option key={p._id} value={p.name} />)}</datalist>
            </div>
          </div>
          <div className="sales-field"><label>Quantity *</label><input type="number" name="quantity" value={formData.quantity} onChange={handleNumberChange} min="1" required className="sales-input" /></div>
          <div className="sales-field"><label>Unit Price (₦) *</label><input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleNumberChange} min="0" required className="sales-input" /></div>
          <div className="sales-field"><label>Total Price (₦)</label><input type="text" value={`₦${formData.totalPrice.toLocaleString()}`} readOnly className="sales-input sales-total-input" /></div>
          <div className="sales-field"><label>Payment Method</label><select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="sales-input sales-select"><option value="Cash">Cash</option><option value="Transfer">Transfer</option><option value="POS">POS</option></select></div>
          <div className="sales-field sales-field-full"><label>Customer Name (Optional)</label><input type="text" name="buyerName" value={formData.buyerName} onChange={handleChange} placeholder="Walk-in Customer" className="sales-input" /></div>
          <div className="sales-submit-area"><button type="submit" disabled={!formData.productId} className={`sales-submit-btn ${!formData.productId ? "sales-submit-disabled" : ""}`}><Plus size={19} />Record Sale & Deduct Stock</button></div>
        </form>
      </section>

      {/* ================= DAILY GROUPED HISTORY ================= */}
      <section className="sales-history">
        <div className="sales-history-header">
          <div><h2>Sales History</h2><p>{filteredSales.length} transactions found</p></div>
          <div className="sales-filters">
            <div className="sales-date-field"><CalendarDays size={15} /><label>From</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div className="sales-date-field"><CalendarDays size={15} /><label>To</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
            {(startDate || endDate) && <button onClick={() => {setStartDate(""); setEndDate("");}} className="sales-clear-filter"><X size={14} />Clear</button>}
          </div>
        </div>

        {/* NEW GROUPED LAYOUT */}
        {Object.keys(groupedSales).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: 'white', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
            <ShoppingCart size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>No sales recorded for this period.</p>
          </div>
        ) : (
          Object.entries(groupedSales).map(([date, daySales]) => {
            const total = getDailyTotals(daySales);
            return (
              <div key={date} style={styles.dayGroup}>
                <div style={styles.dayHeader}>
                  <span style={styles.dayDate}>📅 {date}</span>
                  <span style={styles.dayTotal}>₦{total.toLocaleString()}</span>
                </div>
                {daySales.map((sale) => {
                  const isVoided = sale.status === "voided";
                  return (
                    <div key={sale._id} style={{ ...styles.recordRow, ...(isVoided ? styles.voidedRow : {}) }}>
                      <div style={styles.recordInfo}>
                        <span style={{ ...styles.recordTitle, textDecoration: isVoided ? 'line-through' : 'none' }}>
                          {sale.productName} {isVoided && <span style={{ color: '#ef4444', fontSize: '12px', marginLeft: '8px' }}>(VOIDED)</span>}
                        </span>
                        <div style={styles.recordMeta}>
                          {sale.branchId?.name && <span style={styles.branchBadge}>🏢 {sale.branchId.name}</span>}
                          <span>👤 {sale.buyerName || 'Walk-in'}</span>
                          <span>📦 {sale.quantity} units</span>
                          <span style={styles.paymentBadge}>💳 {sale.paymentMethod}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ ...styles.amount, color: isVoided ? '#94a3b8' : '#16a34a' }}>
                          {isVoided ? '₦0' : `₦${sale.totalPrice.toLocaleString()}`}
                        </span>
                        {!isVoided && (
                          <button onClick={() => handleVoid(sale._id)} style={styles.voidBtn}>
                            Void
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}