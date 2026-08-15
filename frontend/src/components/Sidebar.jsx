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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    axios.get('http://127.0.0.1:8000/api/core/ui-menus/?active=true')
      .then((res) => {
        if (!isMounted) return;
        const fetched = res.data?.results || res.data || [];
        if (fetched.length > 0) {
          setMenus(fetched);
        } else {
          setMenus(defaultFallbackNavs);
        }
      })
      .catch((err) => {
        console.warn("Using default sidebar menus due to fetch notice:", err?.message);
        if (isMounted) setMenus(defaultFallbackNavs);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const getIconComponent = (iconName) => {
    if (!iconName) return Icons.LayoutDashboard;
    return Icons[iconName] || Icons.LayoutDashboard;
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center gap-3 bg-slate-950/40">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/25">
          E3
        </div>
        <div>
          <h1 className="text-base font-extrabold text-white tracking-tight leading-tight">
            ERP <span className="gradient-text">v3</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Metadata Platform</p>
        </div>
      </div>

      {/* Dynamic Navigation Links */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-1.5 custom-scrollbar">
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
              <IconComponent className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">{item.menu_name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Designation User Footer */}
      <div className="p-4 border-t border-white/10 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/30 font-bold text-xs">
            {isSuperAdmin ? 'SA' : (designation?.title?.[0] || 'U')}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Guest User'}</p>
            <p className="text-[10px] font-mono text-purple-400 truncate">
              {isSuperAdmin ? 'Super Administrator' : (designation?.title || 'No Designation')}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
