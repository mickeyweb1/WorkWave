import { useEffect, useState } from "react";
import { AdminLayout } from "./components/Dasboard/Admin/AdminLayout/AdminLayout";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthPage } from "./Pages/Auth/Auth";
import AdminHomeDashboard from "./Pages/Dashboards/Admin/homeDashboard.jsx/homeDashboard";
import HelpCenter from "./Pages/Dashboards/Admin/helpCenter/helpCenter";
import AdminSales from "./Pages/Dashboards/Admin/adminSales/AdminSales";
import ProductsPage from "./Pages/Dashboards/Admin/ProductsPage";
import { BranchesPage } from "./Pages/Dashboards/Admin/BranchesPage";
import BranchDetailsPage from "./Pages/Dashboards/Admin/BranchDetailsPage";
import { ManageWorkersPage } from "./Pages/Dashboards/Admin/ManageWorkers/ManageWorkerssPage";
import { WorkerLinksPage } from "./Pages/Dashboards/Admin/workerLinks/workerLinks";
import { WorkerLayout } from "./components/Dasboard/worker/WorkerLayout";
import WorkerDashboard from "./Pages/Dashboards/workers/WorkerDashboard";
import InviteAcceptPage from "./Pages/Auth/InviteAcceptPage";
import WorkerSales from "./Pages/Dashboards/workers/WorkerSales";
import { ActivityLogPage } from "./Pages/Dashboards/Admin/ActivityLogPage";
import WorkerRestock from "./Pages/Dashboards/workers/WorkerRestock";
import AdminReports from "./components/Dasboard/Admin/AdminReports";
import { NotificationsPage } from "./Pages/Dashboards/Admin/NotificationsPage";
import WorkerExpenses from "./Pages/Dashboards/workers/WorkerExpenses";
import ProductDetailPage from "./Pages/Dashboards/Admin/ProductDetailPage";
import DebtorsPage from "./Pages/Dashboards/Admin/DebtorsPage";
import ExpensesPage from "./Pages/Dashboards/Admin/ExpensesPage";
import { FactoryWorkerLayout } from "./components/Dasboard/worker/FactoryWorkerLayout";
import FactoryWorkerDashboard from "./Pages/Dashboards/workers/FactoryWorkerDashboard";
import RawMaterialsPage from "./Pages/Dashboards/Admin/RawMaterials/RawMaterialsPage";
import MaterialDetailPage from "./Pages/Dashboards/Admin/RawMaterial/MaterialDetailPage";
import DailyReportPage from "./Pages/Dashboards/Admin/DailyReport/DailyReportPage"
import ProductionApproval from "./Pages/Dashboards/Admin/ProductionApproval/ProductionApproval";
import SettingsPage from "./Pages/Dashboards/Settings/SettingsPage";
import TrialExpired from "./components/TrialExpired/TrialExpired";
import WelcomeModal from "./components/WelcomeModal/WelcomeModal";
import BillingManagement from "./Pages/Dashboards/Admin/BillingManagement/BillingManagement";

function getAuthState() {
  if (typeof window === "undefined") {
    return { token: null, role: null, user: null }; // 👈 Add user: null
  }

  const userString = localStorage.getItem("workwave_user");
  const user = userString ? JSON.parse(userString) : null;

  return {
    token: localStorage.getItem("workwave_token"),
    role: localStorage.getItem("workwave_user_role"),
    hasSeenWelcome: user?.hasSeenWelcome || false,
    user: user // 👈 ADD THIS LINE
  };
}

function App() {
  const [authState, setAuthState] = useState(getAuthState);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const { token, role, user } = authState;

  useEffect(() => {
    const syncAuthState = () => setAuthState(getAuthState());

    window.addEventListener("workwave-auth-changed", syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener("workwave-auth-changed", syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  useEffect(() => {
  if (token && role === "admin" && !authState.hasSeenWelcome) {
    setShowWelcome(true);
  }
}, [token, role, authState.hasSeenWelcome]);


  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/invite" element={<InviteAcceptPage />} />

        {/* ADMIN ROUTES: Only render if token exists AND role is admin */}
        {token && role === "admin" && (
          <Route element={<AdminLayout />}>
            <Route path="/adminDashboard" element={<AdminHomeDashboard />} />
            <Route path="/reportsAnalytics" element={<AdminReports />} />
            <Route path="/activityLog" element={<ActivityLogPage />} />
            <Route path="/sales" element={<AdminSales />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/adminBranches" element={<BranchesPage />} />
            <Route path="/adminBranches/:id" element={<BranchDetailsPage />} />
            <Route path="/admin/products/:id" element={<ProductDetailPage />} />
            <Route path="/manageWorkers" element={<ManageWorkersPage />} />
            <Route path="/workerLinks" element={<WorkerLinksPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/trial-expired" element={<TrialExpired />} />
            <Route path="/daily-report" element={<DailyReportPage />} />
            <Route path="/raw-materials" element={<RawMaterialsPage />} />
            <Route path="/raw-materials/:id" element={<MaterialDetailPage />} />
            <Route path="/helpCenter" element={<HelpCenter />} />
            <Route path="/production-approval" element={<ProductionApproval />} />
            <Route path="/admin/deborts" element={<DebtorsPage />} />
            {user?.email === 'welcome@gmail.com' && (
  <Route path="/billing-management" element={<BillingManagement />} />
)}
          </Route>
        )}

        {/* WORKER ROUTES (Secretary) */}
        {token && role === "worker" && (
          <>
            {/* Secretary Routes (Has Sidebar) */}
            <Route element={<WorkerLayout />}>
              <Route path="/workerDashboard" element={<WorkerDashboard />} />
              <Route path="/workerSales" element={<WorkerSales />} />
              <Route path="/worker-daily-report" element={<DailyReportPage />} />
              <Route path="/workerExpenses" element={<WorkerExpenses />} />
              <Route path="/workerRestock" element={<WorkerRestock />} />
              <Route path="/manageWorkers" element={<ManageWorkersPage />} />
              <Route path="/workerLinks" element={<WorkerLinksPage />} />
              <Route path="/production-approval" element={<ProductionApproval />} />
              <Route
                path="/raw-materials/:id"
                element={<MaterialDetailPage />}
              />

              {/* 👇 ADD RAW MATERIALS HERE 👇 */}
              <Route path="/raw-materials" element={<RawMaterialsPage />} />

              <Route path="/workerSettings" element={<SettingsPage />} />
            </Route>

            {/* Factory Worker Routes (Topbar ONLY - NO SIDEBAR) */}
            <Route element={<FactoryWorkerLayout />}>
              <Route
                path="/factory-worker"
                element={<FactoryWorkerDashboard />}
              />
            </Route>
          </>
        )}

        {/* Fallback: If no token or unrecognized role, go to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
    </Router>
  );
}

export default App;
