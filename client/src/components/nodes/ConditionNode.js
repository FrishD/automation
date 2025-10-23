import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';

const ConditionNode = ({ data }) => {
    const [conditions, setConditions] = useState(data.conditions || [{ keyword: '' }]);

    const handleConditionChange = (index, value) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], keyword: value };
        setConditions(newConditions);
        data.onChange({ ...data, conditions: newConditions });
    };

    const addCondition = () => {
        const newConditions = [...conditions, { keyword: '' }];
        setConditions(newConditions);
        data.onChange({ ...data, conditions: newConditions });
    };

    return (
        <div
            className={`relative flex flex-col gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-lg border cursor-pointer z-10 w-64 transition-all duration-300 ${
                data.isHighlighted ? 'border-primary shadow-primary/50' : 'border-slate-200 dark:border-slate-700'
            }`}
        >
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">call_split</span>
                <span className="font-semibold text-sm">If Condition</span>
            </div>
            <div className="space-y-3 pt-3 border-t border-border-light dark:border-border-dark">
                {conditions.map((cond, index) => (
                    <div key={index} className="flex items-center gap-2 relative">
                        <input
                            type="text"
                            placeholder="Keyword or phrase..."
                            defaultValue={cond.keyword}
                            onChange={(e) => handleConditionChange(index, e.target.value)}
                            className="nodrag w-full px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`${index}`}
                            className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-800"
                        />
                    </div>
                ))}
                <button
                    onClick={addCondition}
                    className="nodrag text-xs font-medium text-primary hover:text-primary/80"
                >
                    + Add Condition
                </button>
            </div>
            <Handle
                type="target"
                position={Position.Left}
                className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 border-2 border-white dark:border-slate-800"
            />
        </div>
    );
};

export default ConditionNode;
