import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfiguration } from '../context/ConfigurationContext';
import * as Icons from 'lucide-react';

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, designation, isSuperAdmin, hasPermission } = useAuth();
  const { menus, theme, loading } = useConfiguration();

  const getIconComponent = (iconName) => {
    if (!iconName) return Icons.LayoutDashboard;
    return Icons[iconName] || Icons.LayoutDashboard;
  };

  const visibleMenus = menus.filter((item) => {
    const modCode = item.module_code || 'dashboard';
    if (isSuperAdmin || modCode === 'user_page' || modCode === 'dashboard') return true;
    return !hasPermission || hasPermission(modCode);
  });
  const visibleIds = new Set(visibleMenus.map((item) => item.id));
  const flattenBranch = (parentId = null, depth = 0) => visibleMenus
    .filter((item) => {
      const parent = item.parent_menu || null;
      return parentId === null ? (!parent || !visibleIds.has(parent)) : parent === parentId;
    })
    .flatMap((item) => [{ ...item, depth }, ...flattenBranch(item.id, depth + 1)]);
  const menuTree = flattenBranch();

  useEffect(() => {
    const toggle = () => setMobileOpen((open) => !open);
    window.addEventListener('erp_toggle_sidebar', toggle);
    return () => window.removeEventListener('erp_toggle_sidebar', toggle);
  }, []);

  return (
    <>
    {mobileOpen && <button type="button" className="sidebar-mobile-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          {theme?.logo_text || 'E3'}
        </div>
        <div className="overflow-hidden min-w-0">
          <h1 className="sidebar-title truncate">
            {theme?.application_name || 'ERP v3'}
          </h1>
          <p className="sidebar-subtitle truncate">Enterprise System</p>
        </div>
      </div>

      {/* Dynamic Navigation Links */}
      <nav className="sidebar-nav custom-scrollbar">
        {!loading && menus.length === 0 && (
          <p className="px-3 py-4 text-xs text-slate-400">No menus are enabled by the administrator.</p>
        )}
        {menuTree.map((item) => {
          const IconComponent = getIconComponent(item.menu_icon);
          return (
            <NavLink
              key={item.menu_path || item.id}
              to={item.menu_path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={{ paddingLeft: `${12 + Math.min(item.depth, 3) * 18}px` }}
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
    </>
  );
}
