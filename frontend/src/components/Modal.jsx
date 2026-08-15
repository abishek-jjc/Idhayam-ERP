import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, width, height, modalConfig, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const displayTitle = modalConfig?.title || title || 'Dialog Window';
  const customWidth = modalConfig?.width || width || '600px';
  const customHeight = modalConfig?.height || height || 'auto';

  return createPortal(
    <div className="modal-portal-overlay" onClick={onClose}>
      {/* Modal Dialog Card with metadata-driven inline styling */}
      <div
        className="modal-portal-card"
        style={{ width: customWidth, maxHeight: customHeight === 'auto' ? '90vh' : customHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/80 rounded-t-2xl shrink-0">
          <h3 className="text-lg font-bold text-white tracking-tight">{displayTitle}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body - Scrollable inside window */}
        <div className="modal-portal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
