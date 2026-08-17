import React from 'react';

export default function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  min,
  max,
  step,
  disabled = false,
  error,
  helperText,
  className = '',
  ...props
}) {
  const isNumber = type === 'number' || type === 'currency';

  const handleChange = (e) => {
    if (!onChange) return;
    if (isNumber && (min !== undefined || props.preventNegative)) {
      const val = e.target.value;
      const minVal = min !== undefined ? Number(min) : 0;
      if (val === '' || Number(val) >= minVal) {
        onChange(e);
      }
    } else {
      onChange(e);
    }
  };

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span className="text-[#DC2626]">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type === 'currency' ? 'number' : type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        min={isNumber && min === undefined ? '0' : min}
        max={max}
        step={step || (type === 'currency' ? '0.01' : undefined)}
        disabled={disabled}
        className={`form-input ${error ? 'border-[#DC2626]' : ''} ${className}`.trim()}
        {...props}
      />
      {error && <p className="text-[11px] text-[#DC2626] mt-1">{error}</p>}
      {helperText && !error && <p className="helper-text mt-1">{helperText}</p>}
    </div>
  );
}
