import React from 'react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = 'md', // 'md' (38px) | 'sm' (32px)
  icon: Icon = null,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  let variantClass = 'btn-primary';
  if (variant === 'secondary') variantClass = 'btn-secondary';
  if (variant === 'danger') variantClass = 'btn-danger';
  if (variant === 'ghost') variantClass = 'btn-ghost';

  const sizeClass = size === 'sm' ? 'btn-sm' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
