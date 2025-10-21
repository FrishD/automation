import React from 'react';
import { Handle, Position } from 'reactflow';

const VariableNode = ({ data }) => {
  const {
    variableAction = 'set',
    variableName = '',
    variableValue = '',
    onChange
  } = data;

  const handleDataChange = (newData) => {
    if (onChange) {
      onChange({ ...data, ...newData });
    }
  };

  return (
    <div className="relative flex flex-col gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 cursor-pointer z-10 w-64">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">data_object</span>
        <span className="font-semibold text-sm">Variable</span>
      </div>
      <div className="space-y-3 pt-3 border-t border-border-light dark:border-border-dark">
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark" htmlFor="variable-action">Action</label>
          <select
            id="variable-action"
            className="mt-1 nodrag w-full px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
            value={variableAction}
            onChange={(e) => handleDataChange({ variableAction: e.target.value })}
          >
            <option value="set">Set Variable</option>
            <option value="save_last_response">Save Last Response</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark" htmlFor="variable-name">Variable Name</label>
          <input
            type="text"
            id="variable-name"
            className="mt-1 nodrag w-full px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="e.g., customerName"
            defaultValue={variableName}
            onChange={(e) => handleDataChange({ variableName: e.target.value })}
          />
        </div>
        {variableAction === 'set' && (
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark" htmlFor="variable-value">Value</label>
            <input
              type="text"
              id="variable-value"
              className="mt-1 nodrag w-full px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter value"
              defaultValue={variableValue}
              onChange={(e) => handleDataChange({ variableValue: e.target.value })}
            />
          </div>
        )}
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

export default VariableNode;
