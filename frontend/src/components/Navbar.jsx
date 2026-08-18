import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, X, Database, Loader2, Menu } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConfiguration } from '../context/ConfigurationContext';
import Breadcrumb from './ui/Breadcrumb';
import { CoreAPI } from '../api';
import NotificationPopover from './NotificationPopover';
import UserProfilePopover from './UserProfilePopover';

export default function Navbar() {
  const { user, isSuperAdmin, hasPermission, logout } = useAuth();
  const { menus, getNavbar } = useConfiguration();
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [recordResults, setRecordResults] = useState([]);
  const [searchingRecords, setSearchingRecords] = useState(false);

  const activeMenu = menus.find((item) => item.menu_path === location.pathname);
  const pathKey = location.pathname === '/' ? 'dashboard' : location.pathname.slice(1);
  const navbarConfig = getNavbar(activeMenu?.module_code || pathKey) || getNavbar(pathKey);

  const permittedMenus = useMemo(() => menus.filter((item) => {
    if (isSuperAdmin || item.module_code === 'dashboard' || item.module_code === 'user_page') return true;
    return hasPermission(item.module_code);
  }), [hasPermission, isSuperAdmin, menus]);

  const pageResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return permittedMenus.slice(0, 7);
    return permittedMenus.filter((item) =>
      [item.menu_name, item.module_code, item.menu_path]
        .some((value) => String(value || '').toLowerCase().includes(term))
    ).slice(0, 7);
  }, [permittedMenus, query]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setRecordResults([]);
      setSearchingRecords(false);
      return undefined;
    }
    let cancelled = false;
    setSearchingRecords(true);
    const timer = window.setTimeout(() => {
      CoreAPI.globalSearch(term, 20)
        .then((response) => {
          if (!cancelled) setRecordResults(response.data?.results || []);
        })
        .catch(() => {
          if (!cancelled) setRecordResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearchingRecords(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const closeSearch = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', closeSearch);
    return () => document.removeEventListener('mousedown', closeSearch);
  }, []);

  const openResult = (path) => {
    navigate(path);
    setQuery('');
    setSearchOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || (isSuperAdmin ? 'System Super Administrator' : 'Enterprise User');
  const roleTitle = isSuperAdmin ? 'Super Administrator' : (user?.role || 'System User');
  const avatarText = isSuperAdmin ? 'SA' : (user?.name ? user.name.slice(0, 2).toUpperCase() : 'EU');

  return (
    <header className="navbar">
      <button type="button" className="navbar-mobile-menu" onClick={() => window.dispatchEvent(new Event('erp_toggle_sidebar'))} aria-label="Open navigation"><Menu /></button>
      <div className="navbar-left">
        <Breadcrumb />
        {navbarConfig?.title && <span className="navbar-config-title">{navbarConfig.title}</span>}
      </div>

      {(navbarConfig?.show_search !== false) && (
        <div className="navbar-global-search" ref={searchRef}>
          <Search className="navbar-search-icon" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && recordResults[0]) openResult(recordResults[0].route);
              else if (event.key === 'Enter' && pageResults[0]) openResult(pageResults[0].menu_path);
              if (event.key === 'Escape') setSearchOpen(false);
            }}
            placeholder="Search records, IDs, names, codes..."
            aria-label="Search ERP records and pages"
          />
          {query && (
            <button type="button" className="navbar-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
              <X aria-hidden="true" />
            </button>
          )}
          {searchOpen && (
            <div className="navbar-search-results">
              {query && <div className="navbar-search-heading">Actual ERP records</div>}
              {searchingRecords && (
                <p className="navbar-search-empty"><Loader2 className="inline-block w-4 h-4 animate-spin mr-2" />Searching database...</p>
              )}
              {!searchingRecords && recordResults.map((result) => (
                <button type="button" className="navbar-record-result" key={`${result.entity}-${result.record_id}`} onClick={() => openResult(result.route)}>
                  <Database aria-hidden="true" />
                  <span>
                    <strong>{result.display_name}</strong>
                    <small>{result.entity} • {result.record_id} • matched {result.matched_field}</small>
                    {result.description && <em>{result.description}</em>}
                  </span>
                  {result.status ? <b>{result.status}</b> : <ArrowRight className="navbar-search-arrow" aria-hidden="true" />}
                </button>
              ))}
              <div className="navbar-search-heading">{query ? 'Matching ERP pages' : 'ERP pages'}</div>
              {pageResults.map((item) => {
                const Icon = Icons[item.menu_icon] || Search;
                return (
                  <button type="button" key={item.id || item.menu_path} onClick={() => openResult(item.menu_path)}>
                    <Icon aria-hidden="true" />
                    <span><strong>{item.menu_name}</strong><small>{item.menu_path}</small></span>
                    <ArrowRight className="navbar-search-arrow" aria-hidden="true" />
                  </button>
                );
              })}
              {!searchingRecords && recordResults.length === 0 && pageResults.length === 0 && query.length >= 2 && (
                <p className="navbar-search-empty">No permitted ERP record or page matches “{query}”.</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="navbar-right">
        {(navbarConfig?.show_notification !== false) && (
          <NotificationPopover />
        )}
        {(navbarConfig?.show_profile !== false) && (
          <UserProfilePopover />
        )}
      </div>
    </header>
  );
}
