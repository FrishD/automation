import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/flows';

const HistoryModal = ({ isOpen, onClose, currentFlowId, onRestore }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isOpen && currentFlowId) {
      const fetchHistory = async () => {
        try {
          const response = await axios.get(`${API_URL}/${currentFlowId}/history`);
          setHistory(response.data);
        } catch (error) {
          console.error('Error fetching history:', error);
        }
      };
      fetchHistory();
    }
  }, [isOpen, currentFlowId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-on-surface-light dark:text-on-surface-dark">Version History</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto pr-2">
          {history.length > 0 ? (
            <ul className="space-y-3">
              {history.map((version) => (
                <li
                  key={version.timestamp}
                  className="group flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                      {new Date(version.timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {version.nodes.length} nodes, {version.edges.length} edges
                    </p>
                  </div>
                  <button
                    onClick={() => onRestore(version)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-95"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500 mb-2">history</span>
              <p className="font-medium text-slate-600 dark:text-slate-400">No Version History</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">Changes will be saved here automatically.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
