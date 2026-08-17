import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layout, Plus, Edit3, Trash2, CheckCircle2, RefreshCw, Network } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';
import WhereUsedModal from '../components/ui/WhereUsedModal';

export default function NavbarManagement() {
  const [navbars, setNavbars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState('');
  const [whereUsedState, setWhereUsedState] = useState({ isOpen: false, itemId: '', itemName: '' });

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
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
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
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("Navbar config updated.");
          setIsModalOpen(false);
          fetchNavbars();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-navbars/', formData)
        .then(() => {
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("New navbar config created.");
          setIsModalOpen(false);
          fetchNavbars();
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
              <Layout className="w-5 h-5" />
            </span>
            <h1 className="page-title">Dynamic Navbar Management</h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Configure header bar titles, search inputs, notification badges, and profile toggles per application page route.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchNavbars} className="btn-secondary">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Navbar Config
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          {notification}
        </div>
      )}

      {/* Navbars Table */}
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
                  <th>Page Key</th>
                  <th>Header Title</th>
                  <th>Search</th>
                  <th>Notifications</th>
                  <th>Profile</th>
                  <th>Logout</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {navbars.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-[#6B7280] italic">
                      No dynamic navbar configs created yet.
                    </td>
                  </tr>
                ) : (
                  navbars.map((n) => (
                    <tr key={n.id}>
                      <td className="font-mono font-bold text-[#1B4E9B]">{n.page_name}</td>
                      <td className="font-bold text-[#1F2937]">{n.title}</td>
                      <td>
                        <span className={`badge ${n.show_search ? 'badge-success' : 'badge-neutral'}`}>
                          {n.show_search ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${n.show_notification ? 'badge-success' : 'badge-neutral'}`}>
                          {n.show_notification ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${n.show_profile ? 'badge-success' : 'badge-neutral'}`}>
                          {n.show_profile ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${n.show_logout ? 'badge-success' : 'badge-neutral'}`}>
                          {n.show_logout ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setWhereUsedState({ isOpen: true, itemId: n.id, itemName: n.title })}
                            className="btn-action-view"
                            title="View Impact & Where Used"
                          >
                            <Network className="w-3.5 h-3.5" /> Impact
                          </button>
                          <button
                            onClick={() => handleOpenEdit(n)}
                            className="btn-action-edit"
                            title="Edit Navbar Config"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(n.id)}
                            className="btn-action-delete"
                            title="Delete Navbar Config"
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md" title={editingId ? "Edit Navbar Config" : "Create Navbar Config"}>
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
                className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
              />
              <label htmlFor="searchCheck" className="text-xs text-[#374151] cursor-pointer font-semibold">
                Show Global Search
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifCheck"
                checked={formData.show_notification}
                onChange={(e) => setFormData({ ...formData, show_notification: e.target.checked })}
                className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
              />
              <label htmlFor="notifCheck" className="text-xs text-[#374151] cursor-pointer font-semibold">
                Show Notifications Center
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="profileCheck"
                checked={formData.show_profile}
                onChange={(e) => setFormData({ ...formData, show_profile: e.target.checked })}
                className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
              />
              <label htmlFor="profileCheck" className="text-xs text-[#374151] cursor-pointer font-semibold">
                Show User Profile Tag
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="logoutCheck"
                checked={formData.show_logout}
                onChange={(e) => setFormData({ ...formData, show_logout: e.target.checked })}
                className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
              />
              <label htmlFor="logoutCheck" className="text-xs text-[#374151] cursor-pointer font-semibold">
                Show Logout Button
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingId ? "Update Config" : "Save Config"}
            </button>
          </div>
        </form>
      </Modal>
      <WhereUsedModal
        isOpen={whereUsedState.isOpen}
        onClose={() => setWhereUsedState({ ...whereUsedState, isOpen: false })}
        configType="navbar"
        itemId={whereUsedState.itemId}
        itemName={whereUsedState.itemName}
      />
    </div>
  );
}
