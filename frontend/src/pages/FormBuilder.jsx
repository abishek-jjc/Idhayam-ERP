import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Plus, Edit3, Trash2, ArrowUp, ArrowDown, Eye, CheckCircle2, RefreshCw, FileCode } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';
import GenericFormRenderer from '../components/GenericFormRenderer';

export default function FormBuilder() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [editingFormId, setEditingFormId] = useState(null);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [notification, setNotification] = useState('');

  const [formInput, setFormInput] = useState({
    form_name: '',
    module: 'core',
    title: '',
    description: '',
    active: true,
  });

  const [fieldInput, setFieldInput] = useState({
    field_name: '',
    field_code: '',
    field_type: 'text',
    required: false,
    default_value: '',
    options: '',
    reference_table: '',
    field_order: 1,
    active: true,
  });

  const supportedTypes = [
    { type: 'text', label: 'Text Input' },
    { type: 'textarea', label: 'Textarea' },
    { type: 'number', label: 'Number' },
    { type: 'date', label: 'Date Picker' },
    { type: 'time', label: 'Time Picker' },
    { type: 'datetime', label: 'Date & Time' },
    { type: 'boolean', label: 'Boolean / Checkbox' },
    { type: 'select', label: 'Dropdown Select' },
    { type: 'reference', label: 'Reference FK' },
    { type: 'email', label: 'Email Address' },
    { type: 'phone', label: 'Phone Number' },
    { type: 'currency', label: 'Currency (₹)' },
    { type: 'file', label: 'File Upload' },
    { type: 'url', label: 'Website URL' },
    { type: 'password', label: 'Password Input' },
  ];

  const fetchForms = () => {
    setLoading(true);
    axios.get('http://127.0.0.1:8000/api/core/ui-forms/')
      .then(res => {
        const fetched = res.data?.results || res.data || [];
        setForms(fetched);
        if (fetched.length > 0 && !selectedForm) {
          setSelectedForm(fetched[0]);
        } else if (selectedForm) {
          const updated = fetched.find(f => f.id === selectedForm.id);
          if (updated) setSelectedForm(updated);
        }
      })
      .catch(err => console.error("Error fetching forms:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleCreateFormSubmit = (e) => {
    e.preventDefault();
    if (editingFormId) {
      axios.put(`http://127.0.0.1:8000/api/core/ui-forms/${editingFormId}/`, formInput)
        .then(res => {
          setNotification("Form updated.");
          setIsFormModalOpen(false);
          fetchForms();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-forms/', formInput)
        .then(res => {
          setNotification("New form created.");
          setIsFormModalOpen(false);
          fetchForms();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Creation failed: " + err.message));
    }
  };

  const handleAddFieldClick = () => {
    if (!selectedForm) return;
    setEditingFieldId(null);
    setFieldInput({
      field_name: '',
      field_code: '',
      field_type: 'text',
      required: false,
      default_value: '',
      options: '',
      reference_table: '',
      field_order: (selectedForm.fields?.length || 0) + 1,
      active: true,
    });
    setIsFieldModalOpen(true);
  };

  const handleEditFieldClick = (field) => {
    setEditingFieldId(field.id);
    setFieldInput({
      field_name: field.field_name,
      field_code: field.field_code,
      field_type: field.field_type,
      required: field.required !== false,
      default_value: field.default_value || '',
      options: field.options || '',
      reference_table: field.reference_table || '',
      field_order: field.field_order || 1,
      active: field.active !== false,
    });
    setIsFieldModalOpen(true);
  };

  const handleFieldSubmit = (e) => {
    e.preventDefault();
    if (!selectedForm) return;

    const payload = {
      ...fieldInput,
      form: selectedForm.id
    };

    if (editingFieldId) {
      axios.put(`http://127.0.0.1:8000/api/core/ui-form-fields/${editingFieldId}/`, payload)
        .then(() => {
          setNotification("Field updated.");
          setIsFieldModalOpen(false);
          fetchForms();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Field update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-form-fields/', payload)
        .then(() => {
          setNotification("New field added.");
          setIsFieldModalOpen(false);
          fetchForms();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Field addition failed: " + err.message));
    }
  };

  const handleDeleteField = (fieldId) => {
    if (window.confirm("Delete this field from form?")) {
      axios.delete(`http://127.0.0.1:8000/api/core/ui-form-fields/${fieldId}/`)
        .then(() => {
          setNotification("Field removed.");
          fetchForms();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Delete failed: " + err.message));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FileCode className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">Generic Dynamic Form Builder</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build custom forms with 14 field types (Time, Dropdown options, Currency, References, Files, Validation) without writing code.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchForms} className="btn-secondary text-xs flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => {
              setEditingFormId(null);
              setFormInput({ form_name: '', module: 'core', title: '', description: '', active: true });
              setIsFormModalOpen(true);
            }}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create New Form
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Selector List */}
        <div className="p-5 bg-slate-900/60 border border-white/10 rounded-2xl space-y-3 backdrop-blur-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Forms Directory</h3>
          {loading ? (
            <SkeletonLoader rows={4} columns={1} />
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {forms.map(f => (
                <div
                  key={f.id}
                  onClick={() => setSelectedForm(f)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedForm?.id === f.id
                      ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-lg'
                      : 'bg-slate-950/40 border-white/5 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm">{f.title}</h4>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      {f.fields?.length || 0} fields
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-1">{f.form_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 2 Columns: Form Fields Editor */}
        <div className="lg:col-span-2 p-6 bg-slate-900/60 border border-white/10 rounded-2xl space-y-6 backdrop-blur-xl">
          {selectedForm ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-black text-white">{selectedForm.title}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedForm.form_name} • Module: {selectedForm.module}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsPreviewOpen(true)} className="btn-secondary text-xs flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-400" /> Preview Form
                  </button>
                  <button onClick={handleAddFieldClick} className="btn-primary text-xs flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add Field
                  </button>
                </div>
              </div>

              {/* Fields Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-3">Order</th>
                      <th className="p-3">Field Name</th>
                      <th className="p-3">Code</th>
                      <th className="p-3">Field Type</th>
                      <th className="p-3">Options / Details</th>
                      <th className="p-3">Required</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {(selectedForm.fields || []).length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-400 italic">
                          No fields added to this form yet. Click "Add Field" above.
                        </td>
                      </tr>
                    ) : (
                      selectedForm.fields.map(f => (
                        <tr key={f.id} className="hover:bg-white/5 transition-all">
                          <td className="p-3 font-mono font-bold text-blue-400">#{f.field_order}</td>
                          <td className="p-3 font-extrabold text-white">{f.field_name}</td>
                          <td className="p-3 font-mono text-[11px] text-purple-300">{f.field_code}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-semibold">
                              {f.field_type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 max-w-xs truncate font-mono text-[11px]">
                            {f.options ? `Options: ${f.options}` : (f.reference_table ? `Ref: ${f.reference_table}` : '-')}
                          </td>
                          <td className="p-3">
                            <span className={`badge ${f.required ? 'badge-active' : 'badge-inactive'}`}>
                              {f.required ? 'Required' : 'Optional'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditFieldClick(f)}
                                className="p-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteField(f.id)}
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
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
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 italic">Select a form from the directory to build and configure fields.</div>
          )}
        </div>
      </div>

      {/* Form Definition Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title="Create Dynamic Form">
        <form onSubmit={handleCreateFormSubmit} className="space-y-4">
          <div>
            <label className="form-label">Form Title *</label>
            <input
              type="text"
              value={formInput.title}
              onChange={(e) => setFormInput({ ...formInput, title: e.target.value })}
              className="form-input"
              required
              placeholder="e.g., Quality Control Inspection Form"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Form Code Key *</label>
              <input
                type="text"
                value={formInput.form_name}
                onChange={(e) => setFormInput({ ...formInput, form_name: e.target.value })}
                className="form-input"
                required
                placeholder="e.g., qc_inspection_form"
              />
            </div>
            <div>
              <label className="form-label">Module *</label>
              <input
                type="text"
                value={formInput.module}
                onChange={(e) => setFormInput({ ...formInput, module: e.target.value })}
                className="form-input"
                required
                placeholder="e.g., process_engine"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea
              value={formInput.description}
              onChange={(e) => setFormInput({ ...formInput, description: e.target.value })}
              className="form-input"
              rows="2"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsFormModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Form
            </button>
          </div>
        </form>
      </Modal>

      {/* Field Definition Modal */}
      <Modal isOpen={isFieldModalOpen} onClose={() => setIsFieldModalOpen(false)} title={editingFieldId ? "Edit Form Field" : "Add Form Field"}>
        <form onSubmit={handleFieldSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Field Name *</label>
              <input
                type="text"
                value={fieldInput.field_name}
                onChange={(e) => setFieldInput({ ...fieldInput, field_name: e.target.value })}
                className="form-input"
                required
                placeholder="e.g., Inspection Shift"
              />
            </div>
            <div>
              <label className="form-label">Field Code Key *</label>
              <input
                type="text"
                value={fieldInput.field_code}
                onChange={(e) => setFieldInput({ ...fieldInput, field_code: e.target.value })}
                className="form-input"
                required
                placeholder="e.g., shift_code"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Supported Field Type *</label>
              <select
                value={fieldInput.field_type}
                onChange={(e) => setFieldInput({ ...fieldInput, field_type: e.target.value })}
                className="form-input"
                required
              >
                {supportedTypes.map(st => (
                  <option key={st.type} value={st.type}>{st.label} ({st.type})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Field Sort Order *</label>
              <input
                type="number"
                value={fieldInput.field_order}
                onChange={(e) => setFieldInput({ ...fieldInput, field_order: parseInt(e.target.value) || 1 })}
                className="form-input"
                required
              />
            </div>
          </div>

          {fieldInput.field_type === 'select' && (
            <div>
              <label className="form-label">Dropdown Options (Comma separated) *</label>
              <input
                type="text"
                value={fieldInput.options}
                onChange={(e) => setFieldInput({ ...fieldInput, options: e.target.value })}
                className="form-input"
                placeholder="Morning, Evening, Night"
                required
              />
            </div>
          )}

          {fieldInput.field_type === 'reference' && (
            <div>
              <label className="form-label">Reference Table</label>
              <input
                type="text"
                value={fieldInput.reference_table}
                onChange={(e) => setFieldInput({ ...fieldInput, reference_table: e.target.value })}
                className="form-input"
                placeholder="vendor, employee, machine, storage_location"
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="reqCheck"
              checked={fieldInput.required}
              onChange={(e) => setFieldInput({ ...fieldInput, required: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/10"
            />
            <label htmlFor="reqCheck" className="text-xs text-slate-200 cursor-pointer font-semibold">
              Mark Field as Mandatory / Required
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsFieldModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Field
            </button>
          </div>
        </form>
      </Modal>

      {/* Live Form Preview Modal */}
      {isPreviewOpen && selectedForm && (
        <Modal isOpen={true} onClose={() => setIsPreviewOpen(false)} title={`Preview: ${selectedForm.title}`}>
          <GenericFormRenderer
            formConfig={selectedForm}
            onSubmit={(val) => {
              alert("Submitted Form Data: " + JSON.stringify(val, null, 2));
              setIsPreviewOpen(false);
            }}
            onCancel={() => setIsPreviewOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}
