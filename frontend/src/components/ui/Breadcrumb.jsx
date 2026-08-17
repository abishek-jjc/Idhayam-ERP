import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useConfiguration } from '../../context/ConfigurationContext';

export default function Breadcrumb({ items = [] }) {
  const location = useLocation();
  const { menus } = useConfiguration();

  // Generate breadcrumb items automatically if not provided
  let routeItems = items;
  if (!items || items.length === 0) {
    const path = location.pathname;
    const currentMenu = menus.find((menu) => menu.menu_path === path);
    const parentMenu = currentMenu?.parent_menu
      ? menus.find((menu) => menu.id === currentMenu.parent_menu)
      : null;
    routeItems = currentMenu
      ? [
          ...(parentMenu ? [{ label: parentMenu.menu_name, path: parentMenu.menu_path }] : []),
          { label: currentMenu.menu_name, path: currentMenu.menu_path },
        ]
      : [{ label: path === '/' ? 'ERP Home' : 'ERP System', path: '/' }];
  }

  return (
    <nav className="breadcrumb-nav">
      {routeItems.map((item, idx) => {
        const isLast = idx === routeItems.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="breadcrumb-separator" />}
            {isLast ? (
              <span className="breadcrumb-active">{item.label}</span>
            ) : item.path && item.path !== '#' ? (
              <Link to={item.path} className="breadcrumb-link">
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
