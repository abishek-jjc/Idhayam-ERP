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
                      <td className="font-mono font-bold text-[#1B4E9B]">#{w.position}</td>
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
    </div>
  );
}
