import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Calendar, Eye, History, RefreshCw, Search, User } from 'lucide-react';
import Modal from '../Modal';

const API = 'http://127.0.0.1:8000/api/core';
const TYPES = ['menu', 'navbar', 'theme', 'form', 'form_field', 'modal', 'widget', 'dashboard_layout', 'search'];
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'ENABLE', 'DISABLE', 'PUBLISH', 'ROLLBACK'];

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const loadAuditLogs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (typeFilter) params.set('config_type', typeFilter);
    if (actionFilter) params.set('action', actionFilter);
    axios.get(`${API}/ui-audit-logs/?${params}`).then((response) => setLogs(response.data?.results || response.data || [])).finally(() => setLoading(false));
  };
  useEffect(loadAuditLogs, [typeFilter, actionFilter]);

  const users = useMemo(() => [...new Set(logs.map((log) => log.changed_by_name).filter(Boolean))].sort(), [logs]);
  const visibleLogs = logs.filter((log) => (!userFilter || log.changed_by_name === userFilter) && (!dateFilter || new Date(log.timestamp).toISOString().slice(0, 10) === dateFilter));

  return <div className="space-y-5">
    <div className="standard-card audit-toolbar">
      <div><p className="workspace-kicker">Governance</p><h3 className="section-title flex items-center gap-2 mt-2"><History className="w-5 h-5 text-[var(--primary)]" /> Audit History</h3><p className="helper-text mt-1">Review administrator, module, action, request metadata, and exact before/after values.</p></div>
      <form onSubmit={(event) => { event.preventDefault(); loadAuditLogs(); }} className="audit-filter-grid">
        <div><label className="form-label">Search</label><div className="relative"><Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-secondary)]" /><input className="form-input pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Target or user..." /></div></div>
        <div><label className="form-label">User</label><select className="form-input" value={userFilter} onChange={(event) => setUserFilter(event.target.value)}><option value="">All users</option>{users.map((user) => <option key={user}>{user}</option>)}</select></div>
        <div><label className="form-label">Module</label><select className="form-input" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">All modules</option>{TYPES.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}</select></div>
        <div><label className="form-label">Action</label><select className="form-input" value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}><option value="">All actions</option>{ACTIONS.map((action) => <option key={action}>{action}</option>)}</select></div>
        <div><label className="form-label">Date</label><input type="date" className="form-input" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></div>
        <button className="btn-secondary" type="submit" aria-label="Refresh audit log"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
      </form>
    </div>

    <div className="table-container overflow-x-auto"><table className="custom-table"><thead><tr><th>Time</th><th>User</th><th>Module</th><th>Target</th><th>Action</th><th className="text-right">Details</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="text-center">Loading audit history...</td></tr> : visibleLogs.length === 0 ? <tr><td colSpan="6" className="text-center">No matching audit changes.</td></tr> : visibleLogs.map((log) => <tr key={log.id}><td><span className="flex gap-1 items-center whitespace-nowrap"><Calendar className="w-3 h-3" />{new Date(log.timestamp).toLocaleString()}</span></td><td><span className="flex items-center gap-1"><User className="w-3 h-3" />{log.changed_by_name}</span></td><td><span className="badge badge-neutral">{log.config_type}</span><small className="block mt-1">{log.module || 'global'}</small></td><td>{log.item_name || log.item_id}</td><td><span className={`badge ${['DELETE', 'DISABLE'].includes(log.action) ? 'badge-danger' : ['CREATE', 'ENABLE', 'PUBLISH'].includes(log.action) ? 'badge-success' : 'badge-info'}`}>{log.action}</span></td><td className="text-right"><button className="btn-action-view" onClick={() => setSelected(log)}><Eye className="w-3 h-3" /> View details</button></td></tr>)}</tbody></table></div>

    <Modal isOpen={!!selected} onClose={() => setSelected(null)} size="xl" title={`${selected?.action || ''}: ${selected?.item_name || ''}`}><div className="audit-detail"><div className="audit-request-meta"><div><strong>Administrator</strong><p>{selected?.changed_by_name}</p></div><div><strong>IP / Request</strong><p>{selected?.ip_address || '—'} / {selected?.request_id || '—'}</p></div><div><strong>User Agent</strong><p>{selected?.user_agent || '—'}</p></div></div><div className="audit-diff"><div><h4 className="form-label">Before</h4><pre>{JSON.stringify(selected?.old_values || {}, null, 2)}</pre></div><div><h4 className="form-label">After</h4><pre>{JSON.stringify(selected?.new_values || {}, null, 2)}</pre></div></div></div></Modal>
  </div>;
}
