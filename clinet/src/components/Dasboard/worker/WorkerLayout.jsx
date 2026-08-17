import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingDown,
  LogOut,
  User,
  Package,
  Settings,
  Menu,
  X,
  icons,
  User2,
  FileText,
  CheckCircle,
} from "lucide-react";
import "./WorkerLayout.css"; // Import the CSS file

export function WorkerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const userString = localStorage.getItem("workwave_user");
  const user = userString ? JSON.parse(userString) : null;
  const workerName = user ? user.name : "Worker";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const links = [
    {
      path: "/workerDashboard",
      name: "My Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      path: "/workerSales",
      name: "Record Sale",
      icon: <ShoppingCart size={20} />,
    },
    {
      path: "/workerExpenses",
      name: "Record Expense",
      icon: <TrendingDown size={20} />,
    },
    {
      path: "/workerRestock",
      name: "Restock Inventory",
      icon: <Package size={20} />,
    },
    {
      path:"/production-approval",
      name: "Production Approval",
      icon: <CheckCircle size={20} />
      
    },
    {
      path: "/manageWorkers",
      name: "Manage Factory Workers",
      icon: <User2 size={20} />,
    },
    {
      path: "/raw-materials",
      name: "Raw Materials",
      icon: <Package size={20} />,
    },
    {
      path: "/worker-daily-report",
      name: "Daily Report",
      icon: <FileText size={20} />,
    },
    { path: "/workerSettings", name: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily: "sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Mobile Overlay */}
      <div
        className={`worker-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`worker-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div
          style={{
            marginBottom: "32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#38bdf8",
                margin: 0,
              }}
            >
              WorkWave
            </h1>
            <p
              style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0" }}
            >
              Worker Portal
            </p>
          </div>
          <button
            className="worker-close-btn"
            onClick={closeSidebar}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            <X size={24} />
          </button>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            flex: 1,
          }}
        >
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={closeSidebar}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "8px",
                textDecoration: "none",
                color: location.pathname === link.path ? "#0f172a" : "#cbd5e1",
                backgroundColor:
                  location.pathname === link.path ? "#38bdf8" : "transparent",
                fontWeight: location.pathname === link.path ? "bold" : "normal",
                transition: "all 0.2s",
              }}
            >
              {link.icon} {link.name}
            </Link>
          ))}
        </nav>

        <div
          style={{
            borderTop: "1px solid #334155",
            paddingTop: "16px",
            marginTop: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <User size={20} color="#94a3b8" />
            <span style={{ fontSize: "14px" }}>{workerName}</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className="worker-main-wrapper"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Mobile Top Bar with Hamburger Menu */}
        <div className="worker-mobile-topbar">
          <button
            onClick={toggleSidebar}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#334155",
            }}
          >
            <Menu size={24} />
          </button>
          <span style={{ fontWeight: "bold", color: "#0f172a" }}>
            WorkWave Worker
          </span>
        </div>

        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
}
