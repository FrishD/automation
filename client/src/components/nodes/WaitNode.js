import React from 'react';
import { Handle, Position } from 'reactflow';

const WaitNode = ({ data, id, selected }) => {
  const { duration = 1, updateNodeData } = data;

  const handleDurationChange = (e) => {
    if (updateNodeData) {
      updateNodeData(id, { ...data, duration: e.target.value });
    }
  };

  return (
    <div className={`relative flex flex-col gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-lg border-2 cursor-pointer z-10 w-64 ${selected ? 'border-primary' : 'border-slate-200 dark:border-slate-700'}`}>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">timer</span>
        <span className="font-semibold text-sm">Wait</span>
      </div>
      <div className="space-y-3 pt-3 border-t border-border-light dark:border-border-dark">
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark" htmlFor={`duration-${id}`}>Duration (seconds)</label>
          <input
            className="mt-1 w-full px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-slate-100 dark:bg-slate-700 focus:ring-1 focus:ring-primary"
            id={`duration-${id}`}
            placeholder="e.g., 5"
            type="number"
            value={duration}
            onChange={handleDurationChange}
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

export default WaitNode;
