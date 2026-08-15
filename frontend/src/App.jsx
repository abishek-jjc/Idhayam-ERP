import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

function ProtectedLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar title="ERP v3 Metadata Platform" />
        <div className="page-container">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/user" element={<UserPage />} />
              <Route path="/admin-console" element={<AdminConsole />} />
              <Route path="/structural-masters" element={<StructuralMasters />} />
              <Route path="/dynamic-masters" element={<DynamicMasters />} />
              <Route path="/process-engine" element={<ProcessEngine />} />
              <Route path="/workflow-approvals" element={<WorkflowApprovals />} />
              <Route path="/journal-stock" element={<JournalStock />} />
              <Route path="/process-attribute-values" element={<ProcessAttributeValues />} />
              <Route path="/process-links" element={<ProcessLinks />} />
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
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
