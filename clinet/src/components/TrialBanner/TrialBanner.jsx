import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function TrialBanner() {
  const [trialInfo, setTrialInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchTrialStatus();
  }, []);

  const fetchTrialStatus = async () => {
    try {
      const res = await api.get('/auth/trial-status');
      setTrialInfo(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Trial status error:', error);
      setLoading(false);
    }
  };

  if (loading || !trialInfo || dismissed) return null;

  const { daysRemaining, trialStatus } = trialInfo;

  // Don't show banner if trial is expired (handle separately)
  if (trialStatus === 'expired') return null;

  // Determine banner style based on days remaining
  const getBannerStyle = () => {
    if (daysRemaining <= 3) {
      return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: <XCircle size={18} /> };
    } else if (daysRemaining <= 7) {
      return { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', icon: <AlertTriangle size={18} /> };
    } else {
      return { bg: '#ecfdf5', border: '#10b981', text: '#065f46', icon: <Clock size={18} /> };
    }
  };

  const style = getBannerStyle();

  // Show reminder every 2 days
  const shouldShowReminder = daysRemaining % 2 === 0 || daysRemaining <= 3;

  if (!shouldShowReminder) return null;

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: style.text }}>
        {style.icon}
        <div>
          <strong style={{ fontSize: '15px' }}>
            {daysRemaining <= 3 
              ? `⚠️ Trial ending in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}!` 
              : `🕒 ${daysRemaining} days left in your free trial`
            }
          </strong>
          <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8 }}>
            {daysRemaining <= 7 
              ? 'Contact us to upgrade before your trial expires.' 
              : 'Enjoy WorkWave! Upgrade anytime to keep your data safe.'
            }
          </p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'transparent',
          border: 'none',
          color: style.text,
          cursor: 'pointer',
          fontSize: '18px',
          opacity: 0.6,
          fontWeight: 'bold'
        }}
      >
        ×
      </button>
    </div>
  );
}