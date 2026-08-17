import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../utils/api';
import { Users, Plus, AlertCircle, CheckCircle, XCircle, LinkIcon } from 'lucide-react';

export function ManageWorkersPage() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', branchId: '', role: 'worker'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const workerRes = await api.get('/workers');
      setWorkers(workerRes.data.workers);

      const branchRes = await api.get('/branches');
      setBranches(branchRes.data.branches);
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/workers', formData);
      setSuccess("Worker added! Go to 'Worker Links' to send their invite.");
      setFormData({ name: '', email: '', phone: '', branchId: '', role: 'worker' });
      setShowForm(false);
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add worker');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.put(`/workers/${id}/status`);
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div style={{padding: '20px'}}>Loading team...</div>;

  const currentUserRole = JSON.parse(localStorage.getItem('workwave_user'))?.role;
  const isAdmin = currentUserRole === 'admin';

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} /> Team Management
          </h1>
          <p style={{ color: '#666' }}>Add workers, assign branches, and manage access.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => navigate('/workerLinks')}
            style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <LinkIcon size={18} /> Manage Invite Links
          </button>
          <button 
            onClick={() => setShowForm(!showForm)}
            style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={20} /> {showForm ? 'Cancel' : 'Add Worker'}
          </button>
        </div>
      </div>

      {error && <div style={msgStyle('#fee2e2', '#991b1b')}><AlertCircle size={18}/> {error}</div>}
      {success && <div style={msgStyle('#dcfce7', '#166534')}><CheckCircle size={18}/> {success}</div>}

      {/* Add Worker Form */}
      {/* Add Worker Form */}
      {showForm && (
        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>Add New Team Member</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email Address *</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} />
            </div>
            
            {/* Conditionally render Branch Selector for Admins only */}
            {isAdmin && (
              <div>
                <label style={labelStyle}>Assign to Branch *</label>
                <select name="branchId" value={formData.branchId} onChange={handleChange} required={isAdmin} style={inputStyle}>
                  <option value="">-- Select Branch --</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
            )}

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" style={{ backgroundColor: '#16a34a', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Save Worker
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workers Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <table style={{ minWidth: '800px', width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f1f5f9' }}>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Branch</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {workers.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No workers added yet.</td></tr>
            ) : (
              workers.map(worker => (
                <tr key={worker._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={tdStyle}><strong>{worker.name}</strong></td>
                  <td style={tdStyle}>{worker.email}</td>
                  <td style={tdStyle}>{worker.phone || '-'}</td>
                  <td style={tdStyle}>{worker.branchId ? worker.branchId.name : <span style={{color:'#dc2626'}}>Unassigned</span>}</td>
                  <td style={tdStyle}>
                    <span style={{
                      backgroundColor: worker.role === 'admin' ? '#dbeafe' : '#f3e8ff',
                      color: worker.role === 'admin' ? '#1e40af' : '#6b21a8',
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize'
                    }}>
                      {worker.role}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button 
                      onClick={() => handleToggleStatus(worker._id)}
                      style={{
                        backgroundColor: worker.status === 'active' ? '#dcfce7' : '#fee2e2',
                        color: worker.status === 'active' ? '#166534' : '#991b1b',
                        padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      {worker.status === 'active' ? <><CheckCircle size={14}/> Active</> : <><XCircle size={14}/> Inactive</>}
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

const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '14px', boxSizing: 'border-box' };
const labelStyle = { fontSize: '14px', fontWeight: '600', color: '#334155' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#475569' };
const tdStyle = { padding: '16px', fontSize: '14px', color: '#334155' };
const msgStyle = (bg, color) => ({ backgroundColor: bg, color, padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' });