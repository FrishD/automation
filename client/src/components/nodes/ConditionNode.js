import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';

const ConditionNode = ({ data }) => {
  const [conditions, setConditions] = useState(data.conditions || [{ keyword: '', targetNodeId: '' }]);

  const handleConditionChange = (index, field, value) => {
    const newConditions = [...conditions];
    newConditions[index][field] = value;
    setConditions(newConditions);
    data.conditions = newConditions; // Update data object directly
  };

  const addCondition = () => {
    setConditions([...conditions, { keyword: '', targetNodeId: '' }]);
  };

  return (
    <div className="react-flow__node-condition">
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="icon">🔀</span>
        <span>Condition</span>
      </div>
      <div className="node-body">
        {conditions.map((cond, index) => (
          <div key={index} className="condition-item">
            <span>If user says:</span>
            <input
              type="text"
              placeholder="e.g., 'yes'"
              value={cond.keyword}
              onChange={(e) => handleConditionChange(index, 'keyword', e.target.value)}
            />
            {/* The handle's ID will correspond to the condition's index */}
            <Handle type="source" position={Position.Right} id={`${index}`} style={{ top: `${(index + 1) * 35 + 30}px` }} />
          </div>
        ))}
        <button onClick={addCondition}>+ Add Condition</button>
      </div>
    </div>
  );
};

export default ConditionNode;
