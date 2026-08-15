import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutGrid, Plus, Edit3, Trash2, CheckCircle2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function WidgetManagement() {
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState('');

  const [formData, setFormData] = useState({
    widget_name: '',
    widget_type: 'kpi',
    data_source: '',
    position: 1,
    grid_width: 'col-span-1',
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
    axios.get('http://127.0.0.1:8000/api/core/ui-widgets/')
      .then(res => setWidgets(res.data?.results || res.data || []))
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
      position: widgets.length + 1,
      grid_width: 'col-span-1',
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
      position: item.position || 1,
      grid_width: item.grid_width || 'col-span-1',
      active: item.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this dashboard widget?")) {
      axios.delete(`http://127.0.0.1:8000/api/core/ui-widgets/${id}/`)
        .then(() => {
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
          setNotification("Widget updated.");
          setIsModalOpen(false);
          fetchWidgets();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-widgets/', formData)
        .then(() => {
          setNotification("New widget created.");
          setIsModalOpen(false);
          fetchWidgets();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Creation failed: " + err.message));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <LayoutGrid className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">Dynamic Dashboard Widget Management</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure dynamic executive dashboard widgets (KPI Cards, Metric Charts, Tables, Activity Lists, Quick Shortcuts).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchWidgets} className="btn-secondary text-xs flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleOpenAdd} className="btn-primary text-xs flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Widget
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Widgets Table */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-6">
            <SkeletonLoader rows={4} columns={6} />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Position</th>
                  <th className="p-4">Widget Name</th>
                  <th className="p-4">Widget Type</th>
                  <th className="p-4">API Data Source</th>
                  <th className="p-4">Grid Span</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {widgets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 italic">
                      No dashboard widgets configured. Click "Add Widget" to set up dashboard metrics.
                    </td>
                  </tr>
                ) : (
                  widgets.map((w) => (
                    <tr key={w.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4 font-mono font-bold text-blue-400">#{w.position}</td>
                      <td className="p-4 font-extrabold text-white">{w.widget_name}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase font-semibold">
                          {w.widget_type}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-cyan-300 max-w-xs truncate">{w.data_source || 'Default Aggregator'}</td>
                      <td className="p-4 font-mono text-slate-400">{w.grid_width}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(w)}
                          className={`badge ${w.active ? 'badge-active' : 'badge-inactive'} cursor-pointer flex items-center gap-1`}
                        >
                          {w.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {w.active ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(w)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                            title="Edit Widget"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(w.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                            title="Delete Widget"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Dashboard Widget" : "Create Dashboard Widget"}>
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
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 1 })}
                className="form-input"
                required
              />
            </div>
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

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="widgetActiveCheck"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/10"
            />
            <label htmlFor="widgetActiveCheck" className="text-xs text-slate-200 cursor-pointer font-semibold">
              Enable widget on Executive Dashboard
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              {editingId ? "Update Widget" : "Save Widget"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
