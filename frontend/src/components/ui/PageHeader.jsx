import React from 'react';
import Breadcrumb from './Breadcrumb';

export default function PageHeader({ title, description, actions = null, breadcrumbItems = null }) {
  return (
    <div className="page-header-container">
      <div>
        <Breadcrumb items={breadcrumbItems} />
        <h1 className="page-title">{title}</h1>
        {description && <p className="helper-text" style={{ marginTop: '4px' }}>{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
