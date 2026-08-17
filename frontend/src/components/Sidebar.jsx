import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import * as Icons from 'lucide-react';

const defaultFallbackNavs = [
  { menu_path: '/', menu_name: 'Dashboard', menu_icon: 'LayoutDashboard', module_code: 'dashboard' },
  { menu_path: '/user', menu_name: 'User Portal', menu_icon: 'UserCheck', module_code: 'user_page' },
  { menu_path: '/admin-console', menu_name: 'Admin Console', menu_icon: 'ShieldCheck', module_code: 'admin' },
  { menu_path: '/structural-masters', menu_name: 'Structural Masters', menu_icon: 'Building2', module_code: 'structural_masters' },
  { menu_path: '/dynamic-masters', menu_name: 'Dynamic Masters (EAV)', menu_icon: 'Layers', module_code: 'dynamic_masters' },
  { menu_path: '/process-engine', menu_name: 'Process Engine', menu_icon: 'Cpu', module_code: 'process_engine' },
  { menu_path: '/workflow-approvals', menu_name: 'Workflow & Approvals', menu_icon: 'GitPullRequest', module_code: 'workflow' },
  { menu_path: '/journal-stock', menu_name: 'Journal & Stock Ledger', menu_icon: 'BookOpenCheck', module_code: 'journal' },
  { menu_path: '/process-attribute-values', menu_name: 'Process Attribute Values', menu_icon: 'ListFilter', module_code: 'process_engine' },
  { menu_path: '/process-links', menu_name: 'Process Links', menu_icon: 'GitCommit', module_code: 'process_engine' },
];

export default function Sidebar() {
  const { user, designation, isSuperAdmin, hasPermission } = useAuth();
  const [menus, setMenus] = useState([]);

  const loadMenus = () => {
    axios.get('http://127.0.0.1:8000/api/core/ui-menus/?active=true')
      .then((res) => {
        const fetched = res.data?.results || res.data || [];
        if (fetched.length > 0) {
          setMenus(fetched);
        } else {
          setMenus(defaultFallbackNavs);
        }
      })
      .catch(() => {
        setMenus(defaultFallbackNavs);
      });
  };

  useEffect(() => {
    loadMenus();
    window.addEventListener('erp_ui_metadata_updated', loadMenus);
    return () => window.removeEventListener('erp_ui_metadata_updated', loadMenus);
  }, []);

  const getIconComponent = (iconName) => {
    if (!iconName) return Icons.LayoutDashboard;
    return Icons[iconName] || Icons.LayoutDashboard;
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          E3
        </div>
        <div className="overflow-hidden min-w-0">
          <h1 className="sidebar-title truncate">
            ERP v3
          </h1>
          <p className="sidebar-subtitle truncate">Enterprise System</p>
        </div>
      </div>

      {/* Dynamic Navigation Links */}
      <nav className="sidebar-nav custom-scrollbar">
        {menus.map((item) => {
          const modCode = item.module_code || 'dashboard';
          if (!isSuperAdmin && modCode !== 'user_page' && modCode !== 'dashboard') {
            if (hasPermission && !hasPermission(modCode)) return null;
          }

          const IconComponent = getIconComponent(item.menu_icon);
          return (
            <NavLink
              key={item.menu_path || item.id}
              to={item.menu_path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <IconComponent className="w-[18px] h-[18px] shrink-0" />
              <span className="truncate">{item.menu_name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile Footer - Fixed at Bottom */}
      <div className="sidebar-footer">
        <div className="user-card-compact">
          <div className="sidebar-user-avatar">
            {isSuperAdmin ? 'SA' : (designation?.title?.[0] || user?.name?.[0] || 'U')}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.name || (isSuperAdmin ? 'System Super Administrator' : 'System User')}</p>
            <p className="sidebar-user-role">
              {isSuperAdmin ? 'Super Administrator' : (designation?.title || 'System Operator')}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
