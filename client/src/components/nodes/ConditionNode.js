import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';

const ConditionNode = ({ data, id }) => {
    // Ensure data.conditions is an array
    const initialConditions = Array.isArray(data.conditions) ? data.conditions : [];
    const [conditions, setConditions] = useState(initialConditions);

    const handleConditionChange = (index, value) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], keyword: value };
        setConditions(newConditions);

        // This is crucial: update the node's data object in the parent component's state
        if (data.onChange) {
            data.onChange({ ...data, conditions: newConditions });
        }
    };

    const addCondition = () => {
        const newConditions = [...conditions, { keyword: '' }];
        setConditions(newConditions);
        if (data.onChange) {
            data.onChange({ ...data, conditions: newConditions });
        }
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
                            defaultValue={cond.keyword}
                            onChange={(e) => handleConditionChange(index, e.target.value)}
                            className="nodrag" // Prevents node dragging when interacting with input
                        />
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`${index}`}
                            style={{ top: `${(index + 1) * 45 + 15}px` }}
                        />
                    </div>
                ))}
                <button onClick={addCondition} className="nodrag">+ Add Condition</button>
            </div>
        </div>
    );
};

export default ConditionNode;
