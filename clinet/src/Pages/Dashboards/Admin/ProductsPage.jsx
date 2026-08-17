import api from "../../../utils/api";
import "./AdminProducts.css"; // Import the new CSS file
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Plus, ArrowRight, Scale, Loader2 } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    unit: "kg",
    branchId: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchBranches();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      const productList = Array.isArray(res.data?.products)
        ? res.data.products
        : Array.isArray(res.data)
          ? res.data
          : [];
      setProducts(productList);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get("/branches");
      setBranches(res.data.branches || res.data);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!newProduct.name.trim()) {
      setSubmitError("Please enter a product name.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await api.post("/products", {
        name: newProduct.name.trim(),
        unit: newProduct.unit,
        category: "manufactured",
        costPrice: 0,
        branchId: newProduct.branchId || null,
      });

      setShowAddModal(false);
      setNewProduct({ name: "", unit: "kg", branchId: "" });
      await fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      setSubmitError(
        error.response?.data?.message ||
          "Failed to create product. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="products-loading">
        <Loader2 size={40} className="spin" />
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="products-page">
      {/* Header */}
      <div className="products-header">
        <div>
          <h1 className="products-title">📦 Product Records</h1>
          <p className="products-subtitle">
            Click a product to open its record book
          </p>
        </div>
        <button
          className="add-product-btn"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Product Cards Grid */}
      <div className="products-grid">
        {products.map((product) => (
          <div
            key={product._id}
            className="product-card"
            onClick={() => navigate(`/admin/products/${product._id}`)}
          >
            <div className="product-card-icon">
              <Package size={32} />
            </div>
            <div className="product-card-info">
              <h3 className="product-card-name">{product.name}</h3>
              <p className="product-card-unit">Unit: {product.unit || "kg"}</p>
            </div>
            <div className="product-card-arrow">
              <ArrowRight size={20} />
            </div>
          </div>
        ))}

        {/* Empty State */}
        {products.length === 0 && (
          <div className="products-empty">
            <Package size={60} />
            <h3>No products yet</h3>
            <p>Click "Add Product" to create your first product book</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {/* Add Product Modal - UPDATED WITH BRANCH */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Product</h2>
            <form onSubmit={handleAddProduct}>
              {submitError && (
                <div
                  className="form-error"
                  style={{
                    marginBottom: 12,
                    color: "#b91c1c",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {submitError}
                </div>
              )}
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  placeholder="e.g., Nylon Bags, Plastic Chairs"
                  required
                />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <select
                  value={newProduct.unit}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, unit: e.target.value })
                  }
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="rolls">Rolls</option>
                  <option value="bundles">Bundles</option>
                </select>
              </div>
              <div className="form-group">
                <label>Assign to Branch</label>
                <select
                  value={newProduct.branchId}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, branchId: e.target.value })
                  }
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setSubmitError("");
                    setShowAddModal(false);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
