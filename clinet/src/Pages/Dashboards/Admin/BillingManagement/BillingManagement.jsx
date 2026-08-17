import { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { Search, Filter, Users, Building2, Crown, Lock, Unlock, Loader2, AlertCircle } from 'lucide-react';

export default function BillingManagement() {
  const [companies, setCompanies] = useState([]);
  const [planConfigs, setPlanConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  const styles = {
    page: { padding: '24px', maxWidth: '1400px', margin: '0 auto' },
    header: { marginBottom: '32px' },
    title: { fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '12px' },
    subtitle: { color: '#64748b', fontSize: '16px', margin: 0 },
    
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
    statCard: { background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' },
    statLabel: { fontSize: '13px', color: '#64748b', margin: '0 0 4px' },
    statValue: { fontSize: '28px', fontWeight: '800', margin: 0 },
    
    controls: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
    searchBox: { flex: 1, minWidth: '250px', position: 'relative' },
    searchInput: { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' },
    searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
    filterBtn: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
    filterBtnActive: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #2563eb', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
    
    table: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
    tableHeader: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 2fr', padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
    tableRow: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 2fr', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
    
    badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-block' },
    actionBtn: { padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginRight: '6px' },
    select: { padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', marginRight: '8px' }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/super-admin/companies');
      setCompanies(res.data.companies);
      setPlanConfigs(res.data.planConfigs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setLoading(false);
    }
  };

  const handlePlanChange = async (companyId, newPlan) => {
    setUpdating(companyId);
    try {
      await api.put(`/super-admin/companies/${companyId}/plan`, {
        plan: newPlan,
        extendDays: newPlan === 'free_trial' ? 21 : 30
      });
      fetchCompanies();
    } catch (error) {
      alert('Failed to update plan');
    } finally {
      setUpdating(null);
    }
  };

  const handleExtendTrial = async (companyId) => {
    setUpdating(companyId);
    try {
      await api.put(`/super-admin/companies/${companyId}/plan`, {
        plan: 'free_trial',
        extendDays: 21
      });
      fetchCompanies();
    } catch (error) {
      alert('Failed to extend trial');
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleStatus = async (companyId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'unblock' : 'block'} this company?`)) return;

    setUpdating(companyId);
    try {
      await api.put(`/super-admin/companies/${companyId}/status`, { status: newStatus });
      fetchCompanies();
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const getPlanBadgeStyle = (plan) => {
    const colors = {
      free_trial: { bg: '#fef3c7', color: '#92400e' },
      starter: { bg: '#dbeafe', color: '#1e40af' },
      business: { bg: '#dcfce7', color: '#166534' },
      enterprise: { bg: '#f3e8ff', color: '#6b21a8' }
    };
    const style = colors[plan] || colors.free_trial;
    return { ...styles.badge, background: style.bg, color: style.color };
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'trial') return matchesSearch && company.plan === 'free_trial';
    if (filter === 'expiring') return matchesSearch && company.daysRemaining !== null && company.daysRemaining <= 7 && company.daysRemaining > 0;
    if (filter === 'expired') return matchesSearch && company.daysRemaining !== null && company.daysRemaining <= 0;
    if (filter === 'paid') return matchesSearch && company.plan !== 'free_trial';
    
    return matchesSearch;
  });

  const stats = {
    total: companies.length,
    trial: companies.filter(c => c.plan === 'free_trial').length,
    paid: companies.filter(c => c.plan !== 'free_trial').length,
    expiring: companies.filter(c => c.daysRemaining !== null && c.daysRemaining <= 7 && c.daysRemaining > 0).length
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <Loader2 size={40} className="spin" />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <Crown size={28} color="#f59e0b" />
          Billing Management
        </h1>
        <p style={styles.subtitle}>Manage all WorkWave subscriptions and trials</p>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Companies</p>
          <h3 style={{ ...styles.statValue, color: '#0f172a' }}>{stats.total}</h3>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Free Trials</p>
          <h3 style={{ ...styles.statValue, color: '#f59e0b' }}>{stats.trial}</h3>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Paid Plans</p>
          <h3 style={{ ...styles.statValue, color: '#10b981' }}>{stats.paid}</h3>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Expiring Soon</p>
          <h3 style={{ ...styles.statValue, color: '#ef4444' }}>{stats.expiring}</h3>
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.searchBox}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <button style={filter === 'all' ? styles.filterBtnActive : styles.filterBtn} onClick={() => setFilter('all')}>All</button>
        <button style={filter === 'trial' ? styles.filterBtnActive : styles.filterBtn} onClick={() => setFilter('trial')}>Free Trials</button>
        <button style={filter === 'expiring' ? styles.filterBtnActive : styles.filterBtn} onClick={() => setFilter('expiring')}>Expiring Soon</button>
        <button style={filter === 'expired' ? styles.filterBtnActive : styles.filterBtn} onClick={() => setFilter('expired')}>Expired</button>
        <button style={filter === 'paid' ? styles.filterBtnActive : styles.filterBtn} onClick={() => setFilter('paid')}>Paid</button>
      </div>

      {/* Table */}
      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <div>Company</div>
          <div>Email</div>
          <div>Plan</div>
          <div>Branches</div>
          <div>Days Left</div>
          <div>Actions</div>
        </div>

        {filteredCompanies.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No companies found
          </div>
        ) : (
          filteredCompanies.map((company) => (
            <div key={company._id} style={styles.tableRow}>
              <div>
                <strong>{company.name}</strong>
              </div>
              <div style={{ color: '#64748b', fontSize: '14px' }}>{company.email}</div>
              <div>
                <span style={getPlanBadgeStyle(company.plan)}>
                  {company.plan === 'free_trial' ? 'Free Trial' : company.plan.charAt(0).toUpperCase() + company.plan.slice(1)}
                </span>
              </div>
              <div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={14} />
                  {company.branchCount} / {company.branchLimit === 999 ? '∞' : company.branchLimit}
                </span>
              </div>
              <div>
                {company.daysRemaining !== null ? (
                  <span style={{ color: company.daysRemaining <= 3 ? '#ef4444' : company.daysRemaining <= 7 ? '#f59e0b' : '#10b981', fontWeight: '700' }}>
                    {company.daysRemaining} days
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8' }}>—</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  value={company.plan}
                  onChange={(e) => handlePlanChange(company.companyId, e.target.value)}
                  disabled={updating === company.companyId}
                  style={styles.select}
                >
                  <option value="free_trial">Free Trial</option>
                  <option value="starter">Starter (₦5k)</option>
                  <option value="business">Business (₦10k)</option>
                  <option value="enterprise">Enterprise (₦20k)</option>
                </select>
                
                {company.plan === 'free_trial' && (
                  <button
                    onClick={() => handleExtendTrial(company.companyId)}
                    disabled={updating === company.companyId}
                    style={{ ...styles.actionBtn, background: '#dbeafe', color: '#2563eb' }}
                  >
                    +21 Days
                  </button>
                )}
                
                <button
                  onClick={() => handleToggleStatus(company.companyId, company.status)}
                  disabled={updating === company.companyId}
                  style={{
                    ...styles.actionBtn,
                    background: company.status === 'active' ? '#fee2e2' : '#dcfce7',
                    color: company.status === 'active' ? '#ef4444' : '#16a34a'
                  }}
                >
                  {company.status === 'active' ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}