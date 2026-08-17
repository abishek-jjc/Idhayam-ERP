import React from 'react';

export default function Card({ children, title, subtitle, className = '', headerActions = null, ...props }) {
  return (
    <div className={`card ${className}`.trim()} {...props}>
      {(title || headerActions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="helper-text mt-0.5">{subtitle}</p>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
