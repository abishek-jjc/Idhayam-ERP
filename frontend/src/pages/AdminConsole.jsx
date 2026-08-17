import React, { useState } from 'react';
import {
  ShieldCheck, Menu, PanelsTopLeft, Maximize2, FilePenLine, Grid2X2, Palette, SlidersHorizontal, GitBranch, LockKeyhole, RefreshCw
} from 'lucide-react';
import MenuManagement from './MenuManagement';
import NavbarManagement from './NavbarManagement';
import ModalDesigner from './ModalDesigner';
import FormBuilder from './FormBuilder';
import WidgetManagement from './WidgetManagement';
import ThemeManagement from './ThemeManagement';
import ProcessAttributeValues from './ProcessAttributeValues';
import ProcessLinks from './ProcessLinks';
import PermissionMapping from './PermissionMapping';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

export default function AdminConsole() {
  const [activeTab, setActiveTab] = useState('menu_management');

  const adminTabs = [
    { id: 'menu_management', label: 'Menu Management', icon: Menu },
    { id: 'navbar_management', label: 'Navbar Management', icon: PanelsTopLeft },
    { id: 'modal_designer', label: 'Modal Designer', icon: Maximize2 },
    { id: 'form_builder', label: 'Form Builder', icon: FilePenLine },
    { id: 'widget_management', label: 'Widget Management', icon: Grid2X2 },
    { id: 'theme_management', label: 'Theme Management', icon: Palette },
    { id: 'process_attribute_values', label: 'Process Attribute Values', icon: SlidersHorizontal },
    { id: 'process_links', label: 'Process Links', icon: GitBranch },
    { id: 'permission_mapping', label: 'Permission Mapping', icon: LockKeyhole },
  ];

  const activeTabObj = adminTabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Page Header */}
      <PageHeader
        title="Admin Console"
        description="Manage menus, navigation, forms, modals, widgets, themes and dynamic metadata permissions."
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
      <div className="admin-console-menu">
        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`admin-menu-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="admin-menu-icon" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div className="pt-1">
        {activeTab === 'menu_management' && <MenuManagement />}
        {activeTab === 'navbar_management' && <NavbarManagement />}
        {activeTab === 'modal_designer' && <ModalDesigner />}
        {activeTab === 'form_builder' && <FormBuilder />}
        {activeTab === 'widget_management' && <WidgetManagement />}
        {activeTab === 'theme_management' && <ThemeManagement />}
        {activeTab === 'process_attribute_values' && <ProcessAttributeValues />}
        {activeTab === 'process_links' && <ProcessLinks />}
        {activeTab === 'permission_mapping' && <PermissionMapping />}
      </div>
    </div>
  );
}
