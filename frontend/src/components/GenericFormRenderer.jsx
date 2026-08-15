import React, { useState } from 'react';

export default function GenericFormRenderer({ formConfig, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({});

  if (!formConfig) return null;

  const fields = formConfig.fields || [];

  const handleChange = (code, val) => {
    setFormData(prev => ({ ...prev, [code]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formConfig.title && (
        <div className="pb-3 border-b border-white/10">
          <h3 className="text-base font-bold text-white">{formConfig.title}</h3>
          {formConfig.description && (
            <p className="text-xs text-slate-400 mt-1">{formConfig.description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {fields.filter(f => f.active).map((field) => {
          const val = formData[field.field_code] || field.default_value || '';
          const type = field.field_type;

          if (type === 'select') {
            const opts = (field.options || '').split(',').map(o => o.trim()).filter(Boolean);
            return (
              <div key={field.id || field.field_code} className="col-span-1">
                <label className="form-label">{field.field_name} {field.required && '*'}</label>
                <select
                  value={val}
                  onChange={(e) => handleChange(field.field_code, e.target.value)}
                  className="form-input"
                  required={field.required}
                >
                  <option value="">Select {field.field_name}</option>
                  {opts.map((o, idx) => (
                    <option key={idx} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            );
          }

          if (type === 'textarea') {
            return (
              <div key={field.id || field.field_code} className="col-span-2">
                <label className="form-label">{field.field_name} {field.required && '*'}</label>
                <textarea
                  value={val}
                  onChange={(e) => handleChange(field.field_code, e.target.value)}
                  className="form-input"
                  rows="3"
                  required={field.required}
                ></textarea>
              </div>
            );
          }

          if (type === 'boolean') {
            return (
              <div key={field.id || field.field_code} className="col-span-1 flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id={field.field_code}
                  checked={!!val}
                  onChange={(e) => handleChange(field.field_code, e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/10"
                />
                <label htmlFor={field.field_code} className="text-xs font-semibold text-slate-200 cursor-pointer">
                  {field.field_name}
                </label>
              </div>
            );
          }

          let inputType = 'text';
          if (type === 'number') inputType = 'number';
          else if (type === 'date') inputType = 'date';
          else if (type === 'time') inputType = 'time';
          else if (type === 'datetime') inputType = 'datetime-local';
          else if (type === 'email') inputType = 'email';
          else if (type === 'phone') inputType = 'tel';
          else if (type === 'password') inputType = 'password';
          else if (type === 'url') inputType = 'url';
          else if (type === 'file') inputType = 'file';

          return (
            <div key={field.id || field.field_code} className="col-span-1">
              <label className="form-label">{field.field_name} {field.required && '*'}</label>
              <input
                type={inputType}
                value={inputType === 'file' ? undefined : val}
                onChange={(e) => handleChange(field.field_code, inputType === 'file' ? e.target.files[0]?.name : e.target.value)}
                className="form-input"
                required={field.required}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
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
