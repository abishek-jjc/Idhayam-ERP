import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, Settings, Key, Sliders, Palette, ChevronDown, CheckCircle2, User, Building, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserProfilePopover() {
  const { user, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const popoverRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  const displayName = user?.name || (isSuperAdmin ? 'System Super Administrator' : 'Enterprise User');
  const roleTitle = isSuperAdmin ? 'Super Administrator' : (user?.role || 'System User');
  const avatarText = isSuperAdmin ? 'SA' : (user?.name ? user.name.slice(0, 2).toUpperCase() : 'EU');
  const emailText = user?.email || (isSuperAdmin ? 'superadmin@idhayam.com' : 'user@idhayam.com');

  const navTo = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      {/* Navbar User Card Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 12px 4px 4px',
          backgroundColor: isOpen ? '#EAF1FB' : 'var(--surface-muted, #F8FAFC)',
          border: isOpen ? '1px solid #BFDBFE' : '1px solid var(--navbar-border, #E2E8F0)',
          borderRadius: '9999px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        title="Super Admin Profile Menu"
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1B4E9B 0%, #2563EB 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '12px',
            boxShadow: '0 2px 4px rgba(27, 78, 155, 0.2)',
          }}
        >
          {avatarText}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--navbar-text, #0F172A)' }}>
            {displayName}
          </span>
          <span style={{ fontSize: '10px', fontWeight: '600', color: '#1B4E9B' }}>
            {roleTitle}
          </span>
        </div>
        <ChevronDown style={{ width: 14, height: 14, color: '#64748B', transition: 'transform 0.15s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {/* Profile Menu Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '320px',
            maxWidth: 'calc(100vw - 24px)',
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.18), 0 4px 15px rgba(0, 0, 0, 0.05)',
            zIndex: 9999,
            overflow: 'hidden',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Super Admin Header Banner */}
          <div
            style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              borderBottom: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1B4E9B 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '16px',
                boxShadow: '0 4px 10px rgba(27, 78, 155, 0.3)',
              }}
            >
              {avatarText}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </span>
                <CheckCircle2 style={{ width: 14, height: 14, color: '#16A34A', flexShrink: 0 }} />
              </div>
              <p style={{ fontSize: '11px', color: '#1B4E9B', fontWeight: '700', margin: '2px 0 0' }}>
                {roleTitle}
              </p>
              <p style={{ fontSize: '10px', color: '#64748B', margin: '2px 0 0', fontFamily: 'monospace' }}>
                {emailText}
              </p>
            </div>
          </div>

          {/* Access Badges & System Scope */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', items: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Access & Scope
              </span>
              <span style={{ backgroundColor: '#DCFCE7', color: '#16A34A', border: '1px solid #BBF7D0', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800' }}>
                Root SuperAdmin
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck style={{ width: 14, height: 14, color: '#16A34A' }} />
                <span>Full System Permissions (Bypass RLS)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building style={{ width: 14, height: 14, color: '#1B4E9B' }} />
                <span>All Facilities & Operating Plants</span>
              </div>
            </div>
          </div>

          {/* Quick System Links */}
          <div style={{ padding: '8px 6px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#FFFFFF' }}>
            <div style={{ padding: '4px 10px', fontSize: '10px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick System Shortcuts
            </div>

            <button
              type="button"
              onClick={() => navTo('/admin-console')}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#334155',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Settings style={{ width: 15, height: 15, color: '#1B4E9B' }} />
              <span>Admin Console Studio</span>
            </button>

            <button
              type="button"
              onClick={() => navTo('/permission-mapping')}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#334155',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Key style={{ width: 15, height: 15, color: '#2563EB' }} />
              <span>Permission Mapping & Roles</span>
            </button>

            <button
              type="button"
              onClick={() => navTo('/modal-designer')}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#334155',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Sliders style={{ width: 15, height: 15, color: '#7E22CE' }} />
              <span>Modal Designer & Forms</span>
            </button>

            <button
              type="button"
              onClick={() => navTo('/theme-management')}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#334155',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Palette style={{ width: 15, height: 15, color: '#059669' }} />
              <span>Theme & UI Preferences</span>
            </button>
          </div>

          {/* Logout Action Footer */}
          <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC' }}>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #FECACA',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FCA5A5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
            >
              <LogOut style={{ width: 15, height: 15 }} />
              <span>Logout of ERP Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
