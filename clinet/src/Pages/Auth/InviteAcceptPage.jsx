import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api'; // Adjust path if needed
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function InviteAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token'); // Grabs the token from the URL!

  const [loading, setLoading] = useState(true);
  const [workerName, setWorkerName] = useState('');
  const [error, setError] = useState('');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Check if the invite link is valid when the page loads
  useEffect(() => {
    if (!token) {
      setError("No invite token found in URL.");
      setLoading(false);
      return;
    }

    const checkInvite = async () => {
      try {
        const res = await api.get(`/auth/invite/${token}`);
        setWorkerName(res.data.user.name);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "This invite link is invalid or expired.");
        setLoading(false);
      }
    };

    checkInvite();
  }, [token]);

  // 2. Handle Password Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/auth/invite/${token}`, { newPassword: password });
 
      const { user, token: authToken } = res.data;
      
// Save to localStorage
localStorage.setItem('workwave_token', authToken);
localStorage.setItem('workwave_user', JSON.stringify(user));
localStorage.setItem('workwave_user_role', user.role);
window.dispatchEvent(new Event('workwave-auth-changed')); // Tell App.jsx to update

// 🧠 SMART REDIRECT BASED ON ROLE
if (user.role === 'admin') {
  navigate('/adminDashboard', { replace: true });
} else if (user.role === 'factory_worker') {
  navigate('/factory-worker', { replace: true }); // 👈 Factory Floor!
} else {
  // 'worker' (Secretary/Supervisor)
  navigate('/workerDashboard', { replace: true }); // 👈 Secretary Dashboard!
}
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set password.");
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>Verifying invite link...</div>;

  return (
    <div style={{ 
      minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '20px' 
    }}>
      <div style={{ 
        backgroundColor: 'white', padding: '40px', borderRadius: '16px', 
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '450px',
        border: '1px solid #e2e8f0'
      }}>
        
        {error ? (
          <div style={{ textAlign: 'center' }}>
            <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ color: '#991b1b', marginBottom: '8px' }}>Invalid Invite</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>{error}</p>
            <button onClick={() => navigate('/')} style={{ color: '#2563eb', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>
              Go to Login Page
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ backgroundColor: '#dcfce7', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={32} color="#166534" />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Welcome, {workerName}!</h1>
              <p style={{ color: '#64748b', marginTop: '8px' }}>Please set your secure password to activate your WorkWave account.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>New Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength="6"
                  placeholder="At least 6 characters"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="Type it again"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>
                <button 
                type="submit" 
                disabled={submitting || !password || !confirmPassword} // <-- Added this check!
                style={{ 
                  backgroundColor: (submitting || !password || !confirmPassword) ? '#94a3b8' : '#2563eb', // <-- Greyed out if disabled
                  color: 'white', padding: '14px', borderRadius: '8px', 
                  border: 'none', cursor: (submitting || !password || !confirmPassword) ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold', fontSize: '16px',
                  marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%'
                }}
              >
                {submitting ? 'Activating...' : 'Activate Account & Login'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}