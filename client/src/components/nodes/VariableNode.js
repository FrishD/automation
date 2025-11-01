import React from 'react';
import { Handle, Position } from 'reactflow';

// Define available extraction types for each source node
const SOURCE_EXTRACTIONS = {
  listen: [
    { value: 'full_text', label: 'Full Text' },
    { value: 'date', label: 'Date' },
    { value: 'time', label: 'Time' },
    { value: 'email', label: 'Email' },
    { value: 'phone_number', label: 'Phone Number' },
  ],
  condition: [
    { value: 'user_response', label: 'User Response' },
    { value: 'condition_matched', label: 'Condition Matched' },
  ],
  google_calendar: [
    { value: 'event_start_time', label: 'Event Start Time' },
    { value: 'event_end_time', label: 'Event End Time' },
    { value: 'event_summary', label: 'Event Name' },
    { value: 'event_description', label: 'Event Description' },
    { value: 'event_location', label: 'Event Location' },
  ],
};

const VariableNode = ({ data, selected }) => {
  const { sourceNodeType, assignments = [{ variableName: '', sourceType: '' }] } = data;
  const isConnectedToSource = Boolean(sourceNodeType);
  const availableExtractions = SOURCE_EXTRACTIONS[sourceNodeType] || [];

  const handleAssignmentChange = (index, field, value) => {
    const newAssignments = [...assignments];
    newAssignments[index][field] = value;
    data.onChange({ ...data, assignments: newAssignments });
  };

  const addAssignment = () => {
    const newAssignments = [...assignments, { variableName: '', sourceType: '' }];
    data.onChange({ ...data, assignments: newAssignments });
  };

  const removeAssignment = (index) => {
    const newAssignments = assignments.filter((_, i) => i !== index);
    data.onChange({ ...data, assignments: newAssignments });
  };

  return (
    <div
      className={`relative flex flex-col gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-lg border z-10 w-80 transition-all duration-300 ${
        data.isHighlighted ? 'glow' : selected ? 'border-primary ring-4 ring-primary/20' : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">data_object</span>
        <span className="font-semibold text-sm">{isConnectedToSource ? 'Extract & Assign Variables' : 'Set Static Variable'}</span>
      </div>
      <div className="space-y-4 pt-3 border-t border-border-light dark:border-border-dark">
        {isConnectedToSource ? (
          <>
            <p className="text-xs text-center text-muted-light dark:text-muted-dark">
              Extracting from <span className="font-semibold text-primary">{sourceNodeType}</span> node.
            </p>
            {assignments.map((assignment, index) => (
              <div key={index} className="p-3 space-y-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg relative">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs font-medium text-muted-light dark:text-muted-dark">Source Data</label>
                        <select
                        className="nodrag mt-1 w-full px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-slate-700"
                        value={assignment.sourceType}
                        onChange={(e) => handleAssignmentChange(index, 'sourceType', e.target.value)}
                        >
                        <option value="">Select data to extract...</option>
                        {availableExtractions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-light dark:text-muted-dark">Variable Name</label>
                        <input
                        className="nodrag mt-1 w-full px-3 py-1.5 text-sm border rounded-md"
                        placeholder="e.g., user_email"
                        type="text"
                        value={assignment.variableName}
                        onChange={(e) => handleAssignmentChange(index, 'variableName', e.target.value)}
                        />
                    </div>
                </div>

                {assignments.length > 1 && (
                  <button onClick={() => removeAssignment(index)} className="absolute top-1 right-1 text-red-500 hover:text-red-700">
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addAssignment}
              className="nodrag w-full mt-2 px-3 py-1.5 text-xs font-semibold text-primary border border-primary rounded-md hover:bg-primary/10"
            >
              + Add Assignment
            </button>
          </>
        ) : (
          <div>
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark">Value</label>
            <textarea
              className="nodrag mt-1 w-full px-3 py-1.5 text-sm border rounded-md"
              placeholder="Enter a static value or expression"
              rows="2"
              value={data.value || ''}
              onChange={(e) => data.onChange({ ...data, value: e.target.value })}
            ></textarea>
             <label className="text-xs font-medium text-muted-light dark:text-muted-dark mt-2 block">Variable Name</label>
             <input
                className="nodrag mt-1 w-full px-3 py-1.5 text-sm border rounded-md"
                placeholder="e.g., my_variable"
                type="text"
                value={data.variableName || ''}
                onChange={(e) => data.onChange({ ...data, variableName: e.target.value })}
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
