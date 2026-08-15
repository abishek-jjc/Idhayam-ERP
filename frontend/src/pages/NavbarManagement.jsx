import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layout, Plus, Edit3, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function NavbarManagement() {
  const [navbars, setNavbars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState('');

  const [formData, setFormData] = useState({
    page_name: '',
    title: '',
    icon: 'Layers',
    show_search: true,
    show_notification: true,
    show_profile: true,
    show_logout: true,
    active: true,
  });

  const fetchNavbars = () => {
    setLoading(true);
    axios.get('http://127.0.0.1:8000/api/core/ui-navbars/')
      .then(res => setNavbars(res.data?.results || res.data || []))
      .catch(err => console.error("Error fetching navbars:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNavbars();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      page_name: '',
      title: '',
      icon: 'Layers',
      show_search: true,
      show_notification: true,
      show_profile: true,
      show_logout: true,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      page_name: item.page_name,
      title: item.title,
      icon: item.icon || 'Layers',
      show_search: item.show_search !== false,
      show_notification: item.show_notification !== false,
      show_profile: item.show_profile !== false,
      show_logout: item.show_logout !== false,
      active: item.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this navbar configuration?")) {
      axios.delete(`http://127.0.0.1:8000/api/core/ui-navbars/${id}/`)
        .then(() => {
          setNotification("Navbar config deleted.");
          fetchNavbars();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Delete failed: " + err.message));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      axios.put(`http://127.0.0.1:8000/api/core/ui-navbars/${editingId}/`, formData)
        .then(() => {
          setNotification("Navbar config updated.");
          setIsModalOpen(false);
          fetchNavbars();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-navbars/', formData)
        .then(() => {
          setNotification("New navbar config created.");
          setIsModalOpen(false);
          fetchNavbars();
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
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Layout className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">Dynamic Navbar Management</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure header bar titles, search inputs, notification badges, and profile toggles per application page route.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchNavbars} className="btn-secondary text-xs flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleOpenAdd} className="btn-primary text-xs flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Navbar Config
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Navbars Table */}
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
                  <th className="p-4">Page Key</th>
                  <th className="p-4">Header Title</th>
                  <th className="p-4">Search</th>
                  <th className="p-4">Notifications</th>
                  <th className="p-4">Profile</th>
                  <th className="p-4">Logout</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {navbars.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 italic">
                      No dynamic navbar configs created yet.
                    </td>
                  </tr>
                ) : (
                  navbars.map((n) => (
                    <tr key={n.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4 font-mono font-bold text-cyan-300">{n.page_name}</td>
                      <td className="p-4 font-extrabold text-white">{n.title}</td>
                      <td className="p-4">
                        <span className={`badge ${n.show_search ? 'badge-active' : 'badge-inactive'}`}>
                          {n.show_search ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`badge ${n.show_notification ? 'badge-active' : 'badge-inactive'}`}>
                          {n.show_notification ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`badge ${n.show_profile ? 'badge-active' : 'badge-inactive'}`}>
                          {n.show_profile ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`badge ${n.show_logout ? 'badge-active' : 'badge-inactive'}`}>
                          {n.show_logout ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(n)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                            title="Edit Navbar Config"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(n.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                            title="Delete Navbar Config"
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Navbar Config" : "Create Navbar Config"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Page Route Identifier (e.g. process-engine) *</label>
            <input
              type="text"
              value={formData.page_name}
              onChange={(e) => setFormData({ ...formData, page_name: e.target.value })}
              className="form-input"
              required
              placeholder="e.g., process-engine or default"
            />
          </div>

          <div>
            <label className="form-label">Header Banner Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="form-input"
              required
              placeholder="e.g., Process Control & Execution Portal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="searchCheck"
                checked={formData.show_search}
                onChange={(e) => setFormData({ ...formData, show_search: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/10"
              />
              <label htmlFor="searchCheck" className="text-xs text-slate-200 cursor-pointer font-semibold">
                Show Global Search
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifCheck"
                checked={formData.show_notification}
                onChange={(e) => setFormData({ ...formData, show_notification: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/10"
              />
              <label htmlFor="notifCheck" className="text-xs text-slate-200 cursor-pointer font-semibold">
                Show Notifications Center
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="profileCheck"
                checked={formData.show_profile}
                onChange={(e) => setFormData({ ...formData, show_profile: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/10"
              />
              <label htmlFor="profileCheck" className="text-xs text-slate-200 cursor-pointer font-semibold">
                Show User Profile Tag
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="logoutCheck"
                checked={formData.show_logout}
                onChange={(e) => setFormData({ ...formData, show_logout: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/10"
              />
              <label htmlFor="logoutCheck" className="text-xs text-slate-200 cursor-pointer font-semibold">
                Show Logout Button
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              {editingId ? "Update Config" : "Save Config"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
