import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../utils/api";
import { Plus, Package, AlertTriangle, Loader2, Search, X , Trash2} from "lucide-react";
import "./RawMaterialsPage.css";

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [searchTerm, setSearchTerm] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);

  // 🛡️ Loading shield (prevents double-clicks)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline errors (replaces alert())
  const [addError, setAddError] = useState("");
  
  // Form states
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    unit: "kg",
    lowStockThreshold: 10,
    currentStock: "",
  });

  const navigate = useNavigate();
  const addFirstFieldRef = useRef(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await api.get("/raw-materials");
      setMaterials(res.data.materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  };

  // ESC closes whichever modal is open (unless mid-submit)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== "Escape" || isSubmitting) return;
      if (showAddModal) setShowAddModal(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showAddModal, isSubmitting]);

  // Autofocus first field when a modal opens
  useEffect(() => {
    if (showAddModal) setTimeout(() => addFirstFieldRef.current?.focus(), 50);
  }, [showAddModal]);

  // ⌨️ KEYBOARD SHORTCUT: Press 'N' to open Add Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tagName = document.activeElement.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return; 
      }

      if (showAddModal || isSubmitting) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        setAddError("");
        setShowAddModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, isSubmitting]);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setAddError("");
    try {
      await api.post("/raw-materials", {
        ...newMaterial,
        currentStock:
          newMaterial.currentStock === "" ? 0 : Number(newMaterial.currentStock),
      });
      setShowAddModal(false);
      setNewMaterial({ name: "", unit: "kg", lowStockThreshold: 10, currentStock: "" });
      fetchMaterials();
    } catch (error) {
      setAddError(
        error.response?.data?.message || "Failed to add material. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (materialId, materialName, e) => {
  e.stopPropagation(); // Prevent card click
  
  if (!window.confirm(`Are you sure you want to delete "${materialName}" and all its records? This cannot be undone.`)) {
    return;
  }

  try {
    await api.delete(`/raw-materials/${materialId}`);
    fetchMaterials();
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to delete material');
  }
};

  // Filtered + sorted (low-stock items float to the top)
  const visibleMaterials = useMemo(() => {
    let list = [...materials];
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }
    if (showLowStockOnly) {
      list = list.filter((m) => m.currentStock <= m.lowStockThreshold);
    }
    list.sort((a, b) => {
      const aLow = a.currentStock <= a.lowStockThreshold;
      const bLow = b.currentStock <= b.lowStockThreshold;
      if (aLow !== bLow) return aLow ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [materials, searchTerm, showLowStockOnly]);

  const lowStockCount = useMemo(
    () => materials.filter((m) => m.currentStock <= m.lowStockThreshold).length,
    [materials]
  );

  if (loading) {
    return (
      <div className="rm-loading">
        <Loader2 size={40} className="spin" />
      </div>
    );
  }

  const currentUserRole = (() => {
    try {
      return JSON.parse(localStorage.getItem("workwave_user") || "{}")?.role;
    } catch {
      return null;
    }
  })();
  const isAdmin = currentUserRole === "admin";

  return (
    <div className="rm-page">
      {/* Header */}
      <div className="rm-header">
        <div>
          <h1 className="rm-title">📦 Raw Materials</h1>
          <p className="rm-subtitle">
            Track materials coming in from outside suppliers
          </p>
        </div>
        <button
          className="rm-add-btn"
          onClick={() => {
            setAddError("");
            setShowAddModal(true);
          }}
          title="Press 'N' to add new material"
        >
          <Plus size={20} /> 
          Add Material 
          <span style={{ 
            marginLeft: '8px', 
            background: 'rgba(255,255,255,0.2)', 
            padding: '2px 6px', 
            borderRadius: '4px', 
            fontSize: '12px',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            N
          </span>
        </button>
      </div>

      {/* Low stock summary banner */}
      {lowStockCount > 0 && (
        <div className="rm-summary-banner">
          <AlertTriangle size={16} />
          <span>
            {lowStockCount} material{lowStockCount > 1 ? "s" : ""} low on stock
          </span>
          {!showLowStockOnly && (
            <button className="rm-summary-link" onClick={() => setShowLowStockOnly(true)}>
              View
            </button>
          )}
        </div>
      )}

      {/* Search + filter bar */}
      <div className="rm-toolbar">
        <div className="rm-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="rm-search-clear" onClick={() => setSearchTerm("")}>
              <X size={14} />
            </button>
          )}
        </div>
        <label className="rm-filter-toggle">
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={(e) => setShowLowStockOnly(e.target.checked)}
          />
          Low stock only
        </label>
      </div>

      {/* Materials Grid */}
      <div className="rm-grid">
        {visibleMaterials.length === 0 ? (
          <div className="rm-empty">
            <Package size={48} />
            <h3>{materials.length === 0 ? "No raw materials yet" : "No matches found"}</h3>
            <p>
              {materials.length === 0
                ? 'Click "Add Material" to start tracking your inventory.'
                : "Try a different search term or clear the filter."}
            </p>
          </div>
        ) : (
          visibleMaterials.map((mat) => {
            const isLowStock = mat.currentStock <= mat.lowStockThreshold;
            return (
              <div
                key={mat._id}
                className={`rm-card ${isLowStock ? "low-stock" : ""}`}
                onClick={() => navigate(`/raw-materials/${mat._id}`)}
                style={{ cursor: "pointer", position: "relative" }} // Added position: relative
              >
                {/* 👇 PASTE THE DELETE BUTTON HERE 👇 */}
                {isAdmin && (
                  <button
                    className="rm-delete-btn"
                    onClick={(e) => handleDeleteMaterial(mat._id, mat.name, e)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#fee2e2',
                      color: '#ef4444',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10 // Ensures button stays on top of the card
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <div className="rm-card-header">
                  <div className="rm-icon">
                    <Package size={24} />
                  </div>
                  {isLowStock && (
                    <span className="rm-warning-badge">
                      <AlertTriangle size={12} /> Low Stock
                    </span>
                  )}
                </div>

                <h3 className="rm-name">{mat.name}</h3>

                {isAdmin && mat.branchId && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#8b5cf6",
                      fontWeight: "600",
                      margin: "0 0 8px",
                    }}
                  >
                    🏢 {mat.branchId.name}
                  </p>
                )}

                <p className="rm-stock">
                  <span className="rm-stock-number">{mat.currentStock}</span>{" "}
                  {mat.unit}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => !isSubmitting && setShowAddModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Raw Material</h2>
            {addError && <div className="rm-form-error">{addError}</div>}
            <form onSubmit={handleAddMaterial}>
              <div className="form-group">
                <label>Material Name *</label>
                <input
                  ref={addFirstFieldRef}
                  type="text"
                  value={newMaterial.name}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, name: e.target.value })
                  }
                  placeholder="e.g., Nylon Rolls, Black Ink"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    value={newMaterial.unit}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, unit: e.target.value })
                    }
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="rolls">Rolls</option>
                    <option value="liters">Liters</option>
                    <option value="bags">Bags</option>
                    <option value="pcs">Pieces</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Low Stock Alert At</label>
                  <input
                    type="number"
                    value={newMaterial.lowStockThreshold}
                    onChange={(e) =>
                      setNewMaterial({
                        ...newMaterial,
                        lowStockThreshold: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Starting Stock (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newMaterial.currentStock}
                  onChange={(e) =>
                    setNewMaterial({ ...newMaterial, currentStock: e.target.value })
                  }
                  placeholder="0"
                />
                <span className="rm-hint">
                  Already have stock on hand? Enter it here instead of adding a delivery right after.
                </span>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Add Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}