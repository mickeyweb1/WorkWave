import { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { User, Lock, Building2, MapPin, Mail, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [branchName, setBranchName] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const styles = {
    page: { padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' },
    header: { marginBottom: '32px' },
    title: { fontSize: '28px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 },
    subtitle: { color: '#64748b', fontSize: '15px', marginTop: '6px' },
    
    section: { background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' },
    
    formGroup: { marginBottom: '20px' },
    label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' },
    inputWrapper: { position: 'relative' },
    input: { width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' },
    inputDisabled: { width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: '#f8fafc', color: '#64748b' },
    inputIcon: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
    inputWithIcon: { paddingLeft: '42px' },
    togglePassword: { position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 },
    
    button: { background: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },
    buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
    
    infoCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' },
    infoIcon: { padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    infoLabel: { fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' },
    infoValue: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '2px 0 0' },
    
    roleBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' },
    
    toast: { position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', borderRadius: '10px', color: 'white', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1000, animation: 'slideIn 0.3s ease' },
    
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('workwave_user') || '{}');
    setName(userData.name || '');
    setEmail(userData.email || '');
    setRole(userData.role || '');
    
    // Get branch name if user has one
    if (userData.branchId) {
      fetchBranchName(userData.branchId);
    }
  }, []);

  const fetchBranchName = async (branchId) => {
    try {
      const res = await api.get('/branches');
      const branches = res.data.branches || [];
      const branch = branches.find(b => b._id === branchId);
      if (branch) setBranchName(branch.name);
    } catch (error) {
      console.error('Error fetching branch:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setProfileSuccess('');
    setLoading(true);

    try {
      const res = await api.put('/auth/update-profile', { name });
      setProfileSuccess(res.data.message);
      
      // Update localStorage with new name
      const userData = JSON.parse(localStorage.getItem('workwave_user') || '{}');
      userData.name = name;
      localStorage.setItem('workwave_user', JSON.stringify(userData));
      
      // Dispatch event to update UI
      window.dispatchEvent(new Event('workwave-auth-changed'));
      
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setPasswordSuccess(res.data.message);
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeStyle = () => {
    const colors = {
      admin: { bg: '#fef3c7', color: '#92400e' },
      worker: { bg: '#dbeafe', color: '#1e40af' },
      factory_worker: { bg: '#f3e8ff', color: '#6b21a8' }
    };
    const style = colors[role] || colors.worker;
    return { ...styles.roleBadge, background: style.bg, color: style.color };
  };

  const getRoleLabel = () => {
    const labels = {
      admin: 'Administrator',
      worker: 'Secretary',
      factory_worker: 'Factory Worker'
    };
    return labels[role] || 'User';
  };

  return (
    <div style={styles.page}>
      {/* Toast Notifications */}
      {profileSuccess && (
        <div style={{ ...styles.toast, background: '#10b981' }}>
          <CheckCircle size={20} /> {profileSuccess}
        </div>
      )}
      {passwordSuccess && (
        <div style={{ ...styles.toast, background: '#10b981' }}>
          <CheckCircle size={20} /> {passwordSuccess}
        </div>
      )}
      {error && (
        <div style={{ ...styles.toast, background: '#ef4444' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          <User size={28} /> Account Settings
        </h1>
        <p style={styles.subtitle}>Manage your profile and security settings</p>
      </div>

      {/* Account Information (Read-only) */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <User size={20} /> Account Information
        </h2>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={styles.infoCard}>
            <div style={{ ...styles.infoIcon, background: '#dbeafe', color: '#2563eb' }}>
              <Mail size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={styles.infoLabel}>Email Address</p>
              <p style={styles.infoValue}>{email}</p>
            </div>
          </div>

          <div style={styles.infoCard}>
            <div style={{ ...styles.infoIcon, background: '#fef3c7', color: '#f59e0b' }}>
              <User size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={styles.infoLabel}>Role</p>
              <p style={styles.infoValue}>
                <span style={getRoleBadgeStyle()}>
                  {getRoleLabel()}
                </span>
              </p>
            </div>
          </div>

          {branchName && (
            <div style={styles.infoCard}>
              <div style={{ ...styles.infoIcon, background: '#f3e8ff', color: '#7c3aed' }}>
                <MapPin size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={styles.infoLabel}>Assigned Branch</p>
                <p style={styles.infoValue}>{branchName}</p>
              </div>
            </div>
          )}

          {role === 'admin' && (
            <div style={styles.infoCard}>
              <div style={{ ...styles.infoIcon, background: '#dcfce7', color: '#16a34a' }}>
                <Building2 size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={styles.infoLabel}>Company</p>
                <p style={styles.infoValue}>WorkWave Account</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Update Profile */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <User size={20} /> Update Profile
        </h2>

        <form onSubmit={handleUpdateProfile}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                style={{ ...styles.input, ...styles.inputWithIcon }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
            Update Profile
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <Lock size={20} /> Change Password
        </h2>

        <form onSubmit={handleChangePassword}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Current Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                style={{ ...styles.input, ...styles.inputWithIcon, paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.togglePassword}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>New Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength="6"
                  style={{ ...styles.input, ...styles.inputWithIcon, paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={styles.togglePassword}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm New Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  style={{ ...styles.input, ...styles.inputWithIcon }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Lock size={16} />}
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}