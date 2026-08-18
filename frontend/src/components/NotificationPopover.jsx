import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, ShieldAlert, GitPullRequest, Cpu, Database, CheckCircle2, ArrowRight } from 'lucide-react';
import { NotificationAPI } from '../api';

export default function NotificationPopover() {
  const navigate = useNavigate();
  const popoverRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'workflow' | 'system'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s poll
    window.addEventListener('erp_notification_updated', fetchNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('erp_notification_updated', fetchNotifications);
    };
  }, []);

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

  async function fetchNotifications() {
    try {
      setLoading(true);
      const res = await NotificationAPI.getNotifications();
      const list = res.data?.results || res.data || [];
      setNotifications(list);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await NotificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleNotificationClick = async (item) => {
    if (!item.is_read) {
      try {
        await NotificationAPI.markRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }
    setIsOpen(false);

    // Route dynamically based on category
    const cat = String(item.category || '').toUpperCase();
    if (cat.includes('WORKFLOW') || cat.includes('APPROVAL') || cat.includes('RESTOCK')) {
      navigate('/workflow-approvals');
    } else if (cat.includes('PROCESS') || cat.includes('EXECUTION')) {
      navigate('/process-engine');
    } else if (cat.includes('MASTER') || cat.includes('EAV')) {
      navigate('/dynamic-masters');
    } else if (cat.includes('STOCK') || cat.includes('JOURNAL') || cat.includes('INVENTORY')) {
      navigate('/journal-stock');
    } else {
      navigate('/');
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const date = new Date(timestamp);
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return `${Math.floor(diffSecs / 86400)}d ago`;
  };

  const getCategoryBadge = (categoryStr) => {
    const cat = String(categoryStr || '').toUpperCase();
    if (cat.includes('WORKFLOW') || cat.includes('APPROVAL') || cat.includes('RESTOCK')) {
      return <span style={{ backgroundColor: '#EFF6FF', color: '#1B4E9B', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><GitPullRequest style={{ width: 12, height: 12 }} /> Workflow</span>;
    }
    if (cat.includes('PROCESS') || cat.includes('EXECUTION')) {
      return <span style={{ backgroundColor: '#F3E8FF', color: '#7E22CE', border: '1px solid #E9D5FF', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Cpu style={{ width: 12, height: 12 }} /> Process</span>;
    }
    if (cat.includes('MASTER') || cat.includes('EAV')) {
      return <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Database style={{ width: 12, height: 12 }} /> Masters</span>;
    }
    return <span style={{ backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ShieldAlert style={{ width: 12, height: 12 }} /> System</span>;
  };

  const filteredList = notifications.filter((item) => {
    if (activeFilter === 'unread') return !item.is_read;
    if (activeFilter === 'workflow') return String(item.category || '').toUpperCase().includes('WORKFLOW') || String(item.category || '').toUpperCase().includes('APPROVAL') || String(item.category || '').toUpperCase().includes('RESTOCK');
    if (activeFilter === 'system') return !String(item.category || '').toUpperCase().includes('WORKFLOW');
    return true;
  });

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="navbar-notification-btn"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          backgroundColor: isOpen ? '#EAF1FB' : 'var(--surface-muted, #F8FAFC)',
          border: '1px solid var(--navbar-border, #E2E8F0)',
          color: isOpen ? '#1B4E9B' : '#475569',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        title="Notifications Feed"
      >
        <Bell style={{ width: 18, height: 18 }} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: '800',
              padding: '1px 5px',
              borderRadius: '999px',
              border: '2px solid #FFFFFF',
              boxShadow: '0 2px 5px rgba(220,38,38,0.4)',
              lineHeight: 1.2,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* High-Contrast Clean Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '380px',
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
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell style={{ width: 16, height: 16, color: '#1B4E9B' }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Notifications Feed
              </span>
              {unreadCount > 0 && (
                <span style={{ backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '999px' }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  backgroundColor: '#EFF6FF',
                  color: '#1B4E9B',
                  border: '1px solid #BFDBFE',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <CheckCheck style={{ width: 13, height: 13 }} /> Mark all read
              </button>
            )}
          </div>

          {/* Filter Pills Bar */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {['all', 'unread', 'workflow', 'system'].map((filterKey) => {
              const active = activeFilter === filterKey;
              return (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setActiveFilter(filterKey)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: active ? '700' : '600',
                    textTransform: 'capitalize',
                    border: active ? '1px solid #1B4E9B' : '1px solid #E2E8F0',
                    backgroundColor: active ? '#1B4E9B' : '#F8FAFC',
                    color: active ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {filterKey}
                </button>
              );
            })}
          </div>

          {/* Feed List Container */}
          <div
            style={{
              maxHeight: '320px',
              overflowY: 'auto',
              backgroundColor: '#FFFFFF',
            }}
          >
            {filteredList.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8' }}>
                <CheckCircle2 style={{ width: 32, height: 32, margin: '0 auto 8px', color: '#CBD5E1' }} />
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#334155', margin: 0 }}>All Caught Up!</p>
                <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0' }}>No active notifications in this view.</p>
              </div>
            ) : (
              filteredList.map((item) => {
                const unread = !item.is_read;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #F1F5F9',
                      backgroundColor: unread ? '#F8FAFC' : '#FFFFFF',
                      borderLeft: unread ? '4px solid #1B4E9B' : '4px solid transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = unread ? '#EFF6FF' : '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = unread ? '#F8FAFC' : '#FFFFFF')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', width: '100%' }}>
                      <div style={{ flex: 1 }}>{getCategoryBadge(item.category)}</div>
                      <span style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock style={{ width: 11, height: 11 }} /> {formatRelativeTime(item.created_at)}
                      </span>
                    </div>

                    <p style={{ fontSize: '12px', fontWeight: unread ? '700' : '600', color: unread ? '#0F172A' : '#334155', margin: '2px 0 0', lineHeight: 1.3 }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Link */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => { setIsOpen(false); navigate('/workflow-approvals'); }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#1B4E9B',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View All Approvals & Triggers <ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
