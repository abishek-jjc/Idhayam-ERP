import React from 'react';

export default function Badge({ children, variant = 'neutral', icon: Icon = null, className = '' }) {
  let badgeClass = 'badge-neutral';
  if (['success', 'active', 'approved', 'completed'].includes(variant.toLowerCase())) {
    badgeClass = 'badge-success';
  } else if (['warning', 'pending', 'in_progress', 'amended'].includes(variant.toLowerCase())) {
    badgeClass = 'badge-warning';
  } else if (['danger', 'rejected', 'inactive', 'cancelled'].includes(variant.toLowerCase())) {
    badgeClass = 'badge-danger';
  } else if (['info'].includes(variant.toLowerCase())) {
    badgeClass = 'badge-info';
  }

  return (
    <span className={`badge ${badgeClass} ${className}`.trim()}>
      {Icon && <Icon className="w-3 h-3" />}
      {children || variant}
    </span>
  );
}
