import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, Shield, Zap, Sparkles, LogOut, X } from 'lucide-react';
import axios from 'axios';

export default function Navbar({ title: propTitle }) {
  const { user, designation, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [navConfig, setNavConfig] = useState({
    title: propTitle || 'ERP v3 Enterprise Workspace',
    show_search: true,
    show_notification: true,
    show_profile: true,
    show_logout: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const routeKey = location.pathname.replace('/', '') || 'dashboard';
    axios.get(`http://127.0.0.1:8000/api/core/ui-navbars/?page_name=${routeKey}`)
      .then(res => {
        const item = res.data?.results?.[0] || res.data?.[0];
        if (item) {
          setNavConfig({
            title: item.title || propTitle || 'ERP v3 Enterprise Workspace',
            show_search: item.show_search !== false,
            show_notification: item.show_notification !== false,
            show_profile: item.show_profile !== false,
            show_logout: item.show_logout !== false,
          });
        }
      })
      .catch(() => {
        // Fallback default
      });
  }, [location.pathname, propTitle]);

  useEffect(() => {
    // Fetch notifications center data
    axios.get('http://127.0.0.1:8000/api/notifications/notifications/')
      .then(res => {
        const notifs = res.data?.results || res.data || [];
        setNotifications(notifs.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGlobalSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/admin-console?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20 flex items-center justify-between px-6 w-full">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">{navConfig.title}</h2>
        <span className="badge badge-active flex items-center gap-1 text-[10px] py-0.5 px-2">
          <Zap className="w-3 h-3 fill-current text-emerald-400" /> Live Platform
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search Bar */}
        {navConfig.show_search && (
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleGlobalSearch}
              placeholder="Global Search (Press Enter)..."
              className="bg-slate-950/60 border border-white/10 text-xs text-white rounded-xl pl-9 pr-4 py-2 w-56 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500"
            />
          </div>
        )}

        {/* Notifications Center Toggle */}
        {navConfig.show_notification && (
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all relative"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping"></span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Notification Center</h4>
                  <button onClick={() => setNotificationsOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 mt-3 max-h-60 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No new system alerts.</p>
                  ) : (
                    notifications.map((n, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-800/40 border border-white/5 text-xs text-slate-300">
                        <p className="font-semibold text-white">{n.title || n.message || 'System Notification'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{n.created_at?.slice(0,10) || 'Just now'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Profile Tag */}
        {navConfig.show_profile && (
          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-white font-extrabold text-xs">
                {isSuperAdmin ? 'SA' : (designation?.title?.[0] || 'U')}
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white">{user?.name || 'Guest Operator'}</p>
                {isSuperAdmin && <Shield className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />}
              </div>
              <p className="text-[10px] text-indigo-400 font-mono font-semibold">
                {isSuperAdmin ? 'Super Administrator' : (designation?.title || 'Designation User')}
              </p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        {navConfig.show_logout && (
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center gap-1 text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
