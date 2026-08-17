import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { Building2, Plus, MapPin, AlertCircle, Trash2 } from 'lucide-react';

export function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    location: ''
  });

  // 1. Fetch Branches when the page loads
  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data.branches);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching branches:", err);
      setLoading(false);
    }
  };

  // 2. Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Handle Form Submission (Create Branch)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/branches', formData);
      
      // Clear the form and hide it
      setFormData({ name: '', location: '' });
      setShowForm(false);
      
      // Refresh the branch list
      fetchBranches();
      alert('Branch added successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add branch');
    }
  };

  // 4. Handle Delete Branch
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this branch? This cannot be undone.")) {
      try {
        await api.delete(`/branches/${id}`);
        fetchBranches(); // Refresh list
        alert('Branch deleted!');
      } catch (err) {
        alert('Failed to delete branch.');
      }
    }
  };

  if (loading) return <div style={{padding: '20px'}}>Loading branches...</div>;

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={28} /> Branch Management
          </h1>
          <p style={{ color: '#666' }}>Create and manage your business locations.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: '#2563eb', color: 'white', padding: '10px 20px',
            borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Plus size={20} /> {showForm ? 'Cancel' : 'Add New Branch'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Add Branch Form */}
      {showForm && (
        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ marginBottom: '16px' }}>Create New Branch</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            <div>
              <label>Branch Name *</label>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                placeholder="e.g. Lekki Phase 1, Ikeja Branch" 
                style={inputStyle} 
              />
            </div>

            <div>
              <label>Location / Address *</label>
              <input 
                name="location" 
                value={formData.location} 
                onChange={handleChange} 
                required 
                placeholder="e.g. 12 Admiralty Way, Lekki" 
                style={inputStyle} 
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" style={{ backgroundColor: '#16a34a', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Save Branch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Branches List */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f1f5f9' }}>
            <tr>
              <th style={thStyle}>Branch Name</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No branches yet. Click "Add New Branch" to create your first location!</td></tr>
            ) : (
              branches.map(branch => (
                   <tr 
     key={branch._id} 
     style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }}
     onClick={() => navigate(`/adminBranches/${branch._id}`)}
   >
      <td style={tdStyle}>
     <strong>{branch.name}</strong>
   </td>
                  <td style={tdStyle}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={16} color="#64748b" /> {branch.location}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ 
                      backgroundColor: branch.status === 'open' ? '#dcfce7' : '#fee2e2',
                      color: branch.status === 'open' ? '#166534' : '#991b1b',
                      padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px'
                    }}>
                      {branch.status ? branch.status.toUpperCase() : 'OPEN'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button 
                      onClick={() => handleDelete(branch._id)}
                      style={{ backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
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

// Simple inline styles
const inputStyle = {
  width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '14px'
};
const thStyle = {
  padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#475569'
};
const tdStyle = {
  padding: '16px', fontSize: '14px', color: '#334155'
};