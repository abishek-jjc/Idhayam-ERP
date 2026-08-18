import React, { useState } from 'react';
import {
  ShieldCheck, Menu, PanelsTopLeft, Maximize2, FilePenLine, Grid2X2, Palette,
  SlidersHorizontal, GitBranch, LockKeyhole, RefreshCw, History, RotateCcw, Search, Cpu
} from 'lucide-react';
import MenuManagement from './MenuManagement';
import NavbarManagement from './NavbarManagement';
import ModalDesigner from './ModalDesigner';
import FormBuilder from './FormBuilder';
import WidgetManagement from './WidgetManagement';
import ThemeManagement from './ThemeManagement';
import ProcessTypeConfig from './ProcessTypeConfig';
import ProcessAttributeValues from './ProcessAttributeValues';
import ProcessLinks from './ProcessLinks';
import PermissionMapping from './PermissionMapping';
import AuditLogViewer from '../components/ui/AuditLogViewer';
import VersionRollbackManager from '../components/ui/VersionRollbackManager';
import SearchConfiguration from './SearchConfiguration';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';

export default function AdminConsole() {
  const [activeTab, setActiveTab] = useState('menu_management');

  const adminTabs = [
    { id: 'menu_management', label: 'Menu Management', icon: Menu },
    { id: 'navbar_management', label: 'Navbar Management', icon: PanelsTopLeft },
    { id: 'search_configuration', label: 'Global Search', icon: Search },
    { id: 'modal_designer', label: 'Modal Designer', icon: Maximize2 },
    { id: 'form_builder', label: 'Form Builder', icon: FilePenLine },
    { id: 'widget_management', label: 'Widget Management', icon: Grid2X2 },
    { id: 'theme_management', label: 'Theme Management', icon: Palette },
    { id: 'process_type_config', label: 'Process Attributes', icon: Cpu },
    { id: 'process_attribute_values', label: 'Process Values', icon: SlidersHorizontal },
    { id: 'process_links', label: 'Process Links', icon: GitBranch },
    { id: 'permission_mapping', label: 'Permissions', icon: LockKeyhole },
    { id: 'audit_log', label: 'Change Audit Log', icon: History },
    { id: 'version_rollback', label: 'Version Rollback', icon: RotateCcw },
  ];

  const activeTabObj = adminTabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Page Header */}
      <PageHeader
        title="Admin Console & Dynamic Control Center"
        description="Centralized source of truth for ERP menus, navbar, dynamic forms, process schemas, links, themes, widgets, and permissions."
        icon={ShieldCheck}
        breadcrumbItems={[
          { label: 'Admin Console', path: '/admin-console' },
          { label: activeTabObj?.label || 'Console', path: '#' }
        ]}
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={() => window.location.reload()}>
            Refresh Console
          </Button>
        }
      />

      {/* Admin Sub-Module Navigation Container */}
      <Tabs tabs={adminTabs} activeTab={activeTab} onChange={setActiveTab} className="admin-console-tabs" />

      {/* Active Tab View */}
      <div className="pt-1">
        {activeTab === 'menu_management' && <MenuManagement />}
        {activeTab === 'navbar_management' && <NavbarManagement />}
        {activeTab === 'search_configuration' && <SearchConfiguration />}
        {activeTab === 'modal_designer' && <ModalDesigner />}
        {activeTab === 'form_builder' && <FormBuilder />}
        {activeTab === 'widget_management' && <WidgetManagement />}
        {activeTab === 'theme_management' && <ThemeManagement />}
        {activeTab === 'process_type_config' && <ProcessTypeConfig />}
        {activeTab === 'process_attribute_values' && <ProcessAttributeValues />}
        {activeTab === 'process_links' && <ProcessLinks />}
        {activeTab === 'permission_mapping' && <PermissionMapping />}
        {activeTab === 'audit_log' && <AuditLogViewer />}
        {activeTab === 'version_rollback' && <VersionRollbackManager configType="menu" />}
      </div>
    </div>
  );
}

