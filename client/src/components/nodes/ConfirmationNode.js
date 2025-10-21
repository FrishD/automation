import React from 'react';
import { Handle, Position } from 'reactflow';

const ConfirmationNode = ({ data }) => {
  const { text = '', onChange } = data;

  const handleDataChange = (newData) => {
    if (onChange) {
      onChange({ ...data, ...newData });
    }
  };

  return (
    <div className="relative flex flex-col gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 cursor-pointer z-10 w-64">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">rule</span>
        <span className="font-semibold text-sm">Confirmation</span>
      </div>
      <div className="space-y-3 pt-3 border-t border-border-light dark:border-border-dark">
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark" htmlFor="confirmation-text">Question to ask</label>
          <textarea
            id="confirmation-text"
            className="mt-1 nodrag w-full px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="e.g., Are you sure you want to continue?"
            rows="3"
            defaultValue={text}
            onChange={(e) => handleDataChange({ text: e.target.value })}
          ></textarea>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-800"
      />
      {/* Source handle for "Yes" */}
      <div className="absolute -right-3.5 top-1/3 -translate-y-1/2">
          <Handle
              type="source"
              position={Position.Right}
              id="yes"
              className="w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-800"
          />
          <span className="text-xs absolute left-4 top-1/2 -translate-y-1/2">Yes</span>
      </div>

      {/* Source handle for "No" */}
      <div className="absolute -right-3.5 top-2/3 -translate-y-1/2">
          <Handle
              type="source"
              position={Position.Right}
              id="no"
              className="w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-800"
          />
          <span className="text-xs absolute left-4 top-1/2 -translate-y-1/2">No</span>
      </div>
    </div>
  );
};

export default ConfirmationNode;
