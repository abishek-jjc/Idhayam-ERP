import React from 'react';
import Breadcrumb from './Breadcrumb';

export default function PageHeader({ title, description, icon: Icon = null, actions = null, breadcrumbItems = null }) {
  return (
    <div className="page-header-container">
      <div>
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex items-center gap-3">
          {Icon && <span className="page-header-icon"><Icon /></span>}
          <h1 className="page-title">{title}</h1>
        </div>
        {description && <p className="helper-text" style={{ marginTop: '4px' }}>{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
