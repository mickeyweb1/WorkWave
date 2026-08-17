import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Phone } from 'lucide-react';

export default function TrialExpired() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '48px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: '#fee2e2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Lock size={40} color="#ef4444" />
        </div>
        
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px' }}>
          Trial Expired
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '24px' }}>
          Your 21-day free trial has ended. To continue using WorkWave and keep your data safe, please upgrade to a paid plan.
        </p>

        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#334155', margin: '0 0 12px' }}>
            💰 Pricing Plans
          </h3>
          <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.8' }}>
            <p>• <strong>Starter:</strong> ₦15,000/month (1 branch)</p>
            <p>• <strong>Business:</strong> ₦30,000/month (3 branches)</p>
            <p>• <strong>Enterprise:</strong> ₦50,000/month (Unlimited branches)</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => window.location.href = 'mailto:support@workwave.com'}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '14px 24px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Mail size={18} />
            Contact Us to Upgrade
          </button>
          
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#f1f5f9',
              color: '#334155',
              border: 'none',
              padding: '14px 24px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}