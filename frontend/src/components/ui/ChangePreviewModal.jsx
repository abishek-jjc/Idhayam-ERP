import React from 'react';
import { Check, Eye, ShieldCheck } from 'lucide-react';
import Modal from '../Modal';

export default function ChangePreviewModal({ isOpen, onClose, onConfirm, configType, oldValues, newValues, itemName }) {
  const keys = Array.from(new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]));

  const applyChanges = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Preview Configuration Changes">
      <div className="change-preview-dialog">
        <div className="dependency-heading">
          <span className="page-header-icon"><Eye /></span>
          <div>
            <p className="workspace-kicker">Change review</p>
            <p className="helper-text">Reviewing modifications for {itemName || configType}</p>
          </div>
        </div>

        <div className="change-preview-target">
          <span>Target module: <strong>{configType}</strong></span>
          <span>Ready to propagate to live ERP</span>
        </div>

        <div className="table-container overflow-x-auto">
          <table className="custom-table change-preview-table">
            <thead><tr><th>Property</th><th>Current value</th><th>Proposed value</th></tr></thead>
            <tbody>
              {keys.map((key) => {
                const oldValue = oldValues?.[key];
                const newValue = newValues?.[key];
                const changed = JSON.stringify(oldValue) !== JSON.stringify(newValue);
                return (
                  <tr key={key} className={changed ? 'is-changed' : 'is-unchanged'}>
                    <td><strong>{key}</strong></td>
                    <td className="change-old-value">{oldValue !== null && oldValue !== undefined ? String(oldValue) : '(empty)'}</td>
                    <td><span className="change-new-value">{newValue !== null && newValue !== undefined ? String(newValue) : '(empty)'}</span>{changed && <span className="status-badge status-success">Modified</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="change-preview-footer">
          <p><ShieldCheck /> Safety validated and audited before saving</p>
          <div><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={applyChanges}><Check /> Apply Changes to Live ERP</button></div>
        </div>
      </div>
    </Modal>
  );
}
