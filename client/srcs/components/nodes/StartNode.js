import React from 'react';
import { Handle, Position } from 'reactflow';

const StartNode = ({ data }) => {
  return (
    <div className="relative flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 cursor-pointer z-10">
      <span className="material-symbols-outlined text-primary text-2xl">play_arrow</span>
      <span className="font-semibold text-sm">Start</span>
      <Handle
        type="source"
        position={Position.Right}
        className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-800"
      />
    </div>
  );
};

export default StartNode;
