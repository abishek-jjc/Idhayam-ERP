import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RotateCcw, History, Check, Clock, AlertCircle, Eye } from 'lucide-react';
import Modal from '../Modal';

const API = 'http://127.0.0.1:8000/api/core';
const CONFIG_TYPES = ['menu', 'navbar', 'theme', 'form', 'form_field', 'modal', 'widget', 'dashboard_layout', 'search'];

export default function VersionRollbackManager({ configType = 'menu', onItemRestored }) {
  const [activeType, setActiveType] = useState(configType);
  const [itemFilter, setItemFilter] = useState('');
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [msg, setMsg] = useState(null);

  const loadVersions = () => {
    setLoading(true);
    const params = new URLSearchParams({ config_type: activeType });
    if (itemFilter) params.set('item_id', itemFilter);
    axios.get(`${API}/ui-config-versions/?${params}`).then((response) => setVersions(response.data?.results || response.data || [])).finally(() => setLoading(false));
  };

  useEffect(loadVersions, [activeType, itemFilter]);

  const rollback = async () => {
    if (!selectedVersion) return;
    setRestoring(true);
    setMsg(null);
    try {
      const response = await axios.post(`${API}/ui-config-rollback/`, { version_id: selectedVersion.id });
      setMsg({ type: 'success', text: response.data.message });
      setSelectedVersion(null);
      window.dispatchEvent(new Event('erp_ui_metadata_updated'));
      window.dispatchEvent(new Event('erp_theme_updated'));
      onItemRestored?.();
      loadVersions();
    } catch (error) {
      setMsg({ type: 'error', text: error.response?.data?.error || 'Failed to roll back this configuration.' });
    } finally { setRestoring(false); }
  };

  const itemOptions = [...new Map(versions.map((version) => [version.item_id, version])).values()].filter((version) => version.item_id);
  return <div className="space-y-5">
    <div className="standard-card version-toolbar">
      <div><p className="workspace-kicker">Configuration governance</p><h3 className="section-title flex items-center gap-2 mt-2"><History className="w-5 h-5 text-[var(--primary)]" /> Version History</h3><p className="helper-text mt-1">Every item has an independent version sequence. Rollbacks snapshot the current state first, so every restore remains reversible.</p></div>
      <div className="version-current"><small>Latest version</small><strong>{versions[0] ? `v${versions[0].version_number}` : '—'}</strong><span>{versions[0]?.item_name || 'No snapshot selected'}</span></div>
      <div className="version-filters"><div><label className="form-label">Configuration type</label><select className="form-input min-w-44" value={activeType} onChange={(e) => { setActiveType(e.target.value); setItemFilter(''); }}>{CONFIG_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}</select></div><div><label className="form-label">Item</label><select className="form-input min-w-52" value={itemFilter} onChange={(e) => setItemFilter(e.target.value)}><option value="">All items</option>{itemOptions.map((version) => <option key={version.item_id} value={version.item_id}>{version.item_name || version.item_id}</option>)}</select></div></div>
    </div>
    {msg && <div className={`standard-card flex items-center gap-2 ${msg.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>{msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{msg.text}</div>}
    <div className="table-container overflow-x-auto"><table className="custom-table"><thead><tr><th>Version</th><th>Item</th><th>Description</th><th>Created</th><th>Administrator</th><th className="text-right">Review</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="text-center">Loading snapshots...</td></tr> : versions.length === 0 ? <tr><td colSpan="6" className="text-center">No snapshots for this selection.</td></tr> : versions.map((version) => <tr key={version.id}><td className="font-mono font-bold">v{version.version_number}</td><td>{version.item_name || version.item_id || 'Legacy snapshot'}</td><td>{version.description}</td><td><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(version.created_at).toLocaleString()}</span></td><td>{version.created_by_name}</td><td className="text-right"><button className="btn-action-view" onClick={() => setSelectedVersion(version)}><Eye className="w-3 h-3" /> Compare & Restore</button></td></tr>)}</tbody></table></div>
    <Modal isOpen={!!selectedVersion} onClose={() => setSelectedVersion(null)} size="lg" title={`Confirm rollback to v${selectedVersion?.version_number || ''}`}>
      <div className="space-y-4"><div className="p-3 rounded-lg border border-[var(--warning)] bg-[var(--table-header)] text-xs"><strong>Impact:</strong> this restores the selected item only. The current state is snapshotted first, making the operation reversible.</div><div><h4 className="form-label">Target snapshot — {selectedVersion?.item_name || selectedVersion?.item_id}</h4><pre className="p-3 max-h-80 overflow-auto rounded-lg bg-[var(--table-header)] border border-[var(--theme-border)] text-[11px]">{JSON.stringify(selectedVersion?.snapshot_data || {}, null, 2)}</pre></div><div className="modal-footer"><button className="btn-secondary" onClick={() => setSelectedVersion(null)}>Cancel</button><button className="btn-primary" disabled={restoring} onClick={rollback}><RotateCcw className="w-4 h-4" /> {restoring ? 'Restoring...' : 'Confirm Rollback'}</button></div></div>
    </Modal>
  </div>;
}
