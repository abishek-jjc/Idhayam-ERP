import React from 'react';

export default function IconButton({
  icon: Icon,
  variant = 'view', // 'view' | 'edit' | 'delete' | 'reset' | 'default'
  title,
  onClick,
  ariaLabel,
  disabled = false,
  className = '',
  ...props
}) {
  let variantClass = 'btn-icon';
  if (variant === 'view') variantClass = 'btn-action-view';
  if (variant === 'edit') variantClass = 'btn-action-edit';
  if (variant === 'delete') variantClass = 'btn-action-delete';
  if (variant === 'reset') variantClass = 'btn-action-reset';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title || ariaLabel}
      aria-label={ariaLabel || title}
      className={`${variantClass} ${className}`.trim()}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
    </button>
  );
}
