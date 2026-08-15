import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Maximize2, Plus, Edit3, Trash2, Eye, CheckCircle2, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';
import GenericFormRenderer from '../components/GenericFormRenderer';

export default function ModalDesigner() {
  const [modals, setModals] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewModal, setPreviewModal] = useState(null);
  const [notification, setNotification] = useState('');

  const [formData, setFormData] = useState({
    modal_name: '',
    title: '',
    width: '600px',
    height: 'auto',
    submit_text: 'Submit',
    cancel_text: 'Cancel',
    active: true,
    form: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get('http://127.0.0.1:8000/api/core/ui-modals/'),
      axios.get('http://127.0.0.1:8000/api/core/ui-forms/')
    ])
      .then(([modalRes, formRes]) => {
        setModals(modalRes.data?.results || modalRes.data || []);
        setForms(formRes.data?.results || formRes.data || []);
      })
      .catch(err => console.error("Error fetching modals:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      modal_name: '',
      title: '',
      width: '600px',
      height: 'auto',
      submit_text: 'Submit',
      cancel_text: 'Cancel',
      active: true,
      form: forms[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      modal_name: item.modal_name,
      title: item.title,
      width: item.width || '600px',
      height: item.height || 'auto',
      submit_text: item.submit_text || 'Submit',
      cancel_text: item.cancel_text || 'Cancel',
      active: item.active !== false,
      form: item.form || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this modal definition?")) {
      axios.delete(`http://127.0.0.1:8000/api/core/ui-modals/${id}/`)
        .then(() => {
          setNotification("Modal definition deleted.");
          fetchData();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Delete failed: " + err.message));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      form: formData.form || null
    };

    if (editingId) {
      axios.put(`http://127.0.0.1:8000/api/core/ui-modals/${editingId}/`, payload)
        .then(() => {
          setNotification("Modal definition updated.");
          setIsModalOpen(false);
          fetchData();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-modals/', payload)
        .then(() => {
          setNotification("New modal definition created.");
          setIsModalOpen(false);
          fetchData();
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
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Maximize2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">Dynamic Modal Designer</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Design configurable pop-up modals, assign dimensions (width/height), configure custom submit buttons, and bind dynamic forms.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary text-xs flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleOpenAdd} className="btn-primary text-xs flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Modal
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Modals Directory Table */}
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
                  <th className="p-4">Modal Key</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Dimensions (W x H)</th>
                  <th className="p-4">Assigned Form</th>
                  <th className="p-4">Submit Label</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {modals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                      No dynamic modals created yet. Click "Create Modal" to define pop-up modal interfaces.
                    </td>
                  </tr>
                ) : (
                  modals.map((m) => (
                    <tr key={m.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4 font-mono font-bold text-purple-300">{m.modal_name}</td>
                      <td className="p-4 font-extrabold text-white">{m.title}</td>
                      <td className="p-4 font-mono text-[11px] text-blue-400">{m.width} x {m.height}</td>
                      <td className="p-4 text-slate-300 font-semibold">{m.form_title || 'Unassigned'}</td>
                      <td className="p-4 font-mono text-emerald-400">{m.submit_text}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewModal(m)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all flex items-center gap-1 text-[11px]"
                            title="Preview Modal Live"
                          >
                            <Eye className="w-3.5 h-3.5" /> Preview
                          </button>
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                            title="Edit Modal"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                            title="Delete Modal"
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

      {/* Add / Edit Modal Definition */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Modal Design" : "Create Modal Design"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Modal Key / Code *</label>
              <input
                type="text"
                value={formData.modal_name}
                onChange={(e) => setFormData({ ...formData, modal_name: e.target.value })}
                className="form-input"
                required
                placeholder="e.g., add_vendor_modal"
              />
            </div>
            <div>
              <label className="form-label">Modal Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="form-input"
                required
                placeholder="e.g., Add Vendor Modal"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Width (e.g. 800px or 600px) *</label>
              <input
                type="text"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Height (e.g. auto or 500px) *</label>
              <input
                type="text"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Submit Button Label *</label>
              <input
                type="text"
                value={formData.submit_text}
                onChange={(e) => setFormData({ ...formData, submit_text: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Cancel Button Label *</label>
              <input
                type="text"
                value={formData.cancel_text}
                onChange={(e) => setFormData({ ...formData, cancel_text: e.target.value })}
                className="form-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Assign Dynamic Form</label>
            <select
              value={formData.form}
              onChange={(e) => setFormData({ ...formData, form: e.target.value })}
              className="form-input"
            >
              <option value="">Select UI Form (Optional)</option>
              {forms.map(f => (
                <option key={f.id} value={f.id}>{f.title} ({f.form_name})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              {editingId ? "Update Modal Design" : "Create Modal Design"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Live Preview Modal */}
      {previewModal && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewModal(null)}
          title={previewModal.title}
          width={previewModal.width}
          height={previewModal.height}
        >
          <div className="space-y-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300 text-xs">
              <span className="font-bold">Live Modal Preview Test</span> — Width: {previewModal.width}, Height: {previewModal.height}
            </div>

            {previewModal.form ? (
              <GenericFormRenderer
                formConfig={forms.find(f => f.id === previewModal.form)}
                onSubmit={(data) => {
                  alert("Preview form submitted with data: " + JSON.stringify(data, null, 2));
                  setPreviewModal(null);
                }}
                onCancel={() => setPreviewModal(null)}
              />
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-4">
                <p className="text-sm">This is a dynamic modal window configured with title "{previewModal.title}".</p>
                <button onClick={() => setPreviewModal(null)} className="btn-primary text-xs">
                  {previewModal.submit_text || 'Submit'}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
