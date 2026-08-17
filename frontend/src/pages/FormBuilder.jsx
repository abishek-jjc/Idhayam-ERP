import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Edit3, Trash2, Eye, CheckCircle2, RefreshCw, FileCode, Layers, Settings,
  Type, AlignLeft, Hash, Calendar, Clock, CalendarDays, CheckSquare, ChevronDownSquare,
  Link as LinkIcon, Mail, Phone, Banknote, Upload, Globe, Lock, Database
} from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';
import GenericFormRenderer from '../components/GenericFormRenderer';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

export const MASTER_TABLE_OPTIONS = [
  { value: 'companies', label: 'Companies / Legal Entities (/api/core/companies/)' },
  { value: 'plants', label: 'Plants & Facilities (/api/core/plants/)' },
  { value: 'departments', label: 'Departments (/api/core/departments/)' },
  { value: 'designations', label: 'Designations (/api/core/designations/)' },
  { value: 'employees', label: 'Employees & Workforce (/api/core/employees/)' },
  { value: 'machines', label: 'Machines & Vehicles (/api/core/machines/)' },
  { value: 'vendors', label: 'Vendors (/api/core/vendors/)' },
  { value: 'storage_locations', label: 'Storage Bins / Locations (/api/core/storage-locations/)' },
  { value: 'master_categories', label: 'Dynamic Master Categories (/api/masters/categories/)' },
  { value: 'master_items', label: 'Dynamic Master Items (/api/masters/items/)' },
  { value: 'process_types', label: 'Process Types (/api/process/types/)' },
];

export default function FormBuilder() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedField, setSelectedField] = useState(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [editingFormId, setEditingFormId] = useState(null);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [notification, setNotification] = useState('');

  const [optionSourceType, setOptionSourceType] = useState('master_table'); // 'master_table' | 'static_options'

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
    { type: 'text', label: 'Text Input', icon: Type },
    { type: 'textarea', label: 'Textarea', icon: AlignLeft },
    { type: 'number', label: 'Number', icon: Hash },
    { type: 'select', label: 'Dropdown / Select', icon: ChevronDownSquare },
    { type: 'reference', label: 'Master Table Reference', icon: Database },
    { type: 'date', label: 'Date Picker', icon: Calendar },
    { type: 'time', label: 'Time Picker', icon: Clock },
    { type: 'datetime', label: 'Date & Time', icon: CalendarDays },
    { type: 'boolean', label: 'Boolean / Checkbox', icon: CheckSquare },
    { type: 'email', label: 'Email Address', icon: Mail },
    { type: 'phone', label: 'Phone Number', icon: Phone },
    { type: 'currency', label: 'Currency (₹)', icon: Banknote },
    { type: 'file', label: 'File Upload', icon: Upload },
    { type: 'url', label: 'Website URL', icon: Globe },
    { type: 'password', label: 'Password Input', icon: Lock },
  ];

  const fetchForms = () => {
    setLoading(true);
    axios.get('http://127.0.0.1:8000/api/core/ui-forms/')
      .then(res => {
        const fetched = res.data?.results || res.data || [];
        setForms(fetched);
        if (fetched.length > 0 && !selectedForm) {
          setSelectedForm(fetched[0]);
          if (fetched[0].fields?.length > 0) setSelectedField(fetched[0].fields[0]);
        } else if (selectedForm) {
          const updated = fetched.find(f => f.id === selectedForm.id);
          if (updated) {
            setSelectedForm(updated);
            if (updated.fields?.length > 0) setSelectedField(updated.fields[0]);
          }
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
        .then(() => {
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("Form updated successfully.");
          setIsFormModalOpen(false);
          fetchForms();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-forms/', formInput)
        .then(() => {
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("New form created successfully.");
          setIsFormModalOpen(false);
          fetchForms();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Creation failed: " + err.message));
    }
  };

  const handleAddFieldClick = (typeObj) => {
    if (!selectedForm) return;
    const isRefOrSelect = typeObj?.type === 'select' || typeObj?.type === 'reference';
    setEditingFieldId(null);
    setOptionSourceType(typeObj?.type === 'reference' ? 'master_table' : 'master_table');
    setFieldInput({
      field_name: typeObj ? `New ${typeObj.label}` : '',
      field_code: typeObj ? `${typeObj.type}_${Date.now().toString().slice(-4)}` : '',
      field_type: typeObj ? typeObj.type : 'text',
      required: false,
      default_value: '',
      options: '',
      reference_table: isRefOrSelect ? 'plants' : '',
      field_order: (selectedForm.fields?.length || 0) + 1,
      active: true,
    });
    setIsFieldModalOpen(true);
  };

  const handleEditFieldClick = (field) => {
    setEditingFieldId(field.id);
    setSelectedField(field);
    const hasRefTable = !!field.reference_table;
    setOptionSourceType(hasRefTable ? 'master_table' : 'static_options');
    setFieldInput({
      field_name: field.field_name,
      field_code: field.field_code,
      field_type: field.field_type,
      required: field.required !== false,
      default_value: field.default_value || '',
      options: field.options || '',
      reference_table: field.reference_table || (field.field_type === 'reference' ? 'plants' : ''),
      field_order: field.field_order || 1,
      active: field.active !== false,
    });
    setIsFieldModalOpen(true);
  };

  const handleFieldSubmit = (e) => {
    e.preventDefault();
    if (!selectedForm) return;

    let payload = {
      ...fieldInput,
      form: selectedForm.id
    };

    if (fieldInput.field_type === 'select' || fieldInput.field_type === 'reference') {
      if (optionSourceType === 'master_table') {
        payload.reference_table = fieldInput.reference_table || 'plants';
        payload.options = '';
      } else {
        payload.reference_table = '';
        payload.options = fieldInput.options || '';
      }
    }

    if (editingFieldId) {
      axios.put(`http://127.0.0.1:8000/api/core/ui-form-fields/${editingFieldId}/`, payload)
        .then(() => {
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("Field updated successfully.");
          setIsFieldModalOpen(false);
          fetchForms();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Field update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-form-fields/', payload)
        .then(() => {
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("New field added successfully.");
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
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("Field removed successfully.");
          fetchForms();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Delete failed: " + err.message));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Dynamic Form Builder Studio"
        description="Build metadata forms, configure master table dropdown sources, validation rules, and live form layouts."
        icon={FileCode}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={fetchForms}>
              Refresh
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditingFormId(null);
                setFormInput({ form_name: '', module: 'core', title: '', description: '', active: true });
                setIsFormModalOpen(true);
              }}
            >
              Create New Form
            </Button>
          </>
        }
      />

      {notification && (
        <div className="p-4 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          {notification}
        </div>
      )}

      {/* Select active form bar */}
      <div className="standard-card flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <span className="form-label mb-0 text-[#1B4E9B] font-bold">Active Form:</span>
          <select
            value={selectedForm?.id || ''}
            onChange={(e) => {
              const found = forms.find(f => f.id === e.target.value);
              setSelectedForm(found || null);
              if (found?.fields?.length > 0) setSelectedField(found.fields[0]);
            }}
            className="form-input w-72 text-xs font-bold"
          >
            {forms.map(f => (
              <option key={f.id} value={f.id}>{f.title} ({f.form_name})</option>
            ))}
          </select>
        </div>

        {selectedForm && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={Eye} onClick={() => setIsPreviewOpen(true)}>
              Preview & Test Live Form
            </Button>
          </div>
        )}
      </div>

      {/* FIELD PALETTE */}
      <div className="standard-card space-y-4">
        <div>
          <h3 className="section-title text-sm font-bold flex items-center gap-2 text-[#172033]">
            <Layers className="w-5 h-5 text-[#1B4E9B]" /> Field Palette
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">Click any field type below to add it to the selected form canvas.</p>
        </div>

        {/* Responsive Grid for Field Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {supportedTypes.map((st) => {
            const Icon = st.icon;
            return (
              <button
                key={st.type}
                type="button"
                onClick={() => handleAddFieldClick(st)}
                className="min-h-[52px] p-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#1B4E9B] hover:bg-[#F8FBFF] transition-all flex items-center gap-2.5 text-left group shadow-xs hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="w-[30px] h-[30px] rounded-[7px] bg-[#EAF1FB] text-[#1B4E9B] flex items-center justify-center shrink-0 group-hover:bg-[#1B4E9B] group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[12px] font-semibold text-[#1E293B] truncate leading-tight">
                  {st.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Canvas & Field Config Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CENTER COLUMN: Form Preview / Canvas (7 Cols) */}
        <div className="lg:col-span-7 standard-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div>
              <h3 className="section-title text-sm font-bold text-[#1F2937]">
                {selectedForm ? selectedForm.title : 'Form Preview Canvas'}
              </h3>
              <p className="helper-text">{selectedForm ? `Code Key: ${selectedForm.form_name} | Module: ${selectedForm.module}` : 'No form selected'}</p>
            </div>
            <span className="badge badge-info">{selectedForm?.fields?.length || 0} fields configured</span>
          </div>

          {selectedForm ? (
            <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg space-y-3 min-h-[350px] max-h-[600px] overflow-y-auto custom-scrollbar">
              {(selectedForm.fields || []).length === 0 ? (
                <div className="p-12 text-center text-[#6B7280] italic">
                  Canvas empty. Select fields from the Field Palette above to build form.
                </div>
              ) : (
                selectedForm.fields.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedField(f)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedField?.id === f.id
                        ? 'bg-white border-[#1B4E9B] shadow-md ring-1 ring-[#1B4E9B]'
                        : 'bg-white border-[#E5E7EB] hover:border-[#9C9D9E]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="form-label mb-0 font-bold text-sm">
                        {f.field_name} {f.required && <span className="text-[#DC2626]">*</span>}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {f.reference_table && (
                          <span className="badge badge-info text-[10px] flex items-center gap-1">
                            <Database className="w-3 h-3" /> Master: {f.reference_table}
                          </span>
                        )}
                        <span className="badge badge-neutral text-[10px] font-mono">{f.field_type}</span>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-[#6B7280] font-mono flex items-center justify-between">
                      <span>Key: <strong className="text-[#374151]">{f.field_code}</strong></span>
                      <button onClick={(e) => { e.stopPropagation(); handleEditFieldClick(f); }} className="text-[#1B4E9B] hover:underline font-sans text-xs font-semibold">
                        Configure Specs →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-[#6B7280] italic">Select a form from the dropdown to load preview.</div>
          )}
        </div>

        {/* RIGHT COLUMN: Field Configuration (5 Cols) */}
        <div className="lg:col-span-5 standard-card space-y-4">
          <h3 className="section-title text-xs uppercase tracking-wider flex items-center gap-1.5 text-[#1B4E9B] font-bold">
            <Settings className="w-4 h-4" /> Field Configuration Inspector
          </h3>

          {selectedField ? (
            <div className="space-y-4">
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-xs font-semibold text-[#1B4E9B]">
                Inspecting: {selectedField.field_name} (Sort Order #{selectedField.field_order})
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="form-label mb-1">Field Label:</span>
                  <p className="font-bold text-[#1F2937] p-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded">{selectedField.field_name}</p>
                </div>
                <div>
                  <span className="form-label mb-1">Field Code Key:</span>
                  <p className="font-mono text-[#374151] p-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded">{selectedField.field_code}</p>
                </div>
                <div>
                  <span className="form-label mb-1">Type & Validation:</span>
                  <p className="font-semibold text-[#1F2937] p-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded">
                    {selectedField.field_type} ({selectedField.required ? 'Mandatory' : 'Optional'})
                  </p>
                </div>
                {selectedField.reference_table && (
                  <div>
                    <span className="form-label mb-1 text-[#1B4E9B] font-bold flex items-center gap-1">
                      <Database className="w-3.5 h-3.5" /> Master Table Source:
                    </span>
                    <p className="font-mono text-[#1B4E9B] font-bold p-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded">
                      {selectedField.reference_table}
                    </p>
                  </div>
                )}
                {selectedField.options && (
                  <div>
                    <span className="form-label mb-1">Custom Options:</span>
                    <p className="font-mono text-[#374151] p-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded">{selectedField.options}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#E5E7EB]">
                <Button variant="secondary" className="flex-1 text-xs" onClick={() => handleEditFieldClick(selectedField)}>
                  Edit Field Specs
                </Button>
                <Button variant="danger" className="text-xs" onClick={() => handleDeleteField(selectedField.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[#6B7280] italic">Select a field on the canvas to configure properties.</div>
          )}
        </div>
      </div>

      {/* Form Definition Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} size="md" title={editingFormId ? "Edit Form Definition" : "Create Dynamic Form"}>
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
              <label className="form-label">Module / Domain *</label>
              <input
                type="text"
                value={formInput.module}
                onChange={(e) => setFormInput({ ...formInput, module: e.target.value })}
                className="form-input"
                required
                placeholder="e.g., process_engine, core, masters"
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
              placeholder="Optional notes or instructions for users filling this form"
            ></textarea>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setIsFormModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Form
            </button>
          </div>
        </form>
      </Modal>

      {/* Field Definition Modal */}
      <Modal isOpen={isFieldModalOpen} onClose={() => setIsFieldModalOpen(false)} size="md" title={editingFieldId ? "Edit Form Field" : "Add Form Field"}>
        <form onSubmit={handleFieldSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Field Name / Label *</label>
              <input
                type="text"
                value={fieldInput.field_name}
                onChange={(e) => setFieldInput({ ...fieldInput, field_name: e.target.value })}
                className="form-input"
                required
                placeholder="e.g., Facility / Plant"
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
                placeholder="e.g., plant_id"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Supported Field Type *</label>
              <select
                value={fieldInput.field_type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setFieldInput({
                    ...fieldInput,
                    field_type: newType,
                    reference_table: (newType === 'reference' || newType === 'select') ? (fieldInput.reference_table || 'plants') : '',
                  });
                }}
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
                min="1"
                value={fieldInput.field_order}
                onChange={(e) => setFieldInput({ ...fieldInput, field_order: parseInt(e.target.value) || 1 })}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Special Configuration for Dropdown / Reference fields */}
          {(fieldInput.field_type === 'select' || fieldInput.field_type === 'reference') && (
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-3">
              <label className="form-label text-xs uppercase tracking-wider text-[#1B4E9B] font-bold mb-1">
                Dropdown Options Source
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOptionSourceType('master_table')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    optionSourceType === 'master_table'
                      ? 'bg-[#1B4E9B] text-white border-[#1B4E9B]'
                      : 'bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" /> Fetch from Master Table
                </button>
                <button
                  type="button"
                  onClick={() => setOptionSourceType('static_options')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    optionSourceType === 'static_options'
                      ? 'bg-[#1B4E9B] text-white border-[#1B4E9B]'
                      : 'bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <ChevronDownSquare className="w-3.5 h-3.5" /> Custom Options
                </button>
              </div>

              {optionSourceType === 'master_table' ? (
                <div>
                  <label className="form-label">Select Master Table to Fetch Options *</label>
                  <select
                    value={fieldInput.reference_table || 'plants'}
                    onChange={(e) => setFieldInput({ ...fieldInput, reference_table: e.target.value })}
                    className="form-input"
                    required
                  >
                    {MASTER_TABLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#6B7280] mt-1 italic">
                    The dropdown will automatically query and display live records from the chosen ERP master table.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="form-label">Custom Comma-Separated Options *</label>
                  <input
                    type="text"
                    value={fieldInput.options}
                    onChange={(e) => setFieldInput({ ...fieldInput, options: e.target.value })}
                    className="form-input"
                    placeholder="e.g. Shift 1, Shift 2, Shift 3 or Low, Medium, High"
                    required
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="reqCheck"
              checked={fieldInput.required}
              onChange={(e) => setFieldInput({ ...fieldInput, required: e.target.checked })}
              className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
            />
            <label htmlFor="reqCheck" className="text-xs text-[#374151] cursor-pointer font-semibold">
              Mark Field as Mandatory / Required
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setIsFieldModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Field
            </button>
          </div>
        </form>
      </Modal>

      {/* Live Form Preview Modal */}
      {isPreviewOpen && selectedForm && (
        <Modal isOpen={true} onClose={() => setIsPreviewOpen(false)} size="lg" title={`Live Form Execution: ${selectedForm.title}`}>
          <div className="p-2">
            <GenericFormRenderer
              formConfig={selectedForm}
              onSubmit={(val) => {
                alert("Successfully submitted form data:\n\n" + JSON.stringify(val, null, 2));
                setIsPreviewOpen(false);
              }}
              onCancel={() => setIsPreviewOpen(false)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
