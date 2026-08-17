import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../../utils/api";
import {
  ArrowLeft,
  Package,
  DollarSign,
  TrendingDown,
  ShoppingCart,
} from "lucide-react";

export default function BranchDetailsPage() {
  const { id } = useParams();
  const [branch, setBranch] = useState(null);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]); // NEW: Expenses state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranchData();

    const handleDataChanged = () => {
      fetchBranchData();
    };

    const handleStorage = (event) => {
      if (event.key === "workwave_data_changed") {
        fetchBranchData();
      }
    };

    window.addEventListener("workwave-data-changed", handleDataChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("workwave-data-changed", handleDataChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, [id]);

  const fetchBranchData = async () => {
    try {
      const branchRes = await api.get(`/branches/${id}`);
      setBranch(branchRes.data.branch);

      const productRes = await api.get(`/products?branchId=${id}`);
      setProducts(productRes.data.products);

      const saleRes = await api.get(`/sales?branchId=${id}`);
      setSales(saleRes.data.sales);

      // NEW: Fetch expenses for this branch
      const expenseRes = await api.get(`/expenses?branchId=${id}`);
      setExpenses(expenseRes.data.expenses);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching branch data:", err);
      setLoading(false);
    }
  };

  if (loading)
    return <div style={{ padding: "20px" }}>Loading branch details...</div>;
  if (!branch) return <div style={{ padding: "20px" }}>Branch not found.</div>;

  // --- THE MATH FIXES ---
  const totalStockUnits = products.reduce(
    (acc, product) => acc + (product.stockQuantity || 0),
    0,
  );

  // NEW: Filter out voided sales so they don't count towards the total!
  const activeSales = sales.filter((sale) => sale.status === "completed");

  const totalSalesAmount = activeSales.reduce(
    (acc, sale) => acc + sale.totalPrice,
    0,
  );
  const totalExpensesAmount = expenses.reduce(
    (acc, exp) => acc + exp.amount,
    0,
  );

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <Link
        to="/adminBranches"
        style={{
          textDecoration: "none",
          color: "#2563eb",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "16px",
          fontWeight: "bold",
        }}
      >
        <ArrowLeft size={18} /> Back to All Branches
      </Link>

      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>{branch.name}</h1>
        <p style={{ color: "#666", fontSize: "16px" }}>{branch.location}</p>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {/* FIXED: Now shows Total Physical Units */}
        <div style={cardStyle}>
          <Package size={24} color="#3b82f6" />
          <h3 style={cardTitle}>Total Stock Units</h3>
          <p style={cardValue}>{totalStockUnits.toLocaleString()}</p>
        </div>

        <div style={cardStyle}>
          <DollarSign size={24} color="#10b981" />
          <h3 style={cardTitle}>Total Sales</h3>
          <p style={cardValue}>₦{totalSalesAmount.toLocaleString()}</p>
        </div>

        {/* NEW: Total Expenses Card */}
        <div style={cardStyle}>
          <TrendingDown size={24} color="#ef4444" />
          <h3 style={cardTitle}>Total Expenses</h3>
          <p style={{ ...cardValue, color: "#ef4444" }}>
            ₦{totalExpensesAmount.toLocaleString()}
          </p>
        </div>

        <div style={cardStyle}>
          <ShoppingCart size={24} color="#8b5cf6" />
          <h3 style={cardTitle}>Transactions</h3>
          {/* Changed from sales.length to activeSales.length */}
          <p style={cardValue}>{activeSales.length}</p>
        </div>
      </div>

      {/* Current Stock Section */}
      <div style={{ marginBottom: "32px" }}>
        <h2
          style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}
        >
          Current Stock at this Branch
        </h2>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#f1f5f9" }}>
              <tr>
                <th style={thStyle}>Product Name</th>
                <th style={thStyle}>Size</th>
                <th style={thStyle}>Selling Price</th>
                <th style={thStyle}>Available Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#666",
                    }}
                  >
                    No stock in this branch yet.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product._id}
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                  >
                    <td style={tdStyle}>
                      <strong>{product.name}</strong>
                    </td>
                    <td style={tdStyle}>{product.size || "-"}</td>
                    <td style={tdStyle}>₦{product.sellingPrice}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          backgroundColor:
                            product.stockQuantity > 10 ? "#dcfce7" : "#fee2e2",
                          color:
                            product.stockQuantity > 10 ? "#166534" : "#991b1b",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                        }}
                      >
                        {product.stockQuantity} {product.unit}(s)
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Sales Section */}
      <div>
        <h2
          style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}
        >
          Recent Sales
        </h2>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#f1f5f9" }}>
              <tr>
                <th style={thStyle}>Product Sold</th>
                <th style={thStyle}>Quantity</th>
                <th style={thStyle}>Total Price</th>
                <th style={thStyle}>Date</th>
              </tr>
            </thead>
            <tbody>
              {activeSales.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#666",
                    }}
                  >
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                // Changed from sales.slice to activeSales.slice
                activeSales.slice(0, 5).map((sale) => (
                  <tr
                    key={sale._id}
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                  >
                    <td style={tdStyle}>
                      <strong>{sale.productName}</strong>
                    </td>
                    <td style={tdStyle}>{sale.quantity}</td>
                    <td style={tdStyle}>₦{sale.totalPrice.toLocaleString()}</td>
                    <td style={tdStyle}>
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};
const cardTitle = { fontSize: "14px", color: "#64748b", fontWeight: "500" };
const cardValue = { fontSize: "24px", fontWeight: "bold", color: "#0f172a" };
const thStyle = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "14px",
  fontWeight: "600",
  color: "#475569",
};
const tdStyle = { padding: "16px", fontSize: "14px", color: "#334155" };
