import React from 'react';
import { Handle, Position } from 'reactflow';

const SummaryNode = ({ data, selected }) => {
  return (
    <div
      className={`relative flex flex-col gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-lg border cursor-pointer z-10 w-64 transition-all duration-300 ${
        data.isHighlighted ? 'glow' : selected ? 'border-primary ring-4 ring-primary/20' : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">summarize</span>
        <span className="font-semibold text-sm">Summary</span>
      </div>
      <div className="space-y-3 pt-3 border-t border-border-light dark:border-border-dark">
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark" htmlFor="summary-text">Summary Text</label>
          <textarea
            className="mt-1 w-full px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
            id="summary-text"
            placeholder="e.g., Your order for {item} is confirmed."
            rows="3"
            defaultValue={data.summaryText}
            onChange={(e) => data.onChange({ ...data, summaryText: e.target.value })}
          ></textarea>
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

export default SummaryNode;
