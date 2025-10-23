import React, { useMemo } from 'react';
import { Handle, Position, useNodes, useReactFlow } from 'reactflow';

const VariableNode = ({ data, selected, id }) => {
  const { variableName = '', value = '', entityType = 'full_text', updateNodeData } = data;
  const nodes = useNodes();
  const { getNode } = useReactFlow();

  const isChildOfListenNode = useMemo(() => {
    const node = getNode(id);
    if (!node || !node.parentNode) return false;
    const parentNode = getNode(node.parentNode);
    return parentNode?.type === 'listen';
  }, [id, getNode, nodes]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (updateNodeData) {
      updateNodeData(id, { ...data, [name]: value });
    }
  };

  const renderDefaultView = () => (
    <>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">data_object</span>
        <span className="font-semibold text-sm">Set Variable</span>
      </div>
      <div className="space-y-3 pt-3 border-t border-border-light dark:border-border-dark">
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark" htmlFor={`variable-name-${id}`}>Variable Name</label>
          <input
            className="mt-1 w-full px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-slate-100 dark:bg-slate-700 focus:ring-1 focus:ring-primary"
            id={`variable-name-${id}`}
            name="variableName"
            placeholder="e.g., my_variable"
            type="text"
            value={variableName}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark" htmlFor={`variable-value-${id}`}>Value</label>
          <textarea
            className="mt-1 w-full px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-slate-100 dark:bg-slate-700 focus:ring-1 focus:ring-primary"
            id={`variable-value-${id}`}
            name="value"
            placeholder="Enter a value or expression"
            rows="2"
            value={value}
            onChange={handleInputChange}
          />
        </div>
      </div>
    </>
  );

  const renderListenChildView = () => (
    <>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-teal-500 text-2xl">fact_check</span>
        <span className="font-semibold text-sm">Capture to Variable</span>
      </div>
      <div className="space-y-3 pt-3 border-t border-border-light dark:border-border-dark">
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark" htmlFor={`variable-name-${id}`}>Variable Name</label>
          <input
            className="mt-1 w-full px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-slate-100 dark:bg-slate-700 focus:ring-1 focus:ring-primary"
            id={`variable-name-${id}`}
            name="variableName"
            placeholder="e.g., user_email"
            type="text"
            value={variableName}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark" htmlFor={`entity-type-${id}`}>Capture Type</label>
          <select
            id={`entity-type-${id}`}
            name="entityType"
            value={entityType}
            onChange={handleInputChange}
            className="mt-1 w-full p-1.5 rounded-md text-xs bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="full_text">Full Text</option>
            <option value="number">Number</option>
            <option value="email">Email</option>
            <option value="date">Date</option>
          </select>
        </div>
      </div>
    </>
  );

  return (
    <div className={`relative flex flex-col gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-lg border-2 cursor-pointer z-10 w-64 ${selected ? 'border-primary' : 'border-slate-200 dark:border-slate-700'}`}>
      {isChildOfListenNode ? renderListenChildView() : renderDefaultView()}

      {!isChildOfListenNode && (
        <>
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
        </>
      )}
    </div>
  );
};

export default VariableNode;
