import { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { 
  Calendar, TrendingUp, TrendingDown, DollarSign, 
  Package, ShoppingCart, Wallet, Loader2, FileText,
  CreditCard, Banknote, Smartphone, Printer
} from 'lucide-react';
import './DailyReportPage.css';

export default function DailyReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchReport();
  }, [selectedDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/daily?date=${selectedDate}`);
      setReport(res.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dr-loading">
        <Loader2 size={40} className="spin" />
        <p>Generating report...</p>
      </div>
    );
  }

  const isProfitPositive = report.netProfit >= 0;

  return (
    <div className="dr-page">
      {/* Header */}
      <div className="dr-header">
        <div className="dr-header-left">
          <h1 className="dr-title">
            <FileText size={28} /> Daily Summary Report
          </h1>
          <p className="dr-subtitle">Complete overview of business performance</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Print Button */}
          <button 
            onClick={() => window.print()} 
            className="dr-print-btn dr-no-print"
            title="Print Report"
          >
            <Printer size={18} /> Print
          </button>

          {/* Date Picker */}
          <div className="dr-date-picker dr-no-print">
            <Calendar size={18} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Report Date Banner */}
      <div className="dr-date-banner">
        📅 Report for: <strong>{new Date(report.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
      </div>

      {/* Main Summary Cards */}
      <div className="dr-summary-grid">
        <div className="dr-card dr-card-revenue">
          <div className="dr-card-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="dr-card-info">
            <p>Total Sales</p>
            <h3>₦{report.totalSalesRevenue.toLocaleString()}</h3>
            <span>{report.salesCount} transactions</span>
          </div>
        </div>

        <div className="dr-card dr-card-expenses">
          <div className="dr-card-icon">
            <TrendingDown size={24} />
          </div>
          <div className="dr-card-info">
            <p>Total Expenses</p>
            <h3>₦{report.totalExpenses.toLocaleString()}</h3>
            <span>{report.expenses.length} records</span>
          </div>
        </div>

        <div className={`dr-card ${isProfitPositive ? 'dr-card-profit' : 'dr-card-loss'}`}>
          <div className="dr-card-icon">
            {isProfitPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
          <div className="dr-card-info">
            <p>{isProfitPositive ? 'Net Profit' : 'Net Loss'}</p>
            <h3>₦{Math.abs(report.netProfit).toLocaleString()}</h3>
            <span>{isProfitPositive ? 'Profitable day ✅' : 'Loss day ⚠️'}</span>
          </div>
        </div>

        <div className="dr-card dr-card-production">
          <div className="dr-card-icon">
            <Package size={24} />
          </div>
          <div className="dr-card-info">
            <p>Production</p>
            <h3>{report.totalProductionKg} kg</h3>
            <span>{report.productionCount} batches produced</span>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="dr-section">
        <h2 className="dr-section-title">
          <Wallet size={20} /> Payment Method Breakdown
        </h2>
        <div className="dr-payment-grid">
          <div className="dr-payment-item">
            <Banknote size={20} />
            <div>
              <p>Cash</p>
              <strong>₦{report.cashSales.toLocaleString()}</strong>
            </div>
          </div>
          <div className="dr-payment-item">
            <Smartphone size={20} />
            <div>
              <p>Transfer</p>
              <strong>₦{report.transferSales.toLocaleString()}</strong>
            </div>
          </div>
          <div className="dr-payment-item">
            <CreditCard size={20} />
            <div>
              <p>POS</p>
              <strong>₦{report.posSales.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dr-two-columns">
        {/* Top Products Sold */}
        <div className="dr-section">
          <h2 className="dr-section-title">
            <ShoppingCart size={20} /> Top Products Sold
          </h2>
          <div className="dr-list">
            {report.productBreakdown.length === 0 ? (
              <p className="dr-empty">No sales recorded for this day.</p>
            ) : (
              report.productBreakdown.map((product, index) => (
                <div key={index} className="dr-list-item">
                  <span className="dr-list-rank">#{index + 1}</span>
                  <span className="dr-list-name">{product.name}</span>
                  <span className="dr-list-value">₦{product.total.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="dr-section">
          <h2 className="dr-section-title">
            <TrendingDown size={20} /> Expenses by Category
          </h2>
          <div className="dr-list">
            {report.expenseBreakdown.length === 0 ? (
              <p className="dr-empty">No expenses recorded for this day.</p>
            ) : (
              report.expenseBreakdown.map((item, index) => (
                <div key={index} className="dr-list-item">
                  <span className="dr-list-rank">#{index + 1}</span>
                  <span className="dr-list-name">{item.category}</span>
                  <span className="dr-list-value expense">₦{item.total.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detailed Expense List */}
      <div className="dr-section">
        <h2 className="dr-section-title">
          <FileText size={20} /> All Expenses Today
        </h2>
        <div className="dr-list">
          {report.expenses.length === 0 ? (
            <p className="dr-empty">No expenses recorded.</p>
          ) : (
            report.expenses.map((exp, index) => (
              <div key={index} className="dr-list-item">
                <span className="dr-list-name">{exp.description}</span>
                <span className="dr-list-category">{exp.category}</span>
                <span className="dr-list-value expense">-₦{exp.amount.toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}