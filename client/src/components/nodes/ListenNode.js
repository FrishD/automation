
import React from 'react';
import { Handle, Position } from 'reactflow';

const ListenNode = ({ data, selected }) => {
  return (
    <div
      className={`relative bg-white dark:bg-slate-800 shadow-lg border rounded-lg w-64 text-sm transition-all duration-300 ${
        data.isHighlighted ? 'glow' : selected ? 'border-primary ring-4 ring-primary/20' : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-slate-400" />

      <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-t-lg">
        <span className="material-symbols-outlined text-primary text-xl">hearing</span>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Listen</h3>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Waits for the user to speak, captures their response, and optionally extracts data.
        </p>

        <div className="space-y-2">
          <label className="block font-semibold text-xs text-slate-600 dark:text-slate-300" htmlFor={`language-${data.id}`}>Language</label>
          <select
            id={`language-${data.id}`}
            className="nodrag w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary"
            value={data.language || 'en'}
            onChange={(e) => data.onChange({ ...data, language: e.target.value })}
          >
            <option value="en">English</option>
            <option value="he">Hebrew</option>
          </select>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="condition"
        className="w-3 h-3 !bg-slate-400"
        style={{ top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="variable"
        className="w-3 h-3 !bg-green-500"
        style={{ left: '50%' }}
      />
    </div>
  );
};

export default ListenNode;
