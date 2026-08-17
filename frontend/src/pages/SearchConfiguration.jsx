import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Search, Plus, Edit3, Eye, EyeOff, Trash2, Database, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import WhereUsedModal from '../components/ui/WhereUsedModal';

const API = 'http://127.0.0.1:8000/api/core';
const ENTITY_OPTIONS = {
  'core.Company': { label: 'Companies', module: 'structural_masters', route: '/structural-masters', fields: ['id', 'name', 'gst_number', 'remarks'] },
  'core.Employee': { label: 'Employees', module: 'structural_masters', route: '/structural-masters', fields: ['id', 'name', 'status', 'user_account_id', 'designation__title', 'department__name'] },
  'core.Vendor': { label: 'Vendors', module: 'structural_masters', route: '/structural-masters', fields: ['id', 'name', 'gst_number', 'remarks'] },
  'core.Machine': { label: 'Machines', module: 'structural_masters', route: '/structural-masters', fields: ['id', 'code', 'name', 'registration_number', 'status'] },
  'core.StorageLocation': { label: 'Storage Locations', module: 'structural_masters', route: '/structural-masters', fields: ['id', 'code', 'name', 'status', 'department__name'] },
  'core.ChartOfAccount': { label: 'Chart of Accounts', module: 'structural_masters', route: '/structural-masters', fields: ['id', 'code', 'name', 'account_type'] },
  'masters.MasterCategory': { label: 'Master Categories', module: 'dynamic_masters', route: '/dynamic-masters', fields: ['id', 'code', 'name', 'remarks'] },
  'masters.MasterItem': { label: 'Products / Master Items', module: 'dynamic_masters', route: '/dynamic-masters', fields: ['id', 'code', 'name', 'category__name', 'remarks'] },
  'process_engine.ProcessType': { label: 'Process Types', module: 'process_engine', route: '/process-engine', fields: ['id', 'code', 'name', 'category', 'remarks'] },
  'process_engine.ProcessInstance': { label: 'Process Executions', module: 'process_engine', route: '/process-engine', fields: ['id', 'status', 'remarks', 'process_type__name', 'process_type__code'] },
  'workflow.Proposal': { label: 'Workflow Proposals', module: 'workflow', route: '/workflow-approvals', fields: ['id', 'status', 'remarks', 'requested_by__name', 'process_instance__id'] },
  'journal.JournalEntry': { label: 'Journal Entries', module: 'journal', route: '/journal-stock', fields: ['id', 'material_id', 'movement_type', 'entry_date', 'remarks', 'vendor__name'] },
  'journal.Stock': { label: 'Stock Ledger', module: 'journal', route: '/journal-stock', fields: ['id', 'material_id', 'stock_status', 'quantity', 'unit_id', 'storage_location__code'] },
};

const initialForm = () => {
  const model_label = 'core.Employee';
  const entity = ENTITY_OPTIONS[model_label];
  return {
    entity_key: 'employees', display_name: entity.label, module: entity.module, model_label,
    searchable_fields: entity.fields, display_fields: ['name', 'id'], status_field: 'status',
    route: entity.route, result_priority: 10, result_limit: 10, match_mode: 'contains', active: true, roles: [],
  };
};

export default function SearchConfiguration() {
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm());
  const [impact, setImpact] = useState({ isOpen: false, itemId: '', itemName: '' });
  const selectedEntity = ENTITY_OPTIONS[form.model_label];

  const load = () => Promise.all([
    axios.get(`${API}/ui-search-configurations/`),
    axios.get(`${API}/roles/`),
  ]).then(([configResponse, roleResponse]) => {
    setItems(configResponse.data?.results || configResponse.data || []);
    setRoles(roleResponse.data?.results || roleResponse.data || []);
  });

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditingId(null); setForm(initialForm()); setModalOpen(true); };
  const openEdit = (item) => { setEditingId(item.id); setForm({ ...item, roles: item.roles || [] }); setModalOpen(true); };
  const selectEntity = (modelLabel) => {
    const entity = ENTITY_OPTIONS[modelLabel];
    setForm((current) => ({
      ...current, model_label: modelLabel,
      entity_key: modelLabel.replace('.', '_').toLowerCase(), display_name: entity.label,
      module: entity.module, route: entity.route, searchable_fields: entity.fields,
      display_fields: entity.fields.slice(0, 2), status_field: entity.fields.includes('status') ? 'status' : entity.fields.includes('stock_status') ? 'stock_status' : '',
    }));
  };
  const toggleField = (key, field) => setForm((current) => ({
    ...current,
    [key]: current[key].includes(field) ? current[key].filter((value) => value !== field) : [...current[key], field],
  }));
  const submit = async (event) => {
    event.preventDefault();
    if (editingId) await axios.put(`${API}/ui-search-configurations/${editingId}/`, form);
    else await axios.post(`${API}/ui-search-configurations/`, form);
    window.dispatchEvent(new Event('erp_ui_metadata_updated'));
    setModalOpen(false);
    load();
  };
  const toggle = async (item) => {
    await axios.patch(`${API}/ui-search-configurations/${item.id}/`, { active: !item.active });
    window.dispatchEvent(new Event('erp_ui_metadata_updated'));
    load();
  };
  const remove = async (item) => {
    if (!window.confirm(`Delete search configuration '${item.display_name}'?`)) return;
    await axios.delete(`${API}/ui-search-configurations/${item.id}/`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="standard-card flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="page-title flex items-center gap-2"><Search className="w-5 h-5" /> Global Record Search Configuration</h2><p className="text-xs text-[var(--text-secondary)] mt-1">Select the real database entities, fields, priorities, limits and roles available in the top search bar.</p></div>
        <div className="flex gap-2"><button className="btn-secondary" onClick={load}><RefreshCw className="w-4 h-4" /> Refresh</button><button className="btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Search Entity</button></div>
      </div>
      <div className="table-container overflow-x-auto">
        <table className="custom-table"><thead><tr><th>Entity</th><th>Module</th><th>Search Fields</th><th>Match</th><th>Priority</th><th>Roles</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
          <tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.display_name}</strong><small className="block font-mono text-[10px] text-[var(--text-secondary)]">{item.model_label}</small></td><td>{item.module}</td><td className="max-w-xs text-xs">{(item.searchable_fields || []).join(', ')}</td><td>{item.match_mode}</td><td>{item.result_priority}</td><td>{item.role_names?.join(', ') || 'All permitted roles'}</td><td><button onClick={() => toggle(item)} className={`badge ${item.active ? 'badge-success' : 'badge-neutral'}`}>{item.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}{item.active ? 'Enabled' : 'Disabled'}</button></td><td><div className="flex justify-end gap-1"><button className="btn-action-view" onClick={() => setImpact({ isOpen: true, itemId: item.id, itemName: item.display_name })}>Impact</button><button className="btn-action-edit" onClick={() => openEdit(item)}><Edit3 className="w-3 h-3" /> Edit</button><button className="btn-action-delete" onClick={() => remove(item)}><Trash2 className="w-3 h-3" /></button></div></td></tr>)}</tbody>
        </table>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="lg" title={editingId ? 'Edit Search Entity' : 'Add Search Entity'}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="form-label">Approved Database Entity</label><select className="form-input" value={form.model_label} onChange={(e) => selectEntity(e.target.value)}>{Object.entries(ENTITY_OPTIONS).map(([value, entity]) => <option key={value} value={value}>{entity.label} — {value}</option>)}</select></div><div><label className="form-label">Result Display Name</label><input className="form-input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} required /></div></div>
          <div><label className="form-label">Searchable Fields</label><div className="grid grid-cols-2 md:grid-cols-3 gap-2">{selectedEntity.fields.map((field) => <label key={field} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.searchable_fields.includes(field)} onChange={() => toggleField('searchable_fields', field)} /> {field}</label>)}</div></div>
          <div><label className="form-label">Display Fields</label><div className="grid grid-cols-2 md:grid-cols-3 gap-2">{selectedEntity.fields.map((field) => <label key={field} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.display_fields.includes(field)} onChange={() => toggleField('display_fields', field)} /> {field}</label>)}</div></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div><label className="form-label">Match Mode</label><select className="form-input" value={form.match_mode} onChange={(e) => setForm({ ...form, match_mode: e.target.value })}><option value="contains">Contains / Partial</option><option value="starts_with">Starts With</option><option value="exact">Exact</option></select></div><div><label className="form-label">Priority</label><input type="number" min="1" className="form-input" value={form.result_priority} onChange={(e) => setForm({ ...form, result_priority: Number(e.target.value) })} /></div><div><label className="form-label">Result Limit</label><input type="number" min="1" max="50" className="form-input" value={form.result_limit} onChange={(e) => setForm({ ...form, result_limit: Number(e.target.value) })} /></div><div><label className="form-label">Status Field</label><select className="form-input" value={form.status_field || ''} onChange={(e) => setForm({ ...form, status_field: e.target.value })}><option value="">None</option>{selectedEntity.fields.map((field) => <option key={field} value={field}>{field}</option>)}</select></div></div>
          <div><label className="form-label">Visible to Roles (empty = all users with module permission)</label><select multiple className="form-input h-28" value={form.roles || []} onChange={(e) => setForm({ ...form, roles: Array.from(e.target.selectedOptions, (option) => option.value) })}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></div>
          <div className="modal-footer"><button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn-primary"><Database className="w-4 h-4" /> Save Search Configuration</button></div>
        </form>
      </Modal>
      <WhereUsedModal isOpen={impact.isOpen} onClose={() => setImpact({ ...impact, isOpen: false })} configType="search" itemId={impact.itemId} itemName={impact.itemName} />
    </div>
  );
}
