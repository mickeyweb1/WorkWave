import { AdminSidebar } from "../Sidebar/sidebar";
import { AdminTopBar } from "../topBar/topBar";
import { Outlet, useLocation } from "react-router-dom";
import "./AdminLayout.css";
import TrialBanner from "../../../TrialBanner/TrialBanner"; // 👈 ADD THIS IMPORT
import { useEffect, useState } from "react";

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname.replace("/admin", "").replace("/", "");
    if (!path) return "Dashboard";

    const titleMap = {
      dashboard: "Dashboard",
      reportsAnalytics: "Reports & Analytics",
      activityLog: "Activity History",
      sales: "Sales / Income",
      expenses: "Expenses",
      products: "Products / Stock",
      adminBranches: "Branches",
      manageWorkers: "Manage Workers",
      workerLinks: "Worker Invite Links",
      notifications: "Notifications",
      settings: "Settings",
      helpCenter: "Help Center",
    };

    return (
      titleMap[path] ||
      path.charAt(0).toUpperCase() + path.slice(1).replace(/([A-Z])/g, " $1")
    );
  };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="admin-layout-wrapper">
      <div
        className={`mobile-sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={closeSidebar}
        role="presentation"
      />

      <AdminSidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />

      <div className="admin-main-area">
        <AdminTopBar
          pageTitle={getPageTitle()}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />

        <main className="admin-page-content">
          {/* 👇 TRIAL BANNER GOES HERE! 👇 */}
          <TrialBanner />
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
}