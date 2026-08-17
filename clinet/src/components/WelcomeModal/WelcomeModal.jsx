import { X, Rocket, CheckCircle, Banknote, Phone } from 'lucide-react';
import api from '../../utils/api';
import './WelcomeModal.css';

export default function WelcomeModal({ onClose }) {
  const handleGetStarted = async () => {
    try {
      await api.put('/auth/mark-welcome-seen');
      onClose();
    } catch (error) {
      console.error('Error marking welcome:', error);
      onClose();
    }
  };

  return (
    <div className="wm-overlay">
      <div className="wm-container">
        <button className="wm-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="wm-header">
          <div className="wm-icon-box">
            <Rocket size={40} color="white" />
          </div>
          <h1 className="wm-title">Welcome to WorkWave! 🎉</h1>
          <p className="wm-subtitle">Your 21-day free trial has started</p>
        </div>

        <div className="wm-body">
          {/* Pricing Plans */}
          <div className="wm-pricing-box">
            <h3 className="wm-pricing-title">💰 Pricing Plans (After Trial)</h3>
            
            <div className="wm-plan">
              <div className="wm-plan-info">
                <h4>Starter Plan</h4>
                <p>1 Branch • Perfect for small businesses</p>
              </div>
              <div className="wm-price">₦5,000<span>/mo</span></div>
            </div>

            <div className="wm-plan popular">
              <span className="wm-popular-badge">POPULAR</span>
              <div className="wm-plan-info">
                <h4>Business Plan</h4>
                <p>3 Branches • For growing companies</p>
              </div>
              <div className="wm-price">₦10,000<span>/mo</span></div>
            </div>

            <div className="wm-plan">
              <div className="wm-plan-info">
                <h4>Enterprise Plan</h4>
                <p>Unlimited Branches • For large operations</p>
              </div>
              <div className="wm-price">₦20,000<span>/mo</span></div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="wm-payment-box">
            <h4 className="wm-payment-title">
              <Banknote size={18} /> How to Pay (Manual Bank Transfer)
            </h4>
            <div className="wm-payment-detail">
              <strong>Account Name:</strong> Mickeyweb
            </div>
            <div className="wm-payment-detail">
              <strong>Palmpay:</strong> 07062640714
            </div>
            <div className="wm-payment-detail">
              <Phone size={14} /> <strong>WhatsApp/Call:</strong> 07062640714
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
              After payment, send your receipt and registered email to our WhatsApp to activate your account.
            </p>
          </div>

          {/* Features */}
          <div className="wm-features">
            <div className="wm-feature"><CheckCircle size={16} color="#10b981" /> Multi-branch management</div>
            <div className="wm-feature"><CheckCircle size={16} color="#10b981" /> Real-time inventory</div>
            <div className="wm-feature"><CheckCircle size={16} color="#10b981" /> Sales tracking</div>
            <div className="wm-feature"><CheckCircle size={16} color="#10b981" /> Worker management</div>
          </div>

          {/* Call to Action */}
          <button className="wm-cta-btn" onClick={handleGetStarted}>
            <Rocket size={20} />
            Start My Free Trial
          </button>
        </div>
      </div>
    </div>
  );
}