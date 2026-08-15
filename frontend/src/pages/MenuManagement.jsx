import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Menu, Plus, Edit3, Trash2, CheckCircle2, ArrowUp, ArrowDown, Eye, EyeOff, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function MenuManagement() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState('');

  const [formData, setFormData] = useState({
    menu_name: '',
    menu_path: '',
    module_code: 'core',
    menu_icon: 'LayoutDashboard',
    parent_menu: '',
    display_order: 1,
    active: true,
  });

  const fetchMenus = () => {
    setLoading(true);
    axios.get('http://127.0.0.1:8000/api/core/ui-menus/')
      .then(res => setMenus(res.data?.results || res.data || []))
      .catch(err => console.error("Error fetching UI menus:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      menu_name: '',
      menu_path: '',
      module_code: 'core',
      menu_icon: 'LayoutDashboard',
      parent_menu: '',
      display_order: menus.length + 1,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      menu_name: item.menu_name,
      menu_path: item.menu_path,
      module_code: item.module_code,
      menu_icon: item.menu_icon || 'LayoutDashboard',
      parent_menu: item.parent_menu || '',
      display_order: item.display_order || 0,
      active: item.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this sidebar menu item?")) {
      axios.delete(`http://127.0.0.1:8000/api/core/ui-menus/${id}/`)
        .then(() => {
          setNotification("Menu item deleted.");
          fetchMenus();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Delete failed: " + err.message));
    }
  };

  const handleToggleActive = (item) => {
    axios.patch(`http://127.0.0.1:8000/api/core/ui-menus/${item.id}/`, {
      active: !item.active
    })
      .then(() => {
        setNotification(`Menu '${item.menu_name}' ${!item.active ? 'Activated' : 'Deactivated'}.`);
        fetchMenus();
        setTimeout(() => setNotification(''), 3000);
      })
      .catch(err => alert("Toggle failed: " + err.message));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      parent_menu: formData.parent_menu || null
    };

    if (editingId) {
      axios.put(`http://127.0.0.1:8000/api/core/ui-menus/${editingId}/`, payload)
        .then(() => {
          setNotification("Menu updated.");
          setIsModalOpen(false);
          fetchMenus();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-menus/', payload)
        .then(() => {
          setNotification("New menu created.");
          setIsModalOpen(false);
          fetchMenus();
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
            <span className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Menu className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">Dynamic Sidebar Menu Management</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure application navigation menus, order, visibility, icons, and submenus without altering React source code.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchMenus} className="btn-secondary text-xs flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleOpenAdd} className="btn-primary text-xs flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create New Menu
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Dynamic Menus Table */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-6">
            <SkeletonLoader rows={5} columns={6} />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Order</th>
                  <th className="p-4">Menu Name</th>
                  <th className="p-4">Path Route</th>
                  <th className="p-4">Module Code</th>
                  <th className="p-4">Icon Name</th>
                  <th className="p-4">Parent Menu</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {menus.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 italic">
                      No sidebar menus registered. Click "Create New Menu" to add one.
                    </td>
                  </tr>
                ) : (
                  menus.map((m) => (
                    <tr key={m.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4 font-mono font-bold text-blue-400">#{m.display_order}</td>
                      <td className="p-4 font-bold text-white flex items-center gap-2">
                        {m.menu_name}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-purple-300">{m.menu_path}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-white/10">
                          {m.module_code}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">{m.menu_icon || 'LayoutDashboard'}</td>
                      <td className="p-4 text-slate-400">{m.parent_menu_name || 'Top-Level'}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(m)}
                          className={`badge ${m.active ? 'badge-active' : 'badge-inactive'} flex items-center gap-1 cursor-pointer`}
                        >
                          {m.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {m.active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                            title="Edit Menu"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                            title="Delete Menu"
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

      {/* Add / Edit Menu Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Sidebar Menu" : "Create Sidebar Menu"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Menu Name *</label>
              <input
                type="text"
                value={formData.menu_name}
                onChange={(e) => setFormData({ ...formData, menu_name: e.target.value })}
                className="form-input"
                required
                placeholder="e.g., Inventory Ledger"
              />
            </div>
            <div>
              <label className="form-label">Menu Path (Route) *</label>
              <input
                type="text"
                value={formData.menu_path}
                onChange={(e) => setFormData({ ...formData, menu_path: e.target.value })}
                className="form-input"
                required
                placeholder="e.g., /inventory-ledger"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Module Code *</label>
              <input
                type="text"
                value={formData.module_code}
                onChange={(e) => setFormData({ ...formData, module_code: e.target.value })}
                className="form-input"
                required
                placeholder="e.g., process_engine"
              />
            </div>
            <div>
              <label className="form-label">Lucide Icon Name</label>
              <input
                type="text"
                value={formData.menu_icon}
                onChange={(e) => setFormData({ ...formData, menu_icon: e.target.value })}
                className="form-input"
                placeholder="e.g., Cpu, Layers, Building2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Display Order *</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Parent Menu</label>
              <select
                value={formData.parent_menu}
                onChange={(e) => setFormData({ ...formData, parent_menu: e.target.value })}
                className="form-input"
              >
                <option value="">None (Top-Level Menu)</option>
                {menus.filter(m => m.id !== editingId).map(m => (
                  <option key={m.id} value={m.id}>{m.menu_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="activeMenuCheck"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/10"
            />
            <label htmlFor="activeMenuCheck" className="text-xs text-slate-200 cursor-pointer font-semibold">
              Enable menu in Sidebar navigation
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              {editingId ? "Update Menu" : "Create Menu"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
