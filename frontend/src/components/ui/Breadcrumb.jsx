import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
  const location = useLocation();

  // Generate breadcrumb items automatically if not provided
  let routeItems = items;
  if (!items || items.length === 0) {
    const path = location.pathname;
    if (path === '/') {
      routeItems = [{ label: 'Executive Overview', path: '/' }];
    } else if (path === '/user') {
      routeItems = [{ label: 'User Portal', path: '/user' }];
    } else if (path === '/admin-console') {
      routeItems = [{ label: 'Admin Console', path: '/admin-console' }];
    } else if (path === '/structural-masters') {
      routeItems = [{ label: 'Masters', path: '#' }, { label: 'Structural Masters', path: '/structural-masters' }];
    } else if (path === '/dynamic-masters') {
      routeItems = [{ label: 'Dynamic Masters', path: '#' }, { label: 'Master Data & EAV Studio', path: '/dynamic-masters' }];
    } else if (path === '/process-engine') {
      routeItems = [{ label: 'Process Engine', path: '#' }, { label: 'Generic Processes', path: '/process-engine' }];
    } else if (path === '/process-links') {
      routeItems = [{ label: 'Process Engine', path: '/process-engine' }, { label: 'Process Links', path: '/process-links' }];
    } else if (path === '/process-attribute-values') {
      routeItems = [{ label: 'Process Engine', path: '/process-engine' }, { label: 'Process Attribute Values', path: '/process-attribute-values' }];
    } else if (path === '/workflow-approvals') {
      routeItems = [{ label: 'Workflow Engine', path: '#' }, { label: 'Approvals & Quotations', path: '/workflow-approvals' }];
    } else if (path === '/journal-stock') {
      routeItems = [{ label: 'Finance & Stock', path: '#' }, { label: 'Movement Journal & Ledger', path: '/journal-stock' }];
    } else {
      routeItems = [{ label: 'ERP System', path: '/' }];
    }
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
