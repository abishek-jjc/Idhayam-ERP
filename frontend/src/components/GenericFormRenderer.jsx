import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Loader2 } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

const MASTER_TABLE_MAP = {
  // Companies (core_company)
  companies: { endpoint: '/api/core/companies/', label: 'Companies' },
  company: { endpoint: '/api/core/companies/', label: 'Companies' },
  company_id: { endpoint: '/api/core/companies/', label: 'Companies' },
  'core.company': { endpoint: '/api/core/companies/', label: 'Companies' },
  core_company: { endpoint: '/api/core/companies/', label: 'Companies' },

  // Plants (core_plant)
  plants: { endpoint: '/api/core/plants/', label: 'Plants & Facilities' },
  plant: { endpoint: '/api/core/plants/', label: 'Plants & Facilities' },
  plant_id: { endpoint: '/api/core/plants/', label: 'Plants & Facilities' },
  'core.plant': { endpoint: '/api/core/plants/', label: 'Plants & Facilities' },
  core_plant: { endpoint: '/api/core/plants/', label: 'Plants & Facilities' },

  // Departments (core_department)
  departments: { endpoint: '/api/core/departments/', label: 'Departments' },
  department: { endpoint: '/api/core/departments/', label: 'Departments' },
  department_id: { endpoint: '/api/core/departments/', label: 'Departments' },
  owning_department: { endpoint: '/api/core/departments/', label: 'Owning Department' },
  owning_department_id: { endpoint: '/api/core/departments/', label: 'Owning Department' },
  'core.department': { endpoint: '/api/core/departments/', label: 'Departments' },
  core_department: { endpoint: '/api/core/departments/', label: 'Departments' },

  // Designations (core_designation)
  designations: { endpoint: '/api/core/designations/', label: 'Designations' },
  designation: { endpoint: '/api/core/designations/', label: 'Designations' },
  designation_id: { endpoint: '/api/core/designations/', label: 'Designations' },
  'core.designation': { endpoint: '/api/core/designations/', label: 'Designations' },
  core_designation: { endpoint: '/api/core/designations/', label: 'Designations' },

  // Employees (core_employee)
  employees: { endpoint: '/api/core/employees/', label: 'Employees' },
  employee: { endpoint: '/api/core/employees/', label: 'Employees' },
  employee_id: { endpoint: '/api/core/employees/', label: 'Employees' },
  performed_by: { endpoint: '/api/core/employees/', label: 'Performed By Employee' },
  performed_by_id: { endpoint: '/api/core/employees/', label: 'Performed By Employee' },
  'core.employee': { endpoint: '/api/core/employees/', label: 'Employees' },
  core_employee: { endpoint: '/api/core/employees/', label: 'Employees' },

  // Machines (core_machine)
  machines: { endpoint: '/api/core/machines/', label: 'Machines & Vehicles' },
  machine: { endpoint: '/api/core/machines/', label: 'Machines & Vehicles' },
  machine_id: { endpoint: '/api/core/machines/', label: 'Machines & Vehicles' },
  'core.machine': { endpoint: '/api/core/machines/', label: 'Machines & Vehicles' },
  core_machine: { endpoint: '/api/core/machines/', label: 'Machines & Vehicles' },

  // Vendors (core_vendor)
  vendors: { endpoint: '/api/core/vendors/', label: 'Vendors' },
  vendor: { endpoint: '/api/core/vendors/', label: 'Vendors' },
  vendor_id: { endpoint: '/api/core/vendors/', label: 'Vendors' },
  'core.vendor': { endpoint: '/api/core/vendors/', label: 'Vendors' },
  core_vendor: { endpoint: '/api/core/vendors/', label: 'Vendors' },

  // Storage Locations & Blocks (core_storagelocation)
  storage_locations: { endpoint: '/api/core/storage-locations/', label: 'Storage Bins' },
  storage_location: { endpoint: '/api/core/storage-locations/', label: 'Storage Bins' },
  storage_location_id: { endpoint: '/api/core/storage-locations/', label: 'Storage Bins' },
  storage: { endpoint: '/api/core/storage-locations/', label: 'Storage Bins' },
  storage_location_block: { endpoint: '/api/core/storage-locations/', label: 'Storage Location Block' },
  storage_location_block_id: { endpoint: '/api/core/storage-locations/', label: 'Storage Location Block' },
  core_storagelocation: { endpoint: '/api/core/storage-locations/', label: 'Storage Bins' },

  // Master Categories (masters_mastercategory)
  master_categories: { endpoint: '/api/masters/categories/', label: 'Master Categories' },
  categories: { endpoint: '/api/masters/categories/', label: 'Master Categories' },
  category: { endpoint: '/api/masters/categories/', label: 'Master Categories' },
  category_id: { endpoint: '/api/masters/categories/', label: 'Master Categories' },
  master_category_id: { endpoint: '/api/masters/categories/', label: 'Master Categories' },
  'masters.mastercategory': { endpoint: '/api/masters/categories/', label: 'Master Categories' },
  masters_mastercategory: { endpoint: '/api/masters/categories/', label: 'Master Categories' },

  // Master Items (masters_masteritem)
  master_items: { endpoint: '/api/masters/items/', label: 'Master Items' },
  items: { endpoint: '/api/masters/items/', label: 'Master Items' },
  item: { endpoint: '/api/masters/items/', label: 'Master Items' },
  master_item: { endpoint: '/api/masters/items/', label: 'Master Items' },
  master_item_id: { endpoint: '/api/masters/items/', label: 'Master Items' },
  'masters.masteritem': { endpoint: '/api/masters/items/', label: 'Master Items' },
  masters_masteritem: { endpoint: '/api/masters/items/', label: 'Master Items' },

  // Master Item Versions (masters_masteritemversion)
  master_item_version: { endpoint: '/api/masters/versions/', label: 'Master Item Versions' },
  master_item_versions: { endpoint: '/api/masters/versions/', label: 'Master Item Versions' },
  'masters.masteritemversion': { endpoint: '/api/masters/versions/', label: 'Master Item Versions' },
  masters_masteritemversion: { endpoint: '/api/masters/versions/', label: 'Master Item Versions' },

  // Process Instances (process_engine_processinstance)
  process_instance: { endpoint: '/api/process/instances/', label: 'Process Instances' },
  process_instances: { endpoint: '/api/process/instances/', label: 'Process Instances' },
  'process_engine.processinstance': { endpoint: '/api/process/instances/', label: 'Process Instances' },
  process_engine_processinstance: { endpoint: '/api/process/instances/', label: 'Process Instances' },

  // Process Types (process_engine_processtype)
  process_types: { endpoint: '/api/process/types/', label: 'Process Types' },
  process_type: { endpoint: '/api/process/types/', label: 'Process Types' },
  process_type_id: { endpoint: '/api/process/types/', label: 'Process Types' },
  'process_engine.processtype': { endpoint: '/api/process/types/', label: 'Process Types' },
  process_engine_processtype: { endpoint: '/api/process/types/', label: 'Process Types' },
};

const resolveMasterConfig = (field) => {
  const keysToTry = [
    field.reference_table,
    field.reference_model,
    field.field_code,
    field.code,
    field.field_name,
  ]
    .filter(Boolean)
    .map((k) => String(k).toLowerCase().trim());

  for (const k of keysToTry) {
    if (MASTER_TABLE_MAP[k]) {
      return { key: k, config: MASTER_TABLE_MAP[k] };
    }
  }
  return null;
};

export default function GenericFormRenderer({ formConfig, initialValues = {}, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(() => initialValues || {});
  const [masterOptions, setMasterOptions] = useState({});
  const [loadingMasters, setLoadingMasters] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData((prev) => {
        const hasExistingKeys = Object.keys(prev).length > 0;
        return hasExistingKeys ? prev : initialValues;
      });
    }
  }, [initialValues]);

  useEffect(() => {
    if (!formConfig || !formConfig.fields) return;

    const refFields = formConfig.fields.filter(
      (f) =>
        f.active !== false &&
        (f.field_type === 'reference' ||
          f.field_type === 'relationship' ||
          f.field_type === 'master_reference' ||
          (f.field_type === 'select' && (f.reference_table || resolveMasterConfig(f))))
    );

    refFields.forEach((field) => {
      const match = resolveMasterConfig(field);
      if (match) {
        const { key, config } = match;
        if (!masterOptions[key] && !loadingMasters[key]) {
          setLoadingMasters((prev) => ({ ...prev, [key]: true }));
          axios
            .get(`${API_BASE}${config.endpoint}`)
            .then((res) => {
              const list = res.data?.results || res.data || [];
              setMasterOptions((prev) => ({ ...prev, [key]: list }));
            })
            .catch((err) => {
              console.error(`Failed to fetch master options for ${key}:`, err);
              setMasterOptions((prev) => ({ ...prev, [key]: [] }));
            })
            .finally(() => {
              setLoadingMasters((prev) => ({ ...prev, [key]: false }));
            });
        }
      }
    });
  }, [formConfig]);

  if (!formConfig) return null;

  const fields = (formConfig.fields || []).slice().sort((a, b) => (a.field_order || 0) - (b.field_order || 0));

  const handleChange = (code, val) => {
    setFormData((prev) => ({ ...prev, [code]: val }));
    if (validationErrors[code]) {
      setValidationErrors((prev) => ({ ...prev, [code]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    fields.filter((field) => field.active !== false).forEach((field) => {
      const fieldCode = field.field_code || field.code || field.name;
      if (!fieldCode) return;
      if (field.conditional_field && String(formData[field.conditional_field] ?? '') !== String(field.conditional_value ?? '')) return;
      
      const value = formData[fieldCode] !== undefined && formData[fieldCode] !== null ? formData[fieldCode] : (field.default_value ?? '');
      if (field.required && (value === '' || value === null || (Array.isArray(value) && value.length === 0))) {
        errors[fieldCode] = `${field.field_name || fieldCode} is required.`;
      }
      if (value !== '' && field.validation_regex) {
        try {
          if (!new RegExp(field.validation_regex).test(String(value))) {
            errors[fieldCode] = field.validation_message || `${field.field_name || fieldCode} has an invalid format.`;
          }
        } catch {
          errors[fieldCode] = 'Administrator configured an invalid validation pattern.';
        }
      }
      if (field.min_length && String(value).length < field.min_length) {
        errors[fieldCode] = `${field.field_name || fieldCode} must contain at least ${field.min_length} characters.`;
      }
      if (field.max_length && String(value).length > field.max_length) {
        errors[fieldCode] = `${field.field_name || fieldCode} cannot exceed ${field.max_length} characters.`;
      }
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
          const fieldCode = field.field_code || field.code || field.name;
          if (!fieldCode) return null;

          if (field.conditional_field && String(formData[field.conditional_field] ?? '') !== String(field.conditional_value ?? '')) return null;

          const val = formData[fieldCode] !== undefined && formData[fieldCode] !== null ? formData[fieldCode] : (field.default_value || '');
          const type = field.field_type;
          const masterMatch = resolveMasterConfig(field);
          const isMasterRef = Boolean(
            masterMatch ||
              type === 'reference' ||
              type === 'relationship' ||
              type === 'master_reference' ||
              (type === 'select' && field.reference_table)
          );
          const spanStyle = { gridColumn: `span ${Math.max(1, Math.min(2, Number(field.column_span || 1)))}` };
          const help = field.help_text || validationErrors[fieldCode];

          // Master Reference Dropdown
          if (isMasterRef && masterMatch) {
            const tableKey = masterMatch.key;
            const options = masterOptions[tableKey] || [];
            const isLoading = loadingMasters[tableKey];
            const masterInfo = masterMatch.config;

            return (
              <div key={field.id || fieldCode} className="space-y-1" style={spanStyle}>
                <div className="flex items-center justify-between">
                  <label className="form-label mb-0">
                    {field.field_name || fieldCode} {field.required && <span className="text-[#DC2626]">*</span>}
                  </label>
                  <span className="text-[10px] text-[#1B4E9B] font-semibold flex items-center gap-1">
                    <Database className="w-3 h-3" /> {masterInfo?.label || tableKey}
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={val}
                    onChange={(e) => handleChange(fieldCode, e.target.value)}
                    className="form-input"
                    required={field.required}
                    disabled={Boolean(isLoading || field.read_only)}
                  >
                    <option value="">
                      {isLoading ? 'Loading master options...' : `-- Select ${field.field_name || fieldCode} --`}
                    </option>
                    {options.map((item) => {
                      const id = item.id || item.code;
                      const displayTitle = item.name || item.title || item.start_code || item.code || item.id;
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
                    No records found in master table '{tableKey}'.
                  </p>
                )}
                {help && <p className={`text-[10px] ${validationErrors[fieldCode] ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>{help}</p>}
              </div>
            );
          }

          // Custom Select Dropdown / Multiselect / Radio
          if (type === 'select' || type === 'multiselect' || type === 'radio') {
            const opts = (field.options || '')
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean);

            if (type === 'radio') {
              return (
                <div key={field.id || fieldCode} className="space-y-2" style={spanStyle}>
                  <label className="form-label">{field.field_name || fieldCode} {field.required && <span className="text-[var(--danger)]">*</span>}</label>
                  <div className="flex flex-wrap gap-4">
                    {opts.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-xs">
                        <input
                          type="radio"
                          name={fieldCode}
                          value={option}
                          checked={val === option}
                          disabled={Boolean(field.read_only)}
                          onChange={(e) => handleChange(fieldCode, e.target.value)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {help && <p className={`text-[10px] ${validationErrors[fieldCode] ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>{help}</p>}
                </div>
              );
            }

            return (
              <div key={field.id || fieldCode} className="space-y-1" style={spanStyle}>
                <label className="form-label mb-0">
                  {field.field_name || fieldCode} {field.required && <span className="text-[#DC2626]">*</span>}
                </label>
                <select
                  value={type === 'multiselect' ? (Array.isArray(val) ? val : (val ? String(val).split(',') : [])) : val}
                  className="form-input"
                  required={field.required}
                  multiple={type === 'multiselect'}
                  disabled={Boolean(field.read_only)}
                  onChange={(e) => handleChange(fieldCode, type === 'multiselect' ? Array.from(e.target.selectedOptions, (option) => option.value) : e.target.value)}
                >
                  <option value="">-- Select {field.field_name || fieldCode} --</option>
                  {opts.map((o, idx) => (
                    <option key={idx} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {help && <p className={`text-[10px] ${validationErrors[fieldCode] ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>{help}</p>}
              </div>
            );
          }

          // Textarea
          if (type === 'textarea') {
            return (
              <div key={field.id || fieldCode} className="space-y-1" style={{ gridColumn: `span ${Math.max(1, Math.min(2, Number(field.column_span || 2)))}` }}>
                <label className="form-label mb-0">
                  {field.field_name || fieldCode} {field.required && <span className="text-[#DC2626]">*</span>}
                </label>
                <textarea
                  value={val}
                  onChange={(e) => handleChange(fieldCode, e.target.value)}
                  className="form-input"
                  rows="3"
                  required={field.required}
                  placeholder={field.placeholder || `Enter ${field.field_name || fieldCode}`}
                  readOnly={Boolean(field.read_only)}
                  minLength={field.min_length || undefined}
                  maxLength={field.max_length || undefined}
                ></textarea>
                {help && <p className={`text-[10px] ${validationErrors[fieldCode] ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>{help}</p>}
              </div>
            );
          }

          // Boolean Checkbox
          if (type === 'boolean') {
            return (
              <div key={field.id || fieldCode} className="col-span-1 flex items-center gap-2.5 pt-6">
                <input
                  type="checkbox"
                  id={fieldCode}
                  checked={val === true || val === 'true' || val === 1}
                  onChange={(e) => handleChange(fieldCode, e.target.checked)}
                  disabled={Boolean(field.read_only)}
                  className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
                />
                <label htmlFor={fieldCode} className="text-xs font-semibold text-[#374151] cursor-pointer">
                  {field.field_name || fieldCode} {field.required && <span className="text-[#DC2626]">*</span>}
                </label>
              </div>
            );
          }

          // Number
          if (type === 'number' || type === 'currency' || type === 'decimal') {
            return (
              <div key={field.id || fieldCode} className="space-y-1" style={spanStyle}>
                <label className="form-label mb-0">
                  {field.field_name || fieldCode} {type === 'currency' && '(₹)'} {field.required && <span className="text-[#DC2626]">*</span>}
                </label>
                <input
                  type="number"
                  step="any"
                  value={val}
                  onChange={(e) => handleChange(fieldCode, e.target.value)}
                  className="form-input"
                  required={field.required}
                  placeholder={field.placeholder || '0.00'}
                  readOnly={Boolean(field.read_only)}
                  min={field.min_value ?? undefined}
                  max={field.max_value ?? undefined}
                />
                {help && <p className={`text-[10px] ${validationErrors[fieldCode] ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>{help}</p>}
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
            <div key={field.id || fieldCode} className="space-y-1" style={spanStyle}>
              <label className="form-label mb-0">
                {field.field_name || fieldCode} {field.required && <span className="text-[#DC2626]">*</span>}
              </label>
              <input
                type={inputType}
                value={inputType === 'file' ? undefined : val}
                onChange={(e) =>
                  handleChange(
                    fieldCode,
                    inputType === 'file' ? e.target.files[0]?.name : e.target.value
                  )
                }
                className="form-input"
                required={field.required}
                placeholder={field.placeholder || `Enter ${field.field_name || fieldCode}`}
                readOnly={Boolean(field.read_only)}
                disabled={Boolean(field.read_only && inputType === 'file')}
                minLength={field.min_length || undefined}
                maxLength={field.max_length || undefined}
                pattern={field.validation_regex || undefined}
                title={field.validation_message || undefined}
                accept={type === 'image' ? 'image/*' : undefined}
              />
              {help && <p className={`text-[10px] ${validationErrors[fieldCode] ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>{help}</p>}
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
