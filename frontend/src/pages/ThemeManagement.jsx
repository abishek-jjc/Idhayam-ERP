import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Palette, Plus, Edit3, Trash2, CheckCircle2, Sparkles, RefreshCw, Network } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';
import WhereUsedModal from '../components/ui/WhereUsedModal';

const themeDefaults = {
  theme_name: '', primary_color: '#1b4e9b', secondary_color: '#163f7d', accent_color: '#06b6d4',
  background_color: '#f5f7fa', card_bg_color: '#ffffff', text_color: '#1f2937', border_color: '#e5e7eb',
  sidebar_color: '#1b4e9b', sidebar_text_color: '#ffffff', sidebar_active_bg: 'rgba(255,255,255,0.18)',
  sidebar_active_text: '#ffffff', sidebar_hover_bg: 'rgba(255,255,255,0.10)', sidebar_hover_text: '#ffffff',
  sidebar_icon_color: '#dbeafe', sidebar_active_icon_color: '#ffffff', sidebar_border_color: 'rgba(255,255,255,0.1)',
  sidebar_width: '250px', sidebar_collapsed_default: false, logo_text: 'E3', application_name: 'ERP v3', menu_spacing: '4px',
  navbar_color: '#ffffff', navbar_text_color: '#0f172a', navbar_border_color: '#e2e8f0', navbar_icon_color: '#475569',
  login_background_color: '#f8fafc', login_card_color: '#ffffff', input_background_color: '#ffffff',
  input_border_color: '#d1d5db', input_text_color: '#1f2937', table_header_color: '#f8fafc', table_row_color: '#ffffff',
  success_color: '#16a34a', warning_color: '#f6ce0a', danger_color: '#dc2626', info_color: '#2563eb',
  shadow_value: '0 2px 8px rgba(15,23,42,0.08)', button_radius: '6px', font_family: 'Inter, sans-serif', active: false,
};

const tokenGroups = [
  ['Core', ['primary_color', 'secondary_color', 'accent_color', 'background_color', 'card_bg_color', 'text_color', 'border_color']],
  ['Sidebar', ['sidebar_color', 'sidebar_text_color', 'sidebar_active_bg', 'sidebar_active_text', 'sidebar_hover_bg', 'sidebar_hover_text', 'sidebar_icon_color', 'sidebar_active_icon_color', 'sidebar_border_color']],
  ['Navbar & Login', ['navbar_color', 'navbar_text_color', 'navbar_border_color', 'navbar_icon_color', 'login_background_color', 'login_card_color']],
  ['Inputs, Tables & Status', ['input_background_color', 'input_border_color', 'input_text_color', 'table_header_color', 'table_row_color', 'success_color', 'warning_color', 'danger_color', 'info_color']],
];

export default function ThemeManagement() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState('');
  const [whereUsedState, setWhereUsedState] = useState({ isOpen: false, itemId: '', itemName: '' });

  const [formData, setFormData] = useState(themeDefaults);

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
    if (t.accent_color) root.style.setProperty('--theme-accent', t.accent_color);
    root.style.setProperty('--theme-bg', t.background_color);
    root.style.setProperty('--theme-card', t.card_bg_color);
    if (t.sidebar_color) root.style.setProperty('--theme-sidebar', t.sidebar_color);
    if (t.navbar_color) root.style.setProperty('--theme-navbar', t.navbar_color);
    root.style.setProperty('--theme-text', t.text_color);
    root.style.setProperty('--theme-border', t.border_color);
    if (t.button_radius) root.style.setProperty('--theme-radius', t.button_radius);
    if (t.font_family) root.style.setProperty('--theme-font', t.font_family);

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
    setFormData(themeDefaults);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({ ...themeDefaults, ...item });
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
          <div className="flex items-center gap-3">
            <span className="page-header-icon">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="page-title">Global Theme Studio & Design Tokens</h1>
          </div>
          <p className="helper-text mt-1">
            Create, preview, switch, and apply custom enterprise UI color themes and CSS design tokens globally across the ERP.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchThemes} className="btn-secondary flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-1">
            <Plus className="w-4 h-4" /> Create Custom Theme
          </button>
        </div>
      </div>

      {notification && (
        <div className="inline-notice">
          <CheckCircle2 className="w-4 h-4" />
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
              className={`standard-card transition-all flex flex-col justify-between space-y-4 ${t.active ? 'ring-2 ring-[var(--theme-primary)]' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">{t.theme_name}</h3>
                  {t.active && (
                    <span className="badge badge-success">
                      <Sparkles className="w-3 h-3" /> Active Theme
                    </span>
                  )}
                </div>

                {/* Color Swatch Previews */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="space-y-1 text-center">
                    <div className="w-full h-8 rounded border border-[var(--border)]" style={{ backgroundColor: t.primary_color }}></div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">Primary</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="w-full h-8 rounded border border-[var(--border)]" style={{ backgroundColor: t.secondary_color }}></div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">Secondary</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="w-full h-8 rounded border border-[var(--border)]" style={{ backgroundColor: t.background_color }}></div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">Background</span>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="w-full h-8 rounded border border-[var(--border)]" style={{ backgroundColor: t.card_bg_color }}></div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">Surface</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--theme-border)]">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setWhereUsedState({ isOpen: true, itemId: t.id, itemName: t.theme_name })}
                    className="btn-icon"
                    title="Where Used & Impact"
                  >
                    <Network className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="btn-icon"
                    title="Edit Palette"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="btn-icon text-[var(--danger)]"
                    title="Delete Theme"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!t.active && (
                  <button
                    onClick={() => applyThemeGlobally(t)}
                    className="btn-primary btn-sm"
                  >
                    Apply Theme Live
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Theme Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl" title={editingId ? "Edit Theme Palette" : "Create Custom Theme"}>
        <form onSubmit={handleSubmit} className="theme-editor-layout text-xs">
          <div>
            <label className="form-label">Theme Name *</label>
            <input
              type="text"
              value={formData.theme_name}
              onChange={(e) => setFormData({ ...formData, theme_name: e.target.value })}
              className="form-input"
              required
              placeholder="e.g., Midnight Gold Theme"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="theme-color-input"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="form-input font-mono"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="theme-color-input"
                />
                <input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="form-input font-mono"
                />
              </div>
            </div>
          </div>

          <div><label className="form-label">Accent Color</label><div className="flex items-center gap-2"><input type="color" className="theme-color-input" value={formData.accent_color} onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })} /><input className="form-input font-mono" value={formData.accent_color} onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })} /></div></div>

          {tokenGroups.slice(1).map(([group, fields]) => (
            <fieldset key={group} className="border border-[var(--theme-border)] rounded-lg p-3">
              <legend className="px-2 font-bold text-[var(--text-primary)]">{group} Tokens</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fields.map((field) => <div key={field}><label className="form-label">{field.replaceAll('_', ' ')}</label><div className="flex gap-2 items-center">{String(formData[field] || '').startsWith('#') && <input type="color" className="theme-color-input" value={formData[field]} onChange={(e) => setFormData({ ...formData, [field]: e.target.value })} />}<input className="form-input font-mono" value={formData[field] || ''} onChange={(e) => setFormData({ ...formData, [field]: e.target.value })} /></div></div>)}
              </div>
            </fieldset>
          ))}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><label className="form-label">Application Name</label><input className="form-input" value={formData.application_name} onChange={(e) => setFormData({ ...formData, application_name: e.target.value })} /></div>
            <div><label className="form-label">Logo Text</label><input className="form-input" value={formData.logo_text} onChange={(e) => setFormData({ ...formData, logo_text: e.target.value })} /></div>
            <div><label className="form-label">Sidebar Width</label><input className="form-input" value={formData.sidebar_width} onChange={(e) => setFormData({ ...formData, sidebar_width: e.target.value })} /></div>
            <div><label className="form-label">Menu Spacing</label><input className="form-input" value={formData.menu_spacing} onChange={(e) => setFormData({ ...formData, menu_spacing: e.target.value })} /></div>
            <div><label className="form-label">Button Radius</label><input className="form-input" value={formData.button_radius} onChange={(e) => setFormData({ ...formData, button_radius: e.target.value })} /></div>
            <div><label className="form-label">Font Family</label><input className="form-input" value={formData.font_family} onChange={(e) => setFormData({ ...formData, font_family: e.target.value })} /></div>
          </div>

          <div className="theme-live-preview rounded-xl overflow-hidden border" style={{ background: formData.background_color, color: formData.text_color, borderColor: formData.border_color }}>
            <div className="h-10 px-3 flex items-center" style={{ background: formData.navbar_color, color: formData.navbar_text_color, borderBottom: `1px solid ${formData.navbar_border_color}` }}>Live preview — {formData.application_name}</div>
            <div className="flex min-h-40"><div className="w-32 p-3 text-xs" style={{ background: formData.sidebar_color, color: formData.sidebar_text_color }}><strong>{formData.logo_text}</strong><div className="mt-3 p-2 rounded" style={{ background: formData.sidebar_active_bg, color: formData.sidebar_active_text }}>Dashboard</div><div className="mt-1 p-2">Forms</div><div className="mt-1 p-2">Reports</div></div><div className="flex-1 p-3"><div className="p-3 rounded" style={{ background: formData.card_bg_color, boxShadow: formData.shadow_value }}><strong>ERP card</strong><input readOnly value="Input preview" className="mt-2 w-full p-2 rounded" style={{ background: formData.input_background_color, color: formData.input_text_color, border: `1px solid ${formData.input_border_color}` }} /><button type="button" className="mt-2 px-3 py-2 rounded text-white" style={{ background: formData.primary_color }}>Primary action</button></div></div></div>
            <div className="theme-login-preview" style={{ background: formData.login_background_color }}><div style={{ background: formData.login_card_color, borderColor: formData.border_color }}><strong>{formData.application_name}</strong><small>Login preview</small><input readOnly placeholder="Username" style={{ background: formData.input_background_color, color: formData.input_text_color, borderColor: formData.input_border_color }} /><input readOnly placeholder="Password" style={{ background: formData.input_background_color, color: formData.input_text_color, borderColor: formData.input_border_color }} /><button type="button" style={{ background: formData.primary_color }}>Sign In</button></div></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.background_color}
                  onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                  className="theme-color-input"
                />
                <input
                  type="text"
                  value={formData.background_color}
                  onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                  className="form-input font-mono"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Surface / Card Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.card_bg_color}
                  onChange={(e) => setFormData({ ...formData, card_bg_color: e.target.value })}
                  className="theme-color-input"
                />
                <input
                  type="text"
                  value={formData.card_bg_color}
                  onChange={(e) => setFormData({ ...formData, card_bg_color: e.target.value })}
                  className="form-input font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.text_color}
                  onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                  className="theme-color-input"
                />
                <input
                  type="text"
                  value={formData.text_color}
                  onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                  className="form-input font-mono"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Border Color</label>
              <input
                type="text"
                value={formData.border_color}
                onChange={(e) => setFormData({ ...formData, border_color: e.target.value })}
                className="form-input font-mono"
                placeholder="rgba(255,255,255,0.1) or #334155"
              />
            </div>
          </div>

          <div className="modal-footer theme-editor-footer">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingId ? "Update Theme" : "Save Theme"}
            </button>
          </div>
        </form>
      </Modal>

      <WhereUsedModal
        isOpen={whereUsedState.isOpen}
        onClose={() => setWhereUsedState({ ...whereUsedState, isOpen: false })}
        configType="theme"
        itemId={whereUsedState.itemId}
        itemName={whereUsedState.itemName}
      />
    </div>
  );
}
