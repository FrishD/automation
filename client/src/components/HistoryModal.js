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
        <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4">
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((version, index) => (
                <div key={version.updatedAt} className="group flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-transparent hover:border-primary/50 dark:hover:bg-slate-700 transition-all">
                  <div>
                    <p className="font-semibold text-sm text-on-surface-light dark:text-on-surface-dark">
                      {new Date(version.updatedAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {version.nodes.length} nodes, {version.edges.length} edges
                    </p>
                  </div>
                  <button
                    onClick={() => onRestore(version)}
                    className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 px-3 py-1 text-xs font-semibold rounded-md bg-primary text-white hover:bg-primary/90"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-8">No history found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
