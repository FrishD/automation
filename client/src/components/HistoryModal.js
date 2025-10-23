import React from 'react';

const HistoryModal = ({ isOpen, history, onClose, onRestore }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-1/2 max-w-2xl flex flex-col p-4">
        <div className="flex justify-between items-center border-b pb-2 mb-2">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Version History</h2>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          {history && history.length > 0 ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {history.map((version, index) => (
                <li key={index} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Saved at: {new Date(version.savedAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {version.nodes.length} nodes, {version.edges.length} edges
                    </p>
                  </div>
                  <button
                    onClick={() => onRestore(version)}
                    className="px-3 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">No history found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
