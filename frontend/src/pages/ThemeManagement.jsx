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
    primary_color: '#3b82f6',
    secondary_color: '#6366f1',
    background_color: '#0f172a',
    card_bg_color: '#1e293b',
    text_color: '#f8fafc',
    border_color: 'rgba(255,255,255,0.1)',
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

    // Save active state via API
    axios.patch(`http://127.0.0.1:8000/api/core/ui-themes/${t.id}/`, { active: true })
      .then(() => {
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
      primary_color: '#3b82f6',
      secondary_color: '#6366f1',
      background_color: '#0f172a',
      card_bg_color: '#1e293b',
      text_color: '#f8fafc',
      border_color: 'rgba(255,255,255,0.1)',
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
          setNotification("Theme updated.");
          setIsModalOpen(false);
          fetchThemes();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-themes/', formData)
        .then(() => {
          setNotification("New theme created.");
          setIsModalOpen(false);
          fetchThemes();
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
            <span className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">Global Theme Studio & Palette Management</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Create, preview, switch, and apply custom enterprise UI color themes (Dark, Light, Corporate, Cyberpunk, Custom) globally.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchThemes} className="btn-secondary text-xs flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleOpenAdd} className="btn-primary text-xs flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Custom Theme
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 backdrop-blur-xl ${
                t.active
                  ? 'bg-blue-600/15 border-blue-500/50 shadow-xl shadow-blue-500/10'
                  : 'bg-slate-900/60 border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white">{t.theme_name}</h3>
                  {t.active && (
                    <span className="badge badge-active text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" /> Active Theme
                    </span>
                  )}
                </div>

                {/* Color Swatch Previews */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="space-y-1 text-center">
                    <div className="w-full h-8 rounded-lg shadow" style={{ backgroundColor: t.primary_color }}></div>
                    <span className="text-[9px] text-slate-400 font-mono">Primary</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="w-full h-8 rounded-lg shadow" style={{ backgroundColor: t.secondary_color }}></div>
                    <span className="text-[9px] text-slate-400 font-mono">Secondary</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="w-full h-8 rounded-lg shadow" style={{ backgroundColor: t.background_color }}></div>
                    <span className="text-[9px] text-slate-400 font-mono">Background</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="w-full h-8 rounded-lg shadow" style={{ backgroundColor: t.card_bg_color }}></div>
                    <span className="text-[9px] text-slate-400 font-mono">Card BG</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  onClick={() => applyThemeGlobally(t)}
                  className={`btn-primary text-xs flex items-center gap-1.5 ${t.active ? 'opacity-50 cursor-default' : ''}`}
                  disabled={t.active}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.active ? 'Current Theme' : 'Apply Theme'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Theme Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Theme Palette" : "Create Custom Theme"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Theme Name *</label>
            <input
              type="text"
              value={formData.theme_name}
              onChange={(e) => setFormData({ ...formData, theme_name: e.target.value })}
              className="form-input"
              required
              placeholder="e.g., Emerald Corporate"
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
                  className="w-10 h-10 rounded-xl bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="form-input flex-1 font-mono text-xs"
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
                  className="w-10 h-10 rounded-xl bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="form-input flex-1 font-mono text-xs"
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
              <label className="form-label">Card Background *</label>
              <input
                type="text"
                value={formData.card_bg_color}
                onChange={(e) => setFormData({ ...formData, card_bg_color: e.target.value })}
                className="form-input font-mono text-xs"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              {editingId ? "Update Theme" : "Save Theme"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
