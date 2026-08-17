import React from 'react';
import { Search } from 'lucide-react';

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  ...props
}) {
  return (
    <div className={`search-input-wrapper ${className}`.trim()}>
      <Search className="search-input-icon" />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input-field"
        {...props}
      />
    </div>
  );
}
