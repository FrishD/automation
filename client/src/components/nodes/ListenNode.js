import React from 'react';
import { Handle, Position } from 'reactflow';

const ListenNode = ({ data, id }) => {
  const { language = 'he', retries = 1, updateNodeData } = data;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (updateNodeData) {
      updateNodeData(id, { ...data, [name]: value });
    }
  };

  return (
    <div
      className="relative flex flex-col gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-lg border-2 border-slate-200 dark:border-slate-700 z-0 w-64"
      style={{ minHeight: '150px' }} // Set a minimum height to allow dropping
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">hearing</span>
        <span className="font-semibold text-sm">Listen</span>
      </div>
      <div className="text-xs text-muted-light dark:text-muted-dark pt-3 border-t border-border-light dark:border-border-dark">
        <p className="mb-2">Waits for the user to speak and captures their response.</p>

        <div className="flex flex-col gap-2 mt-2">
          <label htmlFor={`language-${id}`} className="font-medium text-xs">Language</label>
          <select
            id={`language-${id}`}
            name="language"
            value={language}
            onChange={handleInputChange}
            className="p-1.5 rounded-md text-xs bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="he">Hebrew</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <label htmlFor={`retries-${id}`} className="font-medium text-xs">Retries on failure</label>
          <input
            type="number"
            id={`retries-${id}`}
            name="retries"
            min="0"
            max="5"
            value={retries}
            onChange={handleInputChange}
            className="p-1.5 rounded-md text-xs bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-800"
      />
    </div>
  );
};

export default ListenNode;
