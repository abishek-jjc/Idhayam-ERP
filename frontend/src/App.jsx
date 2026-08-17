import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfigurationProvider, useConfiguration } from './context/ConfigurationContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import StructuralMasters from './pages/StructuralMasters';
import DynamicMasters from './pages/DynamicMasters';
import ProcessEngine from './pages/ProcessEngine';
import WorkflowApprovals from './pages/WorkflowApprovals';
import JournalStock from './pages/JournalStock';
import AdminConsole from './pages/AdminConsole';
import LoginPage from './pages/LoginPage';
import UserPage from './pages/UserPage';
import ProcessAttributeValues from './pages/ProcessAttributeValues';
import ProcessLinks from './pages/ProcessLinks';
import ErrorBoundary from './components/ErrorBoundary';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

function AuthorizedPage({ moduleCode, Component }) {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin && !['dashboard', 'user_page'].includes(moduleCode) && !hasPermission(moduleCode)) {
    return <Navigate to="/user" replace />;
  }
  return <Component />;
}

function ConfigurationChangeNotice() {
  const { lastImpact, clearLastImpact } = useConfiguration();
  React.useEffect(() => {
    if (!lastImpact) return undefined;
    const timer = window.setTimeout(clearLastImpact, 7000);
    return () => window.clearTimeout(timer);
  }, [clearLastImpact, lastImpact]);
  if (!lastImpact) return null;
  const connected = lastImpact.connected_to_live_pages;
  return (
    <div className={`configuration-change-notice ${connected ? 'connected' : 'unconnected'}`} role="status">
      {connected ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
      <div>
        <strong>{connected ? 'Configuration updated successfully' : 'Configuration saved with warning'}</strong>
        {connected ? (
          <p>Affected pages ({lastImpact.affected_page_count || lastImpact.affected_pages?.length || 0}): {(lastImpact.affected_pages || []).join(', ')}</p>
        ) : (
          <p>No real ERP page is connected to this setting yet.</p>
        )}
      </div>
      <button type="button" onClick={clearLastImpact} aria-label="Dismiss configuration result"><X /></button>
    </div>
  );
}

function ProtectedLayout() {
  const { menus, loading } = useConfiguration();
  const pageComponents = {
    dashboard: Dashboard,
    user_page: UserPage,
    admin: AdminConsole,
    structural_masters: StructuralMasters,
    dynamic_masters: DynamicMasters,
    process_engine: ProcessEngine,
    workflow: WorkflowApprovals,
    journal: JournalStock,
    process_attribute_values: ProcessAttributeValues,
    process_links: ProcessLinks,
  };
  const configuredRoutes = menus
    .map((menu) => ({ ...menu, Component: pageComponents[menu.page_key || menu.module_code] }))
    .filter((menu) => menu.menu_path && menu.Component);
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading ERP configuration...</div>;
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar title="ERP v3 Metadata Platform" />
        <ConfigurationChangeNotice />
        <div className="page-container">
          <ErrorBoundary>
            <Routes>
              {configuredRoutes.map(({ id, menu_path, module_code, Component }) => (
                <Route key={id || menu_path} path={menu_path} element={<AuthorizedPage moduleCode={module_code} Component={Component} />} />
              ))}
              <Route path="/" element={<AuthorizedPage moduleCode="dashboard" Component={Dashboard} />} />
              <Route path="/user" element={<AuthorizedPage moduleCode="user_page" Component={UserPage} />} />
              <Route path="/admin-console" element={<AuthorizedPage moduleCode="admin" Component={AdminConsole} />} />
              <Route path="/structural-masters" element={<AuthorizedPage moduleCode="structural_masters" Component={StructuralMasters} />} />
              <Route path="/dynamic-masters" element={<AuthorizedPage moduleCode="dynamic_masters" Component={DynamicMasters} />} />
              <Route path="/process-engine" element={<AuthorizedPage moduleCode="process_engine" Component={ProcessEngine} />} />
              <Route path="/workflow-approvals" element={<AuthorizedPage moduleCode="workflow" Component={WorkflowApprovals} />} />
              <Route path="/journal-stock" element={<AuthorizedPage moduleCode="journal" Component={JournalStock} />} />
              <Route path="/process-attribute-values" element={<AuthorizedPage moduleCode="process_engine" Component={ProcessAttributeValues} />} />
              <Route path="/process-links" element={<AuthorizedPage moduleCode="process_engine" Component={ProcessLinks} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ConfigurationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </Router>
      </ConfigurationProvider>
    </AuthProvider>
  );
}
