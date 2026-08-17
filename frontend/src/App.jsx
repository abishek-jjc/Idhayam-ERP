import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
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
  useEffect(() => {
    const applyActiveTheme = () => {
      axios.get('http://127.0.0.1:8000/api/core/ui-themes/?active=true')
        .then(res => {
          const list = res.data?.results || res.data || [];
          const activeTheme = list.find(t => t.active) || list[0];
          if (activeTheme) {
            const root = document.documentElement;
            if (activeTheme.primary_color) root.style.setProperty('--theme-primary', activeTheme.primary_color);
            if (activeTheme.secondary_color) root.style.setProperty('--theme-secondary', activeTheme.secondary_color);
            if (activeTheme.background_color) root.style.setProperty('--theme-bg', activeTheme.background_color);
            if (activeTheme.card_bg_color) root.style.setProperty('--theme-card', activeTheme.card_bg_color);
            if (activeTheme.text_color) root.style.setProperty('--theme-text', activeTheme.text_color);
            if (activeTheme.border_color) root.style.setProperty('--theme-border', activeTheme.border_color);
          }
        })
        .catch(() => {});
    };

    applyActiveTheme();
    window.addEventListener('erp_theme_updated', applyActiveTheme);
    return () => window.removeEventListener('erp_theme_updated', applyActiveTheme);
  }, []);
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
