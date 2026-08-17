import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, width, size = 'md', height, modalConfig, footer, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const displayTitle = modalConfig?.title || title || 'Dialog Window';
  const modalSize = size || modalConfig?.size || (width && parseInt(width) <= 450 ? 'sm' : width && parseInt(width) >= 900 ? 'lg' : 'md');
  const sizeClass = modalSize === 'sm' ? 'modal-sm' : modalSize === 'xl' ? 'modal-xl' : modalSize === 'lg' ? 'modal-lg' : 'modal-md';

  const customWidth = modalConfig?.width || width;
  const customHeight = modalConfig?.height || height;

  return createPortal(
    <div className="modal-portal-overlay" onClick={onClose}>
      <div
        className={`modal-portal-card ${sizeClass}`}
        style={{
          ...(customWidth ? { width: customWidth } : {}),
          ...(customHeight ? { maxHeight: customHeight } : {})
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">{displayTitle}</h3>
          <button
            onClick={onClose}
            className="btn-icon"
            title="Close modal"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="modal-portal-body custom-scrollbar">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
