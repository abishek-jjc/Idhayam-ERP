import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Palette, Plus, Edit3, Trash2, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function ThemeManagement() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState('');

  const [formData, setFormData] = useState({
    theme_name: '',
    primary_color: '#1B4E9B',
    secondary_color: '#9C9D9E',
    background_color: '#F8FAFC',
    card_bg_color: '#FFFFFF',
    text_color: '#1F2937',
    border_color: '#E5E7EB',
    active: false,
  });

  const fetchThemes = () => {
    setLoading(true);
    axios.get('http://127.0.0.1:8000/api/core/ui-themes/')
      .then(res => setThemes(res.data?.results || res.data || []))
      .catch(err => console.error("Error fetching themes:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const applyThemeGlobally = (t) => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', t.primary_color);
    root.style.setProperty('--theme-secondary', t.secondary_color);
    root.style.setProperty('--theme-bg', t.background_color);
    root.style.setProperty('--theme-card', t.card_bg_color);
    root.style.setProperty('--theme-text', t.text_color);
    root.style.setProperty('--theme-border', t.border_color);

    axios.patch(`http://127.0.0.1:8000/api/core/ui-themes/${t.id}/`, { active: true })
      .then(() => {
        window.dispatchEvent(new Event('erp_theme_updated'));
        setNotification(`Applied theme '${t.theme_name}' globally.`);
        fetchThemes();
        setTimeout(() => setNotification(''), 3000);
      })
      .catch(err => alert("Activation failed: " + err.message));
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      theme_name: '',
      primary_color: '#1B4E9B',
      secondary_color: '#9C9D9E',
      background_color: '#F8FAFC',
      card_bg_color: '#FFFFFF',
      text_color: '#1F2937',
      border_color: '#E5E7EB',
      active: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      theme_name: item.theme_name,
      primary_color: item.primary_color,
      secondary_color: item.secondary_color,
      background_color: item.background_color,
      card_bg_color: item.card_bg_color,
      text_color: item.text_color,
      border_color: item.border_color,
      active: item.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this theme palette?")) {
      axios.delete(`http://127.0.0.1:8000/api/core/ui-themes/${id}/`)
        .then(() => {
          window.dispatchEvent(new Event('erp_theme_updated'));
          setNotification("Theme deleted.");
          fetchThemes();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Delete failed: " + err.message));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      axios.put(`http://127.0.0.1:8000/api/core/ui-themes/${editingId}/`, formData)
        .then(() => {
          window.dispatchEvent(new Event('erp_theme_updated'));
          setNotification("Theme updated.");
          setIsModalOpen(false);
          fetchThemes();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-themes/', formData)
        .then(() => {
          window.dispatchEvent(new Event('erp_theme_updated'));
          setNotification("New theme created.");
          setIsModalOpen(false);
          fetchThemes();
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
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="page-title">Global Theme Studio & Palette Management</h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Create, preview, switch, and apply custom enterprise UI color themes globally.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchThemes} className="btn-secondary">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Custom Theme
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          {notification}
        </div>
      )}

      {/* Themes Palette Grid */}
      {loading ? (
        <SkeletonLoader rows={3} columns={3} type="cards" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((t) => (
            <div
              key={t.id}
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between space-y-4 ${
                t.active
                  ? 'bg-[#EFF6FF] border-[#1B4E9B] shadow-sm'
                  : 'bg-white border-[#E5E7EB] hover:border-[#9C9D9E]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#1F2937]">{t.theme_name}</h3>
                  {t.active && (
                    <span className="badge badge-success flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#16A34A]" /> Active
                    </span>
                  )}
                </div>

                {/* Color Swatch Previews */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="space-y-1 text-center">
                    <div className="w-full h-8 rounded border border-[#E5E7EB]" style={{ backgroundColor: t.primary_color }}></div>
                    <span className="text-[10px] text-[#6B7280] font-mono">Primary</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="w-full h-8 rounded border border-[#E5E7EB]" style={{ backgroundColor: t.secondary_color }}></div>
                    <span className="text-[10px] text-[#6B7280] font-mono">Secondary</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="w-full h-8 rounded border border-[#E5E7EB]" style={{ backgroundColor: t.background_color }}></div>
                    <span className="text-[10px] text-[#6B7280] font-mono">Background</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="w-full h-8 rounded border border-[#E5E7EB]" style={{ backgroundColor: t.card_bg_color }}></div>
                    <span className="text-[10px] text-[#6B7280] font-mono">Surface</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                <button
                  onClick={() => applyThemeGlobally(t)}
                  className={`btn-primary ${t.active ? 'opacity-50 cursor-default' : ''}`}
                  disabled={t.active}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.active ? 'Current Theme' : 'Apply Theme'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="btn-action-edit"
                    title="Edit Theme"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="btn-action-delete"
                    title="Delete Theme"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Theme Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md" title={editingId ? "Edit Theme Palette" : "Create Custom Theme"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Theme Name *</label>
            <input
              type="text"
              value={formData.theme_name}
              onChange={(e) => setFormData({ ...formData, theme_name: e.target.value })}
              className="form-input"
              required
              placeholder="e.g., Enterprise Blue Corporate"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Primary Color *</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-10 h-10 rounded border border-[#E5E7EB] cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="form-input font-mono text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Secondary Color *</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="w-10 h-10 rounded border border-[#E5E7EB] cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="form-input font-mono text-xs"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Background Color *</label>
              <input
                type="text"
                value={formData.background_color}
                onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                className="form-input font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="form-label">Surface Card Color *</label>
              <input
                type="text"
                value={formData.card_bg_color}
                onChange={(e) => setFormData({ ...formData, card_bg_color: e.target.value })}
                className="form-input font-mono text-xs"
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingId ? "Update Theme" : "Save Theme"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
