import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../utils/api';
import { LinkIcon, Copy, Send, ExternalLink, ArrowLeft, CheckCircle, Users } from 'lucide-react';

export function WorkerLinksPage() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null); // Tracks which link was just copied

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/workers');
      setWorkers(res.data.workers);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching workers:", err);
      setLoading(false);
    }
  };

  // Generate the full invite URL for a worker
  const getInviteLink = (token) => {
    return `${window.location.origin}/invite?token=${token}`;
  };

  // 1. Copy Link to Clipboard
  const handleCopy = async (worker) => {
    const link = getInviteLink(worker.inviteToken);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(worker._id);
      setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(worker._id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // 2. Open Gmail with pre-filled message
  const handleSendGmail = (worker) => {
    const link = getInviteLink(worker.inviteToken);
    const subject = encodeURIComponent("Your WorkWave Invite Link");
    const body = encodeURIComponent(
      `Hi ${worker.name},\n\n` +
      `Welcome to the team! You have been added to WorkWave.\n\n` +
      `Click the link below to set up your account:\n` +
      `${link}\n\n` +
      `Your assigned branch: ${worker.branchId ? worker.branchId.name : 'Not assigned yet'}\n\n` +
      `Please keep this link private.\n\n` +
      `Best regards,\nWorkWave Admin`
    );
    // Opens Gmail in a new tab with everything pre-filled!
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${worker.email}&su=${subject}&body=${body}`, '_blank');
  };

  // 3. Open the link in a new tab (for testing)
  const handleOpenLink = (worker) => {
    const link = getInviteLink(worker.inviteToken);
    window.open(link, '_blank');
  };

  if (loading) return <div style={{padding: '20px'}}>Loading worker links...</div>;

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      
      {/* Back Button & Header */}
      <button 
        onClick={() => navigate('/manageWorkers')}
        style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', marginBottom: '16px', fontSize: '14px' }}
      >
        <ArrowLeft size={18} /> Back to Team Management
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LinkIcon size={28} color="#8b5cf6" /> Worker Invite Links
        </h1>
        <p style={{ color: '#666' }}>Generate and send secure login links to your team members.</p>
      </div>

      {/* Info Banner */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Users size={20} color="#2563eb" />
        <p style={{ color: '#1e40af', fontSize: '14px', margin: 0 }}>
          <strong>How it works:</strong> Each worker has a unique, secure invite link. Click <strong>Send</strong> to open Gmail with a pre-written message, or <strong>Copy</strong> to paste it into WhatsApp or SMS.
        </p>
      </div>

      {/* Workers List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {workers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No workers found. Go back to Team Management to add workers first.
          </div>
        ) : (
          workers.map(worker => {
            const link = getInviteLink(worker.inviteToken);
            const isCopied = copiedId === worker._id;

            return (
              <div 
                key={worker._id} 
                style={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  padding: '20px',
                  opacity: worker.status === 'inactive' ? 0.5 : 1
                }}
              >
                {/* Worker Info Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                      {worker.name} 
                      {worker.status === 'inactive' && <span style={{ color: '#dc2626', fontSize: '12px', marginLeft: '8px' }}>(Inactive)</span>}
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                      {worker.email} • {worker.branchId ? worker.branchId.name : 'No Branch'} • {worker.role}
                    </p>
                  </div>
                </div>

                {/* Link Display */}
                <div style={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '10px 14px', 
                  marginBottom: '12px',
                  fontSize: '12px', 
                  color: '#64748b',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace'
                }}>
                  {worker.inviteToken ? link : 'No invite token generated'}
                </div>

                {/* The 3 Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  
                  {/* Button 1: Copy Link */}
                  <button 
                    onClick={() => handleCopy(worker)}
                    disabled={!worker.inviteToken}
                    style={{
                      backgroundColor: isCopied ? '#16a34a' : '#f1f5f9',
                      color: isCopied ? 'white' : '#334155',
                      padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                      cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isCopied ? <><CheckCircle size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
                  </button>

                  {/* Button 2: Send (Opens Gmail) */}
                  <button 
                    onClick={() => handleSendGmail(worker)}
                    disabled={!worker.inviteToken}
                    style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      padding: '8px 16px', borderRadius: '8px', border: 'none',
                      cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Send size={16} /> Send
                  </button>

                  {/* Button 3: Gmail (Direct Gmail shortcut) */}
                                    {/* DELETE THIS ENTIRE BLOCK */}
                  <button 
                    onClick={() => handleSendGmail(worker)}
                    disabled={!worker.inviteToken}
                    style={{
                      backgroundColor: '#ea4335',
                      color: 'white',
                      padding: '8px 16px', borderRadius: '8px', border: 'none',
                      cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Send size={16} /> Gmail
                  </button>

                  {/* Button 4: Open (For testing) */}
                  <button 
                    onClick={() => handleOpenLink(worker)}
                    disabled={!worker.inviteToken}
                    style={{
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                      cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <ExternalLink size={16} /> Open
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

