import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Bell, LogOut } from 'lucide-react';
import Breadcrumb from './ui/Breadcrumb';

export default function Navbar({ title: defaultTitle }) {
  const { user, isSuperAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [navbarConfig, setNavbarConfig] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const pageKey = location.pathname === '/' ? 'dashboard' : location.pathname.replace('/', '');

    axios.get(`http://127.0.0.1:8000/api/core/ui-navbars/?page_name=${pageKey}`)
      .then((res) => {
        if (!isMounted) return;
        const results = res.data?.results || res.data || [];
        if (results.length > 0) {
          setNavbarConfig(results[0]);
        } else {
          setNavbarConfig(null);
        }
      })
      .catch(() => {
        if (isMounted) setNavbarConfig(null);
      });

    return () => { isMounted = false; };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || (isSuperAdmin ? 'System Super Administrator' : 'Enterprise User');
  const roleTitle = isSuperAdmin ? 'Super Administrator' : (user?.role || 'System User');
  const avatarText = isSuperAdmin ? 'SA' : (user?.name ? user.name.slice(0, 2).toUpperCase() : 'EU');

  return (
    <header className="navbar">
      {/* Left Area: Contextual Breadcrumb */}
      <div className="navbar-left">
        <Breadcrumb />
      </div>

      {/* Right Area: Notification + User Profile & Logout */}
      <div className="navbar-right">
        {/* Notification Button */}
        {(navbarConfig?.show_notification !== false) && (
          <button
            type="button"
            className="navbar-notification-btn"
            title="Notifications"
          >
            <Bell style={{ width: 16, height: 16 }} />
            <span className="navbar-notification-dot"></span>
          </button>
        )}

        {/* User Profile & Logout */}
        {(navbarConfig?.show_profile !== false) && (
          <div className="navbar-user-container">
            {/* Avatar & User Name */}
            <div className="navbar-user-card">
              <div className="navbar-avatar">
                {avatarText}
              </div>
              <div className="navbar-user-details">
                <span className="navbar-user-name">
                  {displayName}
                </span>
                <span className="navbar-user-role">
                  {roleTitle}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="navbar-logout-button"
              title="Logout of ERP"
            >
              <LogOut style={{ width: 15, height: 15 }} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

