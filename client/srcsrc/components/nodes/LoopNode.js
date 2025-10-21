import React from 'react';
import { Handle, Position } from 'reactflow';

const LoopNode = ({ data }) => {
  const {
    loopType = 'count',
    count = 1,
    variable = '',
    operator = '==',
    value = '',
    onChange
  } = data;

  const handleDataChange = (newData) => {
    if (onChange) {
      onChange({ ...data, ...newData });
    }
  };

  // A simple style to make it look like a container
  const containerStyle = {
    width: '350px',
    height: '250px',
    zIndex: -1, // Ensure other nodes can be visually "inside" it
  };

  return (
    <div className="relative flex flex-col gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 shadow-lg" style={containerStyle}>
       <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">replay</span>
        <span className="font-semibold text-sm">Loop</span>
      </div>

      {/* Loop Controls */}
      <div className="nodrag relative z-10 space-y-3 pt-3 border-t border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
           <select
            className="nodrag w-1/2 px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
            value={loopType}
            onChange={(e) => handleDataChange({ loopType: e.target.value })}
           >
            <option value="count">Repeat X times</option>
            <option value="condition">Until condition</option>
           </select>

           {loopType === 'count' && (
             <input
              type="number"
              min="1"
              className="nodrag w-1/2 px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
              defaultValue={count}
              onChange={(e) => handleDataChange({ count: parseInt(e.target.value, 10) || 1 })}
            />
           )}
        </div>

        {loopType === 'condition' && (
          <div className="grid grid-cols-3 gap-2">
            <input type="text" placeholder="Variable" defaultValue={variable} onChange={e => handleDataChange({ variable: e.target.value })} className="nodrag text-sm p-1.5 rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-slate-700" />
            <select value={operator} onChange={e => handleDataChange({ operator: e.target.value })} className="nodrag text-sm p-1.5 rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-slate-700">
              <option>==</option>
              <option>!=</option>
              <option>&lt;</option>
              <option>&gt;</option>
              <option>&lt;=</option>
              <option>&gt;=</option>
            </select>
            <input type="text" placeholder="Value" defaultValue={value} onChange={e => handleDataChange({ value: e.target.value })} className="nodrag text-sm p-1.5 rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-slate-700" />
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} className="!bg-slate-400" />

      {/* Handle to start the loop's inner flow */}
      <div className="absolute top-1/3 -right-3.5 -translate-y-1/2">
        <Handle type="source" position={Position.Right} id="loop_start" className="!bg-green-500" />
         <span className="text-xs absolute left-4 top-1/2 -translate-y-1/2">Start Loop</span>
      </div>

      {/* Handle to exit the loop */}
      <div className="absolute top-2/3 -right-3.5 -translate-y-1/2">
        <Handle type="source" position={Position.Right} id="loop_exit" className="!bg-red-500" />
        <span className="text-xs absolute left-4 top-1/2 -translate-y-1/2">Exit Loop</span>
      </div>
    </div>
  );
};

export default LoopNode;
