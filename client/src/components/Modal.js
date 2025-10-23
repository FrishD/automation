import React from 'react';

const Modal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-on-surface-light dark:text-on-surface-dark mb-4">{title}</h3>
        <div className="text-sm text-on-surface-variant-light dark:text-on-surface-variant-dark mb-6">
          {children}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-on-surface-light dark:text-on-surface-dark hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary/90"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
