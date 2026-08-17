import React from 'react';

export default function Select({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder,
  required = false,
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
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`form-input ${error ? 'border-[#DC2626]' : ''} ${className}`.trim()}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
      {error && <p className="text-[11px] text-[#DC2626] mt-1">{error}</p>}
    </div>
  );
}
