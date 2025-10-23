import React from 'react';

const SimulationModal = ({ isOpen, logs, onClose, onClear }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-3/4 h-3/4 flex flex-col p-4">
        <div className="flex justify-between items-center border-b pb-2 mb-2">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Simulation</h2>
          <div className="flex gap-2">
            <button onClick={onClear} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-lg">delete_sweep</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
        <div className="flex-grow bg-slate-50 dark:bg-slate-900 rounded-md p-4 overflow-y-auto">
          <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {logs.join('')}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SimulationModal;
