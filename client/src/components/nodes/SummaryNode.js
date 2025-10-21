import React from 'react';
import { Handle, Position } from 'reactflow';

const SummaryNode = ({ data }) => {
  const { text = 'Thank you for calling.', enableRating = false, onChange } = data;

  const handleDataChange = (newData) => {
    if (onChange) {
      onChange({ ...data, ...newData });
    }
  };

  return (
    <div className="relative flex flex-col gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 cursor-pointer z-10 w-64">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">summarize</span>
        <span className="font-semibold text-sm">Summary</span>
      </div>
      <div className="space-y-3 pt-3 border-t border-border-light dark:border-border-dark">
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark" htmlFor="summary-text">
            Summary script (use {`{variableName}`} for variables)
          </label>
          <textarea
            id="summary-text"
            className="mt-1 nodrag w-full px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="e.g., Thank you {name}, your appointment is set for {date}."
            rows="4"
            defaultValue={text}
            onChange={(e) => handleDataChange({ text: e.target.value })}
          ></textarea>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enable-rating"
            className="nodrag h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            checked={enableRating}
            onChange={(e) => handleDataChange({ enableRating: e.target.checked })}
          />
          <label htmlFor="enable-rating" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable rating (1-5)
          </label>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-800"
      />
      {/* A summary node is a type of end node, so it has no source handle */}
    </div>
  );
};

export default SummaryNode;
