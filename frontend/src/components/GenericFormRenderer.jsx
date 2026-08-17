import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Link as LinkIcon, Loader2 } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

const MASTER_TABLE_MAP = {
  companies: { endpoint: '/api/core/companies/', label: 'Companies' },
  company: { endpoint: '/api/core/companies/', label: 'Companies' },
  plants: { endpoint: '/api/core/plants/', label: 'Plants & Facilities' },
  plant: { endpoint: '/api/core/plants/', label: 'Plants & Facilities' },
  departments: { endpoint: '/api/core/departments/', label: 'Departments' },
  department: { endpoint: '/api/core/departments/', label: 'Departments' },
  designations: { endpoint: '/api/core/designations/', label: 'Designations' },
  designation: { endpoint: '/api/core/designations/', label: 'Designations' },
  employees: { endpoint: '/api/core/employees/', label: 'Employees' },
  employee: { endpoint: '/api/core/employees/', label: 'Employees' },
  machines: { endpoint: '/api/core/machines/', label: 'Machines & Vehicles' },
  machine: { endpoint: '/api/core/machines/', label: 'Machines & Vehicles' },
  vendors: { endpoint: '/api/core/vendors/', label: 'Vendors' },
  vendor: { endpoint: '/api/core/vendors/', label: 'Vendors' },
  storage_locations: { endpoint: '/api/core/storage-locations/', label: 'Storage Bins' },
  storage_location: { endpoint: '/api/core/storage-locations/', label: 'Storage Bins' },
  storage: { endpoint: '/api/core/storage-locations/', label: 'Storage Bins' },
  master_categories: { endpoint: '/api/masters/categories/', label: 'Master Categories' },
  categories: { endpoint: '/api/masters/categories/', label: 'Master Categories' },
  category: { endpoint: '/api/masters/categories/', label: 'Master Categories' },
  master_items: { endpoint: '/api/masters/items/', label: 'Master Items' },
  items: { endpoint: '/api/masters/items/', label: 'Master Items' },
  item: { endpoint: '/api/masters/items/', label: 'Master Items' },
  process_types: { endpoint: '/api/process/types/', label: 'Process Types' },
};

export default function GenericFormRenderer({ formConfig, initialValues = {}, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({});
  const [masterOptions, setMasterOptions] = useState({});
  const [loadingMasters, setLoadingMasters] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
    }
  }, [initialValues]);

  useEffect(() => {
    if (!formConfig || !formConfig.fields) return;

    const refFields = formConfig.fields.filter(
      (f) => f.active && (f.field_type === 'reference' || f.field_type === 'relationship' || (f.field_type === 'select' && f.reference_table))
    );

    const tablesToFetch = [...new Set(refFields.map((f) => f.reference_table?.toLowerCase().trim()).filter(Boolean))];

    tablesToFetch.forEach((tableKey) => {
      const config = MASTER_TABLE_MAP[tableKey];
      if (config && !masterOptions[tableKey]) {
        setLoadingMasters((prev) => ({ ...prev, [tableKey]: true }));
        axios
          .get(`${API_BASE}${config.endpoint}`)
          .then((res) => {
            const list = res.data?.results || res.data || [];
            setMasterOptions((prev) => ({ ...prev, [tableKey]: list }));
          })
          .catch((err) => {
            console.error(`Failed to fetch master options for ${tableKey}:`, err);
            setMasterOptions((prev) => ({ ...prev, [tableKey]: [] }));
          })
          .finally(() => {
            setLoadingMasters((prev) => ({ ...prev, [tableKey]: false }));
          });
      }
    });
  }, [formConfig]);

  if (!formConfig) return null;

  const fields = (formConfig.fields || []).slice().sort((a, b) => (a.field_order || 0) - (b.field_order || 0));

  const handleChange = (code, val) => {
    setFormData((prev) => ({ ...prev, [code]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    fields.filter((field) => field.active !== false).forEach((field) => {
      if (field.conditional_field && String(formData[field.conditional_field] ?? '') !== String(field.conditional_value ?? '')) return;
      const value = formData[field.field_code] ?? field.default_value ?? '';
      if (field.required && (value === '' || value === null || (Array.isArray(value) && value.length === 0))) errors[field.field_code] = `${field.field_name} is required.`;
      if (value !== '' && field.validation_regex) {
        try { if (!new RegExp(field.validation_regex).test(String(value))) errors[field.field_code] = field.validation_message || `${field.field_name} has an invalid format.`; } catch { errors[field.field_code] = 'Administrator configured an invalid validation pattern.'; }
      }
      if (field.min_length && String(value).length < field.min_length) errors[field.field_code] = `${field.field_name} must contain at least ${field.min_length} characters.`;
      if (field.max_length && String(value).length > field.max_length) errors[field.field_code] = `${field.field_name} cannot exceed ${field.max_length} characters.`;
      if (field.min_value !== null && field.min_value !== undefined && value !== '' && Number(value) < Number(field.min_value)) errors[field.field_code] = `${field.field_name} must be at least ${field.min_value}.`;
      if (field.max_value !== null && field.max_value !== undefined && value !== '' && Number(value) > Number(field.max_value)) errors[field.field_code] = `${field.field_name} cannot exceed ${field.max_value}.`;
    });
    setValidationErrors(errors);
    if (Object.keys(errors).length) return;
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans">
      {formConfig.title && (
        <div className="pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#1F2937]">{formConfig.title}</h3>
            {formConfig.module && (
              <span className="badge badge-neutral text-[10px] uppercase font-mono">{formConfig.module}</span>
            )}
          </div>
          {formConfig.description && (
            <p className="text-xs text-[#6B7280] mt-1">{formConfig.description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {fields.filter((f) => f.active !== false).map((field) => {
          if (field.conditional_field && String(formData[field.conditional_field] ?? '') !== String(field.conditional_value ?? '')) return null;
          const val = formData[field.field_code] !== undefined ? formData[field.field_code] : (field.default_value || '');
          const type = field.field_type;
          const refTable = field.reference_table?.toLowerCase().trim();
          const isMasterRef = (type === 'reference' || type === 'relationship' || (type === 'select' && refTable)) && refTable;
          const spanStyle = { gridColumn: `span ${Math.max(1, Math.min(2, Number(field.column_span || 1)))}` };
          const help = field.help_text || validationErrors[field.field_code];

          // Master Reference Dropdown
          if (isMasterRef) {
            const options = masterOptions[refTable] || [];
            const isLoading = loadingMasters[refTable];
            const masterInfo = MASTER_TABLE_MAP[refTable];

            return (
              <div key={field.id || field.field_code} className="space-y-1" style={spanStyle}>
                <div className="flex items-center justify-between">
                  <label className="form-label mb-0">
                    {field.field_name} {field.required && <span className="text-[#DC2626]">*</span>}
                  </label>
                  <span className="text-[10px] text-[#1B4E9B] font-semibold flex items-center gap-1">
                    <Database className="w-3 h-3" /> {masterInfo?.label || refTable}
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={val}
                    onChange={(e) => handleChange(field.field_code, e.target.value)}
                    className="form-input"
                    required={field.required}
                    disabled={isLoading || field.read_only}
                  >
                    <option value="">
                      {isLoading ? 'Loading master options...' : `-- Select ${field.field_name} --`}
                    </option>
                    {options.map((item) => {
                      const id = item.id || item.code;
                      const displayTitle = item.name || item.title || item.code || item.id;
                      const subText = item.code && item.code !== displayTitle ? ` [${item.code}]` : '';
                      return (
                        <option key={id} value={id}>
                          {displayTitle}{subText} ({id})
                        </option>
                      );
                    })}
                  </select>
                  {isLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#1B4E9B] absolute right-8 top-2.5 pointer-events-none" />
                  )}
                </div>
                {options.length === 0 && !isLoading && (
                  <p className="text-[10px] text-[#CA8A04] italic">
                    No records found in master table '{refTable}'.
                  </p>
                )}
                {help && <p className={`text-[10px] ${validationErrors[field.field_code] ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>{help}</p>}
              </div>
            );
          }

          // Custom Select Dropdown
          if (type === 'select' || type === 'multiselect' || type === 'radio') {
            const opts = (field.options || '')
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean);
            if (type === 'radio') return <div key={field.id || field.field_code} className="space-y-2" style={spanStyle}><label className="form-label">{field.field_name} {field.required && <span className="text-[var(--danger)]">*</span>}</label><div className="flex flex-wrap gap-4">{opts.map((option) => <label key={option} className="flex items-center gap-2 text-xs"><input type="radio" name={field.field_code} value={option} checked={val === option} disabled={field.read_only} onChange={(e) => handleChange(field.field_code, e.target.value)} /> {option}</label>)}</div>{help && <p className={`text-[10px] ${validationErrors[field.field_code] ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>{help}</p>}</div>;
            return (
              <div key={field.id || field.field_code} className="space-y-1" style={spanStyle}>
                <label className="form-label mb-0">
                  {field.field_name} {field.required && <span className="text-[#DC2626]">*</span>}
                </label>
                <select
                  value={type === 'multiselect' ? (Array.isArray(val) ? val : (val ? String(val).split(',') : [])) : val}
                  className="form-input"
                  required={field.required}
                  multiple={type === 'multiselect'}
                  disabled={field.read_only}
                  onChange={(e) => handleChange(field.field_code, type === 'multiselect' ? Array.from(e.target.selectedOptions, (option) => option.value) : e.target.value)}
                >
                  <option value="">-- Select {field.field_name} --</option>
                  {opts.map((o, idx) => (
                    <option key={idx} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {help && <p className={`text-[10px] ${validationErrors[field.field_code] ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>{help}</p>}
              </div>
            );
          }

          // Textarea
          if (type === 'textarea') {
            return (
              <div key={field.id || field.field_code} className="space-y-1" style={{ gridColumn: `span ${Math.max(1, Math.min(2, Number(field.column_span || 2)))}` }}>
                <label className="form-label mb-0">
                  {field.field_name} {field.required && <span className="text-[#DC2626]">*</span>}
                </label>
                <textarea
                  value={val}
                  onChange={(e) => handleChange(field.field_code, e.target.value)}
                  className="form-input"
                  rows="3"
                  required={field.required}
                  placeholder={field.placeholder || `Enter ${field.field_name}`}
                  readOnly={field.read_only}
                  minLength={field.min_length || undefined}
                  maxLength={field.max_length || undefined}
                ></textarea>
                {help && <p className={`text-[10px] ${validationErrors[field.field_code] ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>{help}</p>}
              </div>
            );
          }

          // Boolean Checkbox
          if (type === 'boolean') {
            return (
              <div key={field.id || field.field_code} className="col-span-1 flex items-center gap-2.5 pt-6">
                <input
                  type="checkbox"
                  id={field.field_code}
                  checked={val === true || val === 'true' || val === 1}
                  onChange={(e) => handleChange(field.field_code, e.target.checked)}
                  disabled={field.read_only}
                  className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
                />
                <label htmlFor={field.field_code} className="text-xs font-semibold text-[#374151] cursor-pointer">
                  {field.field_name} {field.required && <span className="text-[#DC2626]">*</span>}
                </label>
              </div>
            );
          }

          // Number
          if (type === 'number' || type === 'currency' || type === 'decimal') {
            return (
              <div key={field.id || field.field_code} className="space-y-1" style={spanStyle}>
                <label className="form-label mb-0">
                  {field.field_name} {type === 'currency' && '(₹)'} {field.required && <span className="text-[#DC2626]">*</span>}
                </label>
                <input
                  type="number"
                  step="any"
                  value={val}
                  onChange={(e) => handleChange(field.field_code, e.target.value)}
                  className="form-input"
                  required={field.required}
                  placeholder={field.placeholder || '0.00'}
                  readOnly={field.read_only}
                  min={field.min_value ?? undefined}
                  max={field.max_value ?? undefined}
                />
                {help && <p className={`text-[10px] ${validationErrors[field.field_code] ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>{help}</p>}
              </div>
            );
          }

          // Standard Inputs
          let inputType = 'text';
          if (type === 'date') inputType = 'date';
          else if (type === 'time') inputType = 'time';
          else if (type === 'datetime') inputType = 'datetime-local';
          else if (type === 'email') inputType = 'email';
          else if (type === 'phone') inputType = 'tel';
          else if (type === 'password') inputType = 'password';
          else if (type === 'url') inputType = 'url';
          else if (type === 'file' || type === 'image') inputType = 'file';

          return (
            <div key={field.id || field.field_code} className="space-y-1" style={spanStyle}>
              <label className="form-label mb-0">
                {field.field_name} {field.required && <span className="text-[#DC2626]">*</span>}
              </label>
              <input
                type={inputType}
                value={inputType === 'file' ? undefined : val}
                onChange={(e) =>
                  handleChange(
                    field.field_code,
                    inputType === 'file' ? e.target.files[0]?.name : e.target.value
                  )
                }
                className="form-input"
                required={field.required}
                placeholder={field.placeholder || `Enter ${field.field_name}`}
                readOnly={field.read_only}
                disabled={field.read_only && inputType === 'file'}
                minLength={field.min_length || undefined}
                maxLength={field.max_length || undefined}
                pattern={field.validation_regex || undefined}
                title={field.validation_message || undefined}
                accept={type === 'image' ? 'image/*' : undefined}
              />
              {help && <p className={`text-[10px] ${validationErrors[field.field_code] ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>{help}</p>}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary">
          Submit Form
        </button>
      </div>
    </form>
  );
}
