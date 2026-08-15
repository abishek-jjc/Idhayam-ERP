import React, { useState } from 'react';
import { ShieldCheck, Menu, Layout, Maximize2, FileCode, LayoutGrid, Palette, ListFilter, GitCommit, Lock, Database } from 'lucide-react';
import MenuManagement from './MenuManagement';
import NavbarManagement from './NavbarManagement';
import ModalDesigner from './ModalDesigner';
import FormBuilder from './FormBuilder';
import WidgetManagement from './WidgetManagement';
import ThemeManagement from './ThemeManagement';
import ProcessAttributeValues from './ProcessAttributeValues';
import ProcessLinks from './ProcessLinks';
import PermissionMapping from './PermissionMapping';

export default function AdminConsole() {
  const [activeTab, setActiveTab] = useState('menu_management');

  const adminTabs = [
    { id: 'menu_management', label: 'Menu Management', icon: Menu },
    { id: 'navbar_management', label: 'Navbar Management', icon: Layout },
    { id: 'modal_designer', label: 'Modal Designer', icon: Maximize2 },
    { id: 'form_builder', label: 'Form Builder', icon: FileCode },
    { id: 'widget_management', label: 'Widget Management', icon: LayoutGrid },
    { id: 'theme_management', label: 'Theme Management', icon: Palette },
    { id: 'process_attribute_values', label: 'Process Attribute Values', icon: ListFilter },
    { id: 'process_links', label: 'Process Links', icon: GitCommit },
    { id: 'permission_mapping', label: 'Permission Mapping', icon: Lock },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Banner */}
      <div className="p-6 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              ERP v3 <span className="gradient-text">Metadata Studio Console</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Administrator UI control center for menus, navbar headers, form builders, dynamic modals, widgets, themes, and process links.
            </p>
          </div>
        </div>
      </div>

      {/* Admin Sub-Module Navigation Bar */}
      <div className="p-2 bg-slate-900/40 border border-white/10 rounded-2xl flex flex-wrap items-center gap-2 overflow-x-auto custom-scrollbar">
        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Sub-Component Studio View */}
      <div className="pt-2">
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
