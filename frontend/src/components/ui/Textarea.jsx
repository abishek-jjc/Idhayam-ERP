import React from 'react';

export default function Textarea({
  label,
  id,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 3,
  disabled = false,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span className="text-[#DC2626]">*</span>}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        disabled={disabled}
        className={`form-input ${error ? 'border-[#DC2626]' : ''} ${className}`.trim()}
        {...props}
      />
      {error && <p className="text-[11px] text-[#DC2626] mt-1">{error}</p>}
    </div>
  );
}
