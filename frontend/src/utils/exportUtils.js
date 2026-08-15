/**
 * Export data array to CSV / Excel format
 */
export function exportToCSV(filename, headers, rows) {
  if (!rows || !rows.length) return;

  const headerRow = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',');
  const bodyRows = rows.map(row => {
    return headers.map(h => {
      let val = h.key.split('.').reduce((obj, key) => obj?.[key], row);
      if (val === null || val === undefined) val = '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headerRow, ...bodyRows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Print or Export HTML table as PDF
 */
export function exportToPDF(title, elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
          h2 { color: #2563eb; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 12px; }
          th { background-color: #f1f5f9; font-weight: bold; }
          tr:nth-child(even) { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        ${element.outerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
}
