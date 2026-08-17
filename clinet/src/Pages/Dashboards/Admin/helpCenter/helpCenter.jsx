import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Package, Users, ClipboardList, TrendingUp, 
  ArrowRight, CheckCircle, PlayCircle, FileText, Phone,
  ChevronDown, ChevronUp, Wifi, WifiOff, AlertCircle, LifeBuoy
} from 'lucide-react';

export default function HelpCenter() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [systemStatus, setSystemStatus] = useState('checking'); // 'checking', 'online', 'offline'

  // 1. SYSTEM STATUS CHECK (Frontend Only - No Backend Changes Needed)
  useEffect(() => {
    const checkStatus = async () => {
      if (!navigator.onLine) {
        setSystemStatus('offline');
        return;
      }
      try {
        // Lightweight ping to check if the server is reachable
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        await fetch(window.location.origin, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        setSystemStatus('online');
      } catch (error) {
        setSystemStatus('offline');
      }
    };

    checkStatus();
    
    // Re-check if internet connection changes
    const handleOnline = () => setSystemStatus('online');
    const handleOffline = () => setSystemStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const steps = [
    {
      number: 1,
      icon: <Building2 size={24} />,
      title: 'Create Your First Branch',
      description: 'Add your business locations (shops, warehouses, factories)',
      color: '#3b82f6',
      action: () => navigate('/adminBranches'),
      buttonText: 'Create Branch'
    },
    {
      number: 2,
      icon: <Package size={24} />,
      title: 'Add Products',
      description: 'Create your product catalog with names and units',
      color: '#10b981',
      action: () => navigate('/products'),
      buttonText: 'Add Product'
    },
    {
      number: 3,
      icon: <ArrowRight size={24} />,
      title: 'Assign Products to Branches',
      description: 'Set selling prices and initial stock for each branch',
      color: '#f59e0b',
      action: () => navigate('/products'),
      buttonText: 'Assign Products'
    },
    {
      number: 4,
      icon: <Users size={24} />,
      title: 'Invite Workers',
      description: 'Add secretaries and factory workers to your team',
      color: '#8b5cf6',
      action: () => navigate('/manageWorkers'),
      buttonText: 'Invite Workers'
    },
    {
      number: 5,
      icon: <ClipboardList size={24} />,
      title: 'Record Production',
      description: 'Factory workers log daily production output',
      color: '#ec4899',
      action: () => navigate('/production-approval'),
      buttonText: 'View Production'
    },
    {
      number: 6,
      icon: <TrendingUp size={24} />,
      title: 'Track Sales & Expenses',
      description: 'Record transactions and monitor cash flow',
      color: '#06b6d4',
      action: () => navigate('/sales'),
      buttonText: 'Record Sale'
    }
  ];

  const troubleshooting = [
    {
      issue: 'Worker says "Invalid Credentials"',
      fix: 'Check for extra spaces in the email. If it persists, go to Manage Workers and use the "Reset Password" feature.'
    },
    {
      issue: 'Daily Report shows zero sales',
      fix: 'Ensure the worker selected the correct date, and verify that the products sold are actually assigned to their specific branch.'
    },
    {
      issue: 'Stock is not decreasing after a sale',
      fix: 'Double-check that the product has sufficient stock in that specific branch. Sales cannot be recorded if branch stock is zero.'
    }
  ];

  const faqs = [
    {
      q: 'Can I edit or delete a recorded sale?',
      a: 'For security and audit purposes, completed sales cannot be deleted. If a mistake was made, please record a "Refund" or "Correction" in the Expenses page to balance your books.'
    },
    {
      q: 'How do I add a custom expense category?',
      a: 'When recording an expense, select "Other (Type below)" from the category dropdown. A text box will appear where you can type your custom category (e.g., "Fuel", "Internet").'
    },
    {
      q: 'What happens if I delete a product?',
      a: 'Deleting a product removes it from your active catalog. However, all historical sales and production records linked to that product will be safely preserved for your reports.'
    },
    {
      q: 'Can a worker see data from other branches?',
      a: 'No. WorkWave is designed with strict role-based access. Workers can only see and interact with data, products, and sales specifically assigned to their own branch.'
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
          🚀 Getting Started Guide
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
          Follow these 6 steps to set up your WorkWave account
        </p>
      </div>

      {/* 🆕 SYSTEM STATUS INDICATOR (Frontend Only) */}
      <div style={{
        background: systemStatus === 'online' ? '#f0fdf4' : systemStatus === 'offline' ? '#fef2f2' : '#f8fafc',
        border: `1px solid ${systemStatus === 'online' ? '#bbf7d0' : systemStatus === 'offline' ? '#fecaca' : '#e2e8f0'}`,
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {systemStatus === 'online' ? (
          <Wifi size={20} color="#16a34a" />
        ) : systemStatus === 'offline' ? (
          <WifiOff size={20} color="#dc2626" />
        ) : (
          <div style={{ width: '20px', height: '20px', border: '2px solid #cbd5e1', borderTop: '2px solid #0f172a', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        )}
        <div>
          <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
            System Status: {systemStatus === 'online' ? 'All Systems Operational' : systemStatus === 'offline' ? 'Connection Issue Detected' : 'Checking connection...'}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            {systemStatus === 'online' ? 'Your dashboard is connected and syncing in real-time.' : 'Please check your internet connection or try refreshing the page.'}
          </p>
        </div>
      </div>

      {/* 6-STEP PROGRESS CHAIN */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid #e2e8f0',
        marginBottom: '32px'
      }}>
        {steps.map((step, index) => (
          <div key={step.number}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: step.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '800',
                fontSize: '20px',
                flexShrink: 0
              }}>
                {step.number}
              </div>

              <div style={{ flex: 1, paddingBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ color: step.color }}>{step.icon}</div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                    {step.title}
                  </h3>
                </div>
                <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>
                  {step.description}
                </p>
                <button
                  onClick={step.action}
                  style={{
                    background: step.color,
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <PlayCircle size={16} />
                  {step.buttonText}
                </button>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div style={{
                marginLeft: '24px',
                width: '2px',
                height: '24px',
                background: '#e2e8f0',
                marginBottom: '0'
              }} />
            )}
          </div>
        ))}
      </div>

      {/* 🆕 TROUBLESHOOTING SECTION */}
      <div style={{
        background: '#fff7ed',
        border: '1px solid #fed7aa',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#9a3412', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} /> Common Troubleshooting
        </h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          {troubleshooting.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <div style={{ background: '#ffedd5', padding: '6px', borderRadius: '6px', flexShrink: 0, marginTop: '2px' }}>
                <LifeBuoy size={16} color="#ea580c" />
              </div>
              <div>
                <p style={{ margin: '0 0 4px', color: '#9a3412', fontSize: '14px', fontWeight: '700' }}>{item.issue}</p>
                <p style={{ margin: 0, color: '#7c2d12', fontSize: '14px', lineHeight: '1.5' }}><strong>Fix:</strong> {item.fix}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🆕 FAQ ACCORDION */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} /> Frequently Asked Questions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {faqs.map((faq, index) => (
            <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <button
                onClick={() => toggleFaq(index)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: openFaq === index ? '#f8fafc' : 'white',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#0f172a'
                }}
              >
                {faq.q}
                {openFaq === index ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
              </button>
              {openFaq === index && (
                <div style={{ padding: '0 16px 16px', color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* QUICK TIPS */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #dbeafe',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e40af', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} /> Quick Tips
        </h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
            <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, color: '#1e40af', fontSize: '14px', lineHeight: '1.6' }}>
              <strong>Invite workers early</strong> — They can start recording sales and production while you set up other features
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
            <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, color: '#1e40af', fontSize: '14px', lineHeight: '1.6' }}>
              <strong>Assign products to branches</strong> — Workers can only sell products assigned to their branch
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
            <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, color: '#1e40af', fontSize: '14px', lineHeight: '1.6' }}>
              <strong>Check the Daily Report</strong> — See a complete summary of sales, expenses, and profit
            </p>
          </div>
        </div>
      </div>

      {/* CONTACT SUPPORT */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px' }}>
          Need Help? Contact Support
        </h3>
        <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 20px' }}>
          We are here to help you get the most out of WorkWave.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <a 
            href="https://wa.me/2347062640714" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              background: '#25d366',
              color: 'white',
              textDecoration: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Phone size={18} /> WhatsApp Support
          </a>
          <a 
            href="tel:07062640714" 
            style={{
              background: '#f1f5f9',
              color: '#0f172a',
              textDecoration: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Phone size={18} /> Call Us
          </a>
        </div>
      </div>

      {/* CSS Animation for the loading spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}