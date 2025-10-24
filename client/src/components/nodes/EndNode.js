import React from 'react';
import { Handle, Position } from 'reactflow';

const EndNode = ({ data }) => {
  return (
    <div
      className={`relative flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 shadow-lg border cursor-pointer z-10 transition-all duration-300 ${
        data.isHighlighted ? 'highlighted' : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <span className="material-symbols-outlined text-primary text-2xl">stop</span>
      <span className="font-semibold text-sm">End</span>
      <Handle
        type="target"
        position={Position.Left}
        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-800"
      />
    </div>
  );
};

export default EndNode;
