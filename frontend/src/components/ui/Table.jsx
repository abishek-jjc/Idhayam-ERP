import React from 'react';

export default function Table({ headers = [], children, emptyMessage = 'No data records available.', className = '' }) {
  return (
    <div className={`table-container overflow-x-auto custom-scrollbar ${className}`.trim()}>
      <table className="custom-table">
        {headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} className={typeof header === 'object' && header.align === 'right' ? 'text-right' : ''}>
                  {typeof header === 'object' ? header.label : header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
}
