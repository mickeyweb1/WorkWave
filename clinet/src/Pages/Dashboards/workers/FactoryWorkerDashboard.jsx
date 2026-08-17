import { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { Package, ClipboardList, Plus, Loader2, Clock, CheckCircle, Sun, Moon } from 'lucide-react';
import './FactoryWorkerDashboard.css';

export default function FactoryWorkerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [myRecords, setMyRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [formData, setFormData] = useState({
    productId: '',
    kg: '',
    size: '',
    thickness: '',
    shift: 'morning',
    taskId: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, recordsRes, productsRes] = await Promise.all([
        api.get('/production-tasks/pending'),
        api.get('/product-records/my-shifts'),
        api.get('/products')
      ]);
      setTasks(tasksRes.data.tasks);
      setMyRecords(recordsRes.data);
      setProducts(productsRes.data.products || productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModalFromTask = (task) => {
    setSelectedTask(task);
    setFormData({
      productId: task.productId._id,
      kg: '',
      size: '',
      thickness: '',
      shift: task.shift,
      taskId: task._id
    });
    setShowModal(true);
  };

  const openModalManual = () => {
    setSelectedTask(null);
    setFormData({
      productId: '',
      kg: '',
      size: '',
      thickness: '',
      shift: 'morning',
      taskId: null
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post('/product-records/production', formData);
      setShowModal(false);
      setFormData({ productId: '', kg: '', size: '', thickness: '', shift: 'morning', taskId: null });
      setSelectedTask(null);
      fetchData();
    } catch (error) {
      console.error('Error saving production:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="fw-loading"><Loader2 size={40} className="spin" /></div>;
  }

  const workerName = JSON.parse(localStorage.getItem('workwave_user'))?.name || 'Worker';

  return (
    <div className="fw-dashboard">
      {/* Header */}
      <div className="fw-header">
        <h1>👋 Hello, {workerName}</h1>
        <p>Record your daily production below.</p>
      </div>

      {/* Big Action Button */}
      <button className="fw-big-btn" onClick={openModalManual}>
        <Plus size={28} />
        Record New Production
      </button>

      {/* Pending Tasks Section */}
      <div className="fw-section">
        <h2 className="fw-section-title">
          <ClipboardList size={20} />
          Tasks To Complete ({tasks.length})
        </h2>
        <div className="fw-tasks-list">
          {tasks.length === 0 ? (
            <p className="fw-empty">No pending tasks. Check back later!</p>
          ) : (
            tasks.map((task) => (
              <div key={task._id} className="fw-task-card">
                <div className="fw-task-info">
                  <h3>{task.productId?.name || 'Unknown Product'}</h3>
                  <p>
                    Target: <strong>{task.targetKg} kg</strong>
                    {' • '}
                    {task.shift === 'morning' ? '☀️ Morning' : '🌙 Night'}
                  </p>
                  {task.notes && <p className="fw-task-notes">📝 {task.notes}</p>}
                </div>
                <button className="fw-task-btn" onClick={() => openModalFromTask(task)}>
                  Start
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* My Submissions Section */}
      <div className="fw-section">
        <h2 className="fw-section-title">
          <Package size={20} />
          My Recent Submissions
        </h2>
        <div className="fw-submissions-list">
          {myRecords.length === 0 ? (
            <p className="fw-empty">No production recorded yet.</p>
          ) : (
            myRecords.map((record) => (
              <div key={record._id} className="fw-submission-card">
                <div className="fw-sub-icon">
                  <Package size={20} />
                </div>
                <div className="fw-sub-info">
                  <h3>{record.productId?.name || 'Unknown'}</h3>
                  <p>{record.kg} kg • {record.size || 'N/A'} • {record.thickness || 'N/A'}</p>
                </div>
                <div className="fw-sub-status">
                  {record.status === 'pending' ? (
                    <span className="fw-status pending">
                      <Clock size={14} /> Waiting
                    </span>
                  ) : (
                    <span className="fw-status approved">
                      <CheckCircle size={14} /> Approved
                    </span>
                  )}
                  <small>{new Date(record.dateIn).toLocaleDateString()}</small>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Production Modal */}
      {showModal && (
        <div className="fw-modal-overlay" onClick={() => !isSubmitting && setShowModal(false)}>
          <div className="fw-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🏭 Record Production</h2>

            {selectedTask && (
              <div className="fw-task-context">
                📋 Task: {selectedTask.productId?.name} — Target: {selectedTask.targetKg} kg
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {!selectedTask && (
                <div className="fw-form-group">
                  <label>Product *</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    required
                  >
                    <option value="">Select a product...</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="fw-form-group">
                <label>Weight Produced (KG) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.kg}
                  onChange={(e) => setFormData({ ...formData, kg: e.target.value })}
                  placeholder="e.g., 30.5"
                  required
                />
              </div>

              <div className="fw-form-row">
                <div className="fw-form-group">
                  <label>Size</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g., Large"
                  />
                </div>
                <div className="fw-form-group">
                  <label>Thickness</label>
                  <input
                    type="text"
                    value={formData.thickness}
                    onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                    placeholder="e.g., 2mm"
                  />
                </div>
              </div>

              <div className="fw-form-group">
                <label>Shift</label>
                <div className="fw-shift-selector">
                  <button type="button" className={`fw-shift-option ${formData.shift === 'morning' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, shift: 'morning' })}>
                    <Sun size={18} /> Morning
                  </button>
                  <button type="button" className={`fw-shift-option ${formData.shift === 'night' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, shift: 'night' })}>
                    <Moon size={18} /> Night
                  </button>
                </div>
              </div>

              <div className="fw-modal-actions">
                <button type="button" className="fw-btn-cancel" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="fw-btn-save" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Submit Production'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}