import { useState, useEffect, useRef, useMemo } from "react";
import api from "../../../utils/api";
import { TrendingDown, Plus, AlertCircle, Camera, X, Loader2 } from "lucide-react"; // Added Loader2
import "./WorkerExpenses.css";

export default function WorkerExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [receiptImage, setReceiptImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  // 🛡️ THE LOADING SHIELD (Prevents double-clicks!)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commonExpenses = [
    "Diesel / Fuel",
    "Transport",
    "Pure Water",
    "Packaging",
    "Maintenance",
  ];

  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    paymentMethod: "Cash",
    description: "",
  });

  useEffect(() => {
    fetchExpenses();

    const handleDataChanged = () => fetchExpenses();
    const handleStorage = (event) => {
      if (event.key === "workwave_data_changed") fetchExpenses();
    };

    window.addEventListener("workwave-data-changed", handleDataChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("workwave-data-changed", handleDataChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await api.get("/expenses");
      setExpenses(res.data.expenses);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // For showing the preview on screen
        setReceiptImage(reader.result); // Save the Base64 text string
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setReceiptImage(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🛑 THE SHIELD: Stop if already submitting
    if (isSubmitting) return; 
    
    setIsSubmitting(true); // 🔒 LOCK THE BUTTON
    setError("");
    setSuccess("");

    try {
      // Send as standard JSON instead of FormData!
      await api.post("/expenses", {
        category: formData.category,
        amount: formData.amount,
        paymentMethod: formData.paymentMethod,
        description: formData.description,
        receiptUrl: receiptImage || "", // Send the Base64 text string here
      });

      setSuccess("Expense recorded successfully!");

      setFormData({
        category: "",
        amount: "",
        paymentMethod: "Cash",
        description: "",
      });
      removeImage();
      await fetchExpenses();
      window.dispatchEvent(new Event("workwave-data-changed"));
      localStorage.setItem("workwave_data_changed", Date.now().toString());
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record expense.");
    } finally {
      // 🔓 UNLOCK THE BUTTON (Always runs!)
      setIsSubmitting(false); 
    }
  };

  // Group expenses by date
const groupedExpenses = useMemo(() => {
  const groups = {};
  
  expenses.forEach((exp) => {
    const dateKey = new Date(exp.createdAt).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(exp);
  });
  
  return groups;
}, [expenses]);

// Calculate daily totals
const getDailyTotals = (dayExpenses) => {
  const totalAmount = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  return { totalAmount };
};

  if (loading) {
    return <div className="we-loading">Loading expenses...</div>;
  }

  return (
    <div className="we-page">
      <h1 className="we-title">
        <TrendingDown size={28} /> Record Expense
      </h1>

      {error && (
        <div className="we-message we-message-error">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div className="we-message we-message-success">✅ {success}</div>
      )}

      <div className="we-form-container">
        <form onSubmit={handleSubmit} className="we-form">
          <div className="we-form-group we-full-width">
            <label className="we-label">Category *</label>
            <input
              type="text"
              list="exp-cats"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              placeholder="Select or type..."
              className="we-input"
            />
            <datalist id="exp-cats">
              {commonExpenses.map((c, i) => (
                <option key={i} value={c} />
              ))}
            </datalist>
          </div>

          <div className="we-form-group">
            <label className="we-label">Amount (₦) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              className="we-input"
            />
          </div>

          <div className="we-form-group">
            <label className="we-label">Payment Method *</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="we-input"
            >
              <option value="Cash">Cash</option>
              <option value="Transfer">Transfer</option>
            </select>
          </div>

          <div className="we-form-group we-full-width">
            <label className="we-label">Note (Optional)</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Bought 20L for generator"
              className="we-input"
            />
          </div>

          <div className="we-receipt-section we-full-width">
            <label className="we-label">📸 Snap Receipt (Optional but Recommended)</label>

            {!imagePreview ? (
              <label className="we-receipt-upload">
                <Camera size={32} />
                <span>Click to take photo or upload</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="we-file-input"
                />
              </label>
            ) : (
              <div className="we-receipt-preview">
                <img
                  src={imagePreview}
                  alt="Receipt"
                  className="we-receipt-image"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="we-remove-image-btn"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="we-form-actions">
            {/* 👇 THE SECURE BUTTON 👇 */}
            <button 
              type="submit" 
              className="we-submit-btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="spin" /> Saving...
                </>
              ) : (
                <>
                  <Plus size={20} /> Record Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>

   
         <h2 className="we-section-title">Expense Records</h2>
      
      {Object.keys(groupedExpenses).length === 0 ? (
        <div className="we-empty-state">
          <p>No expenses recorded yet.</p>
        </div>
      ) : (
        Object.entries(groupedExpenses).map(([date, dayExpenses]) => {
          const { totalAmount } = getDailyTotals(dayExpenses);
          
          return (
            <div key={date} className="we-day-group">
              {/* Date Separator */}
              <div className="we-day-header">
                <span className="we-day-date">📅 {date}</span>
                <div className="we-day-summary">
                  <span className="we-day-total">
                    Total Spent: <strong>₦{totalAmount.toLocaleString()}</strong>
                  </span>
                </div>
              </div>

              {/* Day's Records */}
              <div className="we-day-records">
                {dayExpenses.map((exp) => (
                  <div key={exp._id} className="we-record-row">
                    <div className="we-record-info">
                      <strong>{exp.category}</strong>
                      <span className="we-record-note">{exp.description || 'No note'}</span>
                    </div>
                    <div className="we-record-amount">
                      -₦{exp.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
      
      <div className="we-table-container">
        <table className="we-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Note</th>
              <th>Receipt</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="5" className="we-empty">
                  No expenses recorded yet.
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp._id}>
                  <td>
                    <strong>{exp.category}</strong>
                  </td>
                  <td className="we-amount">
                    ₦{exp.amount.toLocaleString()}
                  </td>
                  <td className="we-note">
                    {exp.description || "-"}
                  </td>
                  <td>
                    {exp.receiptUrl ? (
                      <a
                        href={exp.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="we-receipt-link"
                      >
                        📄 View Receipt
                      </a>
                    ) : (
                      <span className="we-no-receipt">None</span>
                    )}
                  </td>
                  <td className="we-date">
                    {new Date(exp.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}