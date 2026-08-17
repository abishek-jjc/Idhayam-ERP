import React from 'react';
import { Search } from 'lucide-react';

export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  children,
  className = '',
}) {
  return (
    <div className={`filter-bar ${className}`.trim()}>
      {onSearchChange !== undefined && (
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
          <input
            type="text"
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="form-input pl-9"
          />
        </div>
      )}
      {children}
    </div>
  );
}
