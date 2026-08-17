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
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
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
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("Modal definition updated.");
          setIsModalOpen(false);
          fetchData();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-modals/', payload)
        .then(() => {
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("New modal definition created.");
          setIsModalOpen(false);
          fetchData();
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
              <Maximize2 className="w-5 h-5" />
            </span>
            <h1 className="page-title">Dynamic Modal Designer</h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Design configurable pop-up modals, assign dimensions (width/height), configure custom submit buttons, and bind dynamic forms.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Modal
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          {notification}
        </div>
      )}

      {/* Modals Directory Table */}
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
                  <th>Modal Key</th>
                  <th>Title</th>
                  <th>Dimensions (W x H)</th>
                  <th>Assigned Form</th>
                  <th>Submit Label</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {modals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-[#6B7280] italic">
                      No dynamic modals created yet. Click "Create Modal" to define pop-up modal interfaces.
                    </td>
                  </tr>
                ) : (
                  modals.map((m) => (
                    <tr key={m.id}>
                      <td className="font-mono font-bold text-[#1B4E9B]">{m.modal_name}</td>
                      <td className="font-bold text-[#1F2937]">{m.title}</td>
                      <td className="font-mono text-xs text-[#2563EB]">{m.width} x {m.height}</td>
                      <td className="text-[#374151] font-semibold">{m.form_title || 'Unassigned'}</td>
                      <td className="font-mono text-[#16A34A] font-semibold">{m.submit_text}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewModal(m)}
                            className="btn-action-view"
                            title="Preview Modal Live"
                          >
                            <Eye className="w-3.5 h-3.5" /> Preview
                          </button>
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="btn-action-edit"
                            title="Edit Modal"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="btn-action-delete"
                            title="Delete Modal"
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

      {/* Add / Edit Modal Definition */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md" title={editingId ? "Edit Modal Design" : "Create Modal Design"}>
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

          <div className="modal-footer">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
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
          size="md"
          title={previewModal.title}
        >
          <div className="space-y-4">
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-[#1B4E9B] text-xs font-semibold">
              <span>Live Modal Preview Test</span> — Width: {previewModal.width}, Height: {previewModal.height}
            </div>

            {previewModal.form ? (
              <GenericFormRenderer
                formConfig={forms.find(f => f.id === previewModal.form || f.id === previewModal.form?.id || f.form_name === previewModal.form_name)}
                onSubmit={(data) => {
                  alert("Preview form submitted with data:\n\n" + JSON.stringify(data, null, 2));
                  setPreviewModal(null);
                }}
                onCancel={() => setPreviewModal(null)}
              />
            ) : (
              <div className="p-8 text-center text-[#6B7280] space-y-4">
                <p className="text-sm">This is a dynamic modal window configured with title "{previewModal.title}".</p>
                <button onClick={() => setPreviewModal(null)} className="btn-primary">
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
