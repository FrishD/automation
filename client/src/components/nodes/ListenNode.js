import React from 'react';
import { Handle, Position } from 'reactflow';

const ListenNode = ({ data }) => {
  return (
    <div className="relative flex flex-col gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 cursor-pointer z-10 w-56">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">hearing</span>
        <span className="font-semibold text-sm">Listen</span>
      </div>
      <div className="text-xs text-muted-light dark:text-muted-dark pt-3 border-t border-border-light dark:border-border-dark">
        <p>Waits for the user to speak and captures their response.</p>
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
