import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutGrid, Plus, Edit3, Trash2, CheckCircle2, RefreshCw, Eye, EyeOff, Network, ArrowUp, ArrowDown, Save } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';
import WhereUsedModal from '../components/ui/WhereUsedModal';

export default function WidgetManagement() {
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState('');
  const [whereUsedState, setWhereUsedState] = useState({ isOpen: false, itemId: '', itemName: '' });
  const [roles, setRoles] = useState([]);
  const [layoutId, setLayoutId] = useState(null);
  const [layout, setLayout] = useState({ layout_name: 'Default Dashboard', role: '', layout_mode: 'grid', desktop_columns: 4, tablet_columns: 2, mobile_columns: 1, row_gap: 16, column_gap: 16, widget_height: 'auto', responsive: true, active: true });

  const [formData, setFormData] = useState({
    widget_name: '',
    widget_type: 'kpi',
    data_source: '',
    module: 'dashboard', permission_module: '', roles: [],
    position: 1,
    grid_width: 'col-span-1',
    height: 'auto', min_width: 1, max_width: 4, collapsible: false, default_collapsed: false,
    refresh_interval: 0,
    active: true,
  });

  const widgetTypes = [
    { code: 'kpi', label: 'KPI Metric Card' },
    { code: 'chart_bar', label: 'Bar Chart' },
    { code: 'chart_pie', label: 'Pie Chart' },
    { code: 'table', label: 'Summary Table' },
    { code: 'list', label: 'Activity List' },
    { code: 'shortcut', label: 'Quick Shortcut' },
  ];

  const fetchWidgets = () => {
    setLoading(true);
    Promise.all([
      axios.get('http://127.0.0.1:8000/api/core/ui-widgets/'),
      axios.get('http://127.0.0.1:8000/api/core/ui-dashboard-layouts/'),
      axios.get('http://127.0.0.1:8000/api/core/roles/'),
    ])
      .then(([widgetResponse, layoutResponse, roleResponse]) => {
        setWidgets(widgetResponse.data?.results || widgetResponse.data || []);
        const layouts = layoutResponse.data?.results || layoutResponse.data || [];
        const globalLayout = layouts.find((item) => !item.role) || layouts[0];
        if (globalLayout) { setLayoutId(globalLayout.id); setLayout({ ...globalLayout, role: globalLayout.role || '' }); }
        setRoles(roleResponse.data?.results || roleResponse.data || []);
      })
      .catch(err => console.error("Error fetching widgets:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWidgets();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      widget_name: '',
      widget_type: 'kpi',
      data_source: '',
      module: 'dashboard', permission_module: '', roles: [],
      position: widgets.length + 1,
      grid_width: 'col-span-1',
      height: 'auto', min_width: 1, max_width: 4, collapsible: false, default_collapsed: false,
      refresh_interval: 0,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      widget_name: item.widget_name,
      widget_type: item.widget_type,
      data_source: item.data_source || '',
      module: item.module || 'dashboard', permission_module: item.permission_module || '', roles: item.roles || [],
      position: item.position || 1,
      grid_width: item.grid_width || 'col-span-1',
      height: item.height || 'auto', min_width: item.min_width || 1, max_width: item.max_width || 4,
      collapsible: item.collapsible || false, default_collapsed: item.default_collapsed || false,
      refresh_interval: item.refresh_interval || 0,
      active: item.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this dashboard widget?")) {
      axios.delete(`http://127.0.0.1:8000/api/core/ui-widgets/${id}/`)
        .then(() => {
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("Widget deleted.");
          fetchWidgets();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Delete failed: " + err.message));
    }
  };

  const handleToggleActive = (w) => {
    axios.patch(`http://127.0.0.1:8000/api/core/ui-widgets/${w.id}/`, {
      active: !w.active
    })
      .then(() => {
        window.dispatchEvent(new Event('erp_ui_metadata_updated'));
        setNotification(`Widget '${w.widget_name}' ${!w.active ? 'Enabled' : 'Disabled'}.`);
        fetchWidgets();
        setTimeout(() => setNotification(''), 3000);
      })
      .catch(err => alert("Toggle failed: " + err.message));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      axios.put(`http://127.0.0.1:8000/api/core/ui-widgets/${editingId}/`, formData)
        .then(() => {
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("Widget updated.");
          setIsModalOpen(false);
          fetchWidgets();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-widgets/', formData)
        .then(() => {
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("New widget created.");
          setIsModalOpen(false);
          fetchWidgets();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Creation failed: " + err.message));
    }
  };

  const saveLayout = async () => {
    const payload = { ...layout, role: layout.role || null };
    if (layoutId) await axios.put(`http://127.0.0.1:8000/api/core/ui-dashboard-layouts/${layoutId}/`, payload);
    else {
      const response = await axios.post('http://127.0.0.1:8000/api/core/ui-dashboard-layouts/', payload);
      setLayoutId(response.data.id);
    }
    window.dispatchEvent(new Event('erp_ui_metadata_updated'));
    setNotification('Dashboard layout applied to the live Executive Dashboard.');
    setTimeout(() => setNotification(''), 3000);
  };

  const moveWidget = async (widget, offset) => {
    const ordered = [...widgets].sort((a, b) => a.position - b.position);
    const index = ordered.findIndex((item) => item.id === widget.id);
    const swap = ordered[index + offset];
    if (!swap) return;
    await Promise.all([
      axios.patch(`http://127.0.0.1:8000/api/core/ui-widgets/${widget.id}/`, { position: swap.position }),
      axios.patch(`http://127.0.0.1:8000/api/core/ui-widgets/${swap.id}/`, { position: widget.position }),
    ]);
    window.dispatchEvent(new Event('erp_ui_metadata_updated'));
    fetchWidgets();
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="standard-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#EFF6FF] text-[#1B4E9B]">
              <LayoutGrid className="w-5 h-5" />
            </span>
            <h1 className="page-title">Dynamic Dashboard Widget Management</h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Configure dynamic executive dashboard widgets (KPI Cards, Metric Charts, Tables, Activity Lists, Quick Shortcuts).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchWidgets} className="btn-secondary">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Widget
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          {notification}
        </div>
      )}

      <div className="standard-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="section-title">Live Dashboard Layout</h2><p className="text-xs text-[var(--text-secondary)]">Controls the real dashboard grid, breakpoints and spacing.</p></div>
          <button type="button" className="btn-primary" onClick={saveLayout}><Save className="w-4 h-4" /> Apply Layout</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="form-label">Layout</label><select className="form-input" value={layout.layout_mode} onChange={(e) => setLayout({ ...layout, layout_mode: e.target.value })}><option value="grid">Grid</option><option value="list">List</option><option value="compact">Compact</option><option value="full_width">Full Width</option></select></div>
          <div><label className="form-label">Desktop Columns</label><input type="number" min="1" max="8" className="form-input" value={layout.desktop_columns} onChange={(e) => setLayout({ ...layout, desktop_columns: Number(e.target.value) })} /></div>
          <div><label className="form-label">Tablet Columns</label><input type="number" min="1" max="6" className="form-input" value={layout.tablet_columns} onChange={(e) => setLayout({ ...layout, tablet_columns: Number(e.target.value) })} /></div>
          <div><label className="form-label">Mobile Columns</label><input type="number" min="1" max="3" className="form-input" value={layout.mobile_columns} onChange={(e) => setLayout({ ...layout, mobile_columns: Number(e.target.value) })} /></div>
          <div><label className="form-label">Row Gap (px)</label><input type="number" min="0" className="form-input" value={layout.row_gap} onChange={(e) => setLayout({ ...layout, row_gap: Number(e.target.value) })} /></div>
          <div><label className="form-label">Column Gap (px)</label><input type="number" min="0" className="form-input" value={layout.column_gap} onChange={(e) => setLayout({ ...layout, column_gap: Number(e.target.value) })} /></div>
          <div><label className="form-label">Default Height</label><input className="form-input" value={layout.widget_height} onChange={(e) => setLayout({ ...layout, widget_height: e.target.value })} placeholder="auto or 240px" /></div>
          <label className="flex items-center gap-2 self-end h-10 text-xs"><input type="checkbox" checked={layout.responsive} onChange={(e) => setLayout({ ...layout, responsive: e.target.checked })} /> Responsive breakpoints</label>
        </div>
      </div>

      {/* Widgets Table */}
      <div className="standard-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonLoader rows={4} columns={6} />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Widget Name</th>
                  <th>Widget Type</th>
                  <th>API Data Source</th>
                  <th>Grid Span</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {widgets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-[#6B7280] italic">
                      No dashboard widgets configured. Click "Add Widget" to set up dashboard metrics.
                    </td>
                  </tr>
                ) : (
                  widgets.map((w) => (
                    <tr key={w.id}>
                      <td><div className="flex items-center gap-1 font-mono font-bold text-[var(--theme-primary)]">#{w.position}<button className="btn-icon" onClick={() => moveWidget(w, -1)} title="Move up"><ArrowUp className="w-3 h-3" /></button><button className="btn-icon" onClick={() => moveWidget(w, 1)} title="Move down"><ArrowDown className="w-3 h-3" /></button></div></td>
                      <td className="font-bold text-[#1F2937]">{w.widget_name}</td>
                      <td>
                        <span className="badge badge-info uppercase">
                          {w.widget_type}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-[#374151] max-w-xs truncate">{w.data_source || 'Default Aggregator'}</td>
                      <td className="font-mono text-[#6B7280]">{w.grid_width}</td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(w)}
                          className={`badge ${w.active ? 'badge-success' : 'badge-danger'} cursor-pointer flex items-center gap-1`}
                        >
                          {w.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {w.active ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setWhereUsedState({ isOpen: true, itemId: w.id, itemName: w.widget_name })}
                            className="btn-action-view"
                            title="View Impact & Where Used"
                          >
                            <Network className="w-3.5 h-3.5" /> Impact
                          </button>
                          <button
                            onClick={() => handleOpenEdit(w)}
                            className="btn-action-edit"
                            title="Edit Widget"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(w.id)}
                            className="btn-action-delete"
                            title="Delete Widget"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md" title={editingId ? "Edit Dashboard Widget" : "Create Dashboard Widget"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Widget Title *</label>
            <input
              type="text"
              value={formData.widget_name}
              onChange={(e) => setFormData({ ...formData, widget_name: e.target.value })}
              className="form-input"
              required
              placeholder="e.g., Active Employees Count"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Widget Type *</label>
              <select
                value={formData.widget_type}
                onChange={(e) => setFormData({ ...formData, widget_type: e.target.value })}
                className="form-input"
                required
              >
                {widgetTypes.map(wt => (
                  <option key={wt.code} value={wt.code}>{wt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Display Position *</label>
              <input
                type="number"
                min="1"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 1 })}
                className="form-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Automatic Refresh Interval (seconds)</label>
            <input
              type="number"
              min="0"
              value={formData.refresh_interval}
              onChange={(e) => setFormData({ ...formData, refresh_interval: Math.max(0, parseInt(e.target.value) || 0) })}
              className="form-input"
              placeholder="0 = refresh only when configuration changes"
            />
            <p className="text-[10px] text-[#6B7280] mt-1">Use 0 to disable automatic polling. Active intervals are applied on the real Executive Dashboard.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Widget Module</label><input className="form-input" value={formData.module} onChange={(e) => setFormData({ ...formData, module: e.target.value })} /></div>
            <div><label className="form-label">Required Permission Module</label><input className="form-input" value={formData.permission_module} onChange={(e) => setFormData({ ...formData, permission_module: e.target.value })} placeholder="Optional" /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Data Source Endpoint</label>
              <input
                type="text"
                value={formData.data_source}
                onChange={(e) => setFormData({ ...formData, data_source: e.target.value })}
                className="form-input"
                placeholder="e.g., /api/core/employees/"
              />
            </div>
            <div>
              <label className="form-label">Grid Width Span</label>
              <select
                value={formData.grid_width}
                onChange={(e) => setFormData({ ...formData, grid_width: e.target.value })}
                className="form-input"
              >
                <option value="col-span-1">1 Column (Small Card)</option>
                <option value="col-span-2">2 Columns (Medium Widget)</option>
                <option value="col-span-4">Full Width (4 Columns)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div><label className="form-label">Height</label><input className="form-input" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} placeholder="auto / 240px" /></div>
            <div><label className="form-label">Min Columns</label><input type="number" min="1" max="8" className="form-input" value={formData.min_width} onChange={(e) => setFormData({ ...formData, min_width: Number(e.target.value) })} /></div>
            <div><label className="form-label">Max Columns</label><input type="number" min="1" max="8" className="form-input" value={formData.max_width} onChange={(e) => setFormData({ ...formData, max_width: Number(e.target.value) })} /></div>
          </div>

          <div><label className="form-label">Visible to Roles (empty = all permitted roles)</label><select multiple className="form-input h-24" value={formData.roles} onChange={(e) => setFormData({ ...formData, roles: Array.from(e.target.selectedOptions, (option) => option.value) })}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="widgetActiveCheck"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
            />
            <label htmlFor="widgetActiveCheck" className="text-xs text-[#374151] cursor-pointer font-semibold">
              Enable widget on Executive Dashboard
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={formData.collapsible} onChange={(e) => setFormData({ ...formData, collapsible: e.target.checked, default_collapsed: e.target.checked ? formData.default_collapsed : false })} /> User can collapse</label>
            <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" disabled={!formData.collapsible} checked={formData.default_collapsed} onChange={(e) => setFormData({ ...formData, default_collapsed: e.target.checked })} /> Start collapsed</label>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingId ? "Update Widget" : "Save Widget"}
            </button>
          </div>
        </form>
      </Modal>
      <WhereUsedModal
        isOpen={whereUsedState.isOpen}
        onClose={() => setWhereUsedState({ ...whereUsedState, isOpen: false })}
        configType="widget"
        itemId={whereUsedState.itemId}
        itemName={whereUsedState.itemName}
      />
    </div>
  );
}
