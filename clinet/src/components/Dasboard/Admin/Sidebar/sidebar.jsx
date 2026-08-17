import { NavLink } from "react-router-dom";
import "./sidebar.css";
import {
  LayoutDashboard,
  BarChart3,
  Activity,
  Building2,
  Package,
  Users,
  Link2,
  Wallet,
  Receipt,
  Bell,
  Settings,
  LifeBuoy,
  Crown,
  CreditCard,
  FileText,
  CheckCircle,
  Phone,
} from "lucide-react";

// Accept isOpen as a prop
export function AdminSidebar({ isOpen, closeSidebar }) {
  return (
    <div className={`admin-sidebar ${isOpen ? "" : "collapsed"}`}>
      {/* =================================================
          LOGO / HEADER
          ================================================= */}

      <div className="sidebar-brand">
        <div className="brand-text">
          <h2>WorkWave</h2>
          <span>Admin Workspace</span>
        </div>
      </div>

      {/* =================================================
          OVERVIEW
          ================================================= */}

      <div className="sidebar-section">
        <h3 className="section-title">OVERVIEW</h3>

        <NavLink
          to="/adminDashboard"
          className="nav-link"
          onClick={closeSidebar}
        >
          <LayoutDashboard size={20} />
          <span className="nav-text">Dashboard</span>
        </NavLink>

        <NavLink
          to="/reportsAnalytics"
          className="nav-link"
          onClick={closeSidebar}
        >
          <BarChart3 size={20} />
          <span className="nav-text">Reports & Analytics</span>
        </NavLink>

        <NavLink to="/activityLog" className="nav-link" onClick={closeSidebar}>
          <Activity size={20} />
          <span className="nav-text">Activity History</span>
        </NavLink>

        <NavLink to="/daily-report" className="nav-link" onClick={closeSidebar}>
          <FileText size={20} />
          <span className="nav-text">Daily Report</span>
        </NavLink>
      </div>

      {/* =================================================
          OPERATIONS
          ================================================= */}

      <div className="sidebar-section">
        <h3 className="section-title">OPERATIONS</h3>

        <NavLink to="/sales" className="nav-link" onClick={closeSidebar}>
          <Wallet size={20} />
          <span className="nav-text">Sales / Income</span>
        </NavLink>

        <NavLink to="/expenses" className="nav-link" onClick={closeSidebar}>
          <Receipt size={20} />
          <span className="nav-text">Expenses</span>
        </NavLink>

        <NavLink to="/products" className="nav-link" onClick={closeSidebar}>
          <Package size={20} />
          <span className="nav-text">Products / Stock</span>
        </NavLink>

        <NavLink
          to="/raw-materials"
          className="nav-link"
          onClick={closeSidebar}
        >
          <Package size={20} />
          <span className="nav-text">Raw Materials</span>
        </NavLink>

        <NavLink
          to="/production-approval" 
          className="nav-link"
          onClick={closeSidebar}
        >
          <CheckCircle size={20} />
          <span className="nav-text">Production Approval</span>
        </NavLink>

        <NavLink
          to="/adminBranches"
          className="nav-link"
          onClick={closeSidebar}
        >
          <Building2 size={20} />
          <span className="nav-text">Branches</span>
        </NavLink>

        <NavLink
          to="/admin/deborts"
          className="nav-link"
          onClick={closeSidebar}
        >
          <CreditCard size={20} />
          <span className="nav-text">Debtors</span>
        </NavLink>

        <NavLink
          to="/manageWorkers"
          className="nav-link"
          onClick={closeSidebar}
        >
          <Users size={20} />
          <span className="nav-text">Manage Workers</span>
        </NavLink>

        <NavLink to="/workerLinks" className="nav-link" onClick={closeSidebar}>
          <Link2 size={20} />
          <span className="nav-text">Worker Invite Links</span>
        </NavLink>
      </div>

      {/* =================================================
          ACCOUNT
          ================================================= */}

      <div className="sidebar-section">
        <h3 className="section-title">ACCOUNT</h3>

        {/* Add this INSIDE the ACCOUNT section, before Help Center */}
{JSON.parse(localStorage.getItem('workwave_user') || '{}').email === 'welcome@gmail.com' && (
  <NavLink to="/billing-management" className="nav-link" onClick={closeSidebar}>
    <Crown size={20} color="#f59e0b" />
    <span className="nav-text">Billing Management</span>
  </NavLink>
)}

        <NavLink
          to="/notifications"
          className="nav-link"
          onClick={closeSidebar}
        >
          <Bell size={20} />
          <span className="nav-text">Notifications</span>
        </NavLink>

        <NavLink to="/settings" className="nav-link" onClick={closeSidebar}>
          <Settings size={20} />
          <span className="nav-text">Settings</span>
        </NavLink>

        <NavLink to="/helpCenter" className="nav-link" onClick={closeSidebar}>
          <LifeBuoy size={20} />
          <span className="nav-text">Help Center</span>
        </NavLink>
      </div>

      {/* =================================================
          UPGRADE (WhatsApp Button Only)
          ================================================= */}

      <div className="sidebar-upgrade">
        <div className="upgrade-card">
          <div className="upgrade-icon">
            <Crown size={16} />
          </div>

          <h4>Free Trial</h4>
          <p className="nav-text">Unlock premium features</p>

          {/* 👇 ONLY THIS WHATSAPP BUTTON NOW 👇 */}
          <a 
            href="https://wa.me/2347062640714?text=Hello%20WorkWave%20Support,%20I%20want%20to%20upgrade%20my%20plan." 
            target="_blank" 
            rel="noopener noreferrer"
            className="upgrade-btn"
            style={{ 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px' 
            }}
          >
            <Phone size={16} />
            <span className="nav-text">Upgrade via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}