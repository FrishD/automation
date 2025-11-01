import React from 'react';
import { Handle, Position } from 'reactflow';

// Define available extraction types for each source node
const SOURCE_EXTRACTIONS = {
  listen: [
    { value: 'full_text', label: 'Full Text' },
    { value: 'name', label: 'Name' },
    { value: 'date', label: 'Date' },
    { value: 'time', label: 'Time' },
    { value: 'email', label: 'Email' },
    { value: 'phone_number', label: 'Phone Number' },
    { value: 'boolean', label: 'Yes/No' },
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
      className={`relative flex flex-col rounded-lg bg-white dark:bg-slate-800 shadow-lg border z-10 w-80 transition-all duration-300 ${
        data.isHighlighted ? 'glow' : selected ? 'border-primary ring-4 ring-primary/20' : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-t-lg border-b border-slate-200 dark:border-slate-700">
        <span className="material-symbols-outlined text-primary text-2xl">data_object</span>
        <span className="font-semibold text-sm">{isConnectedToSource ? 'Extract & Assign' : 'Set Static Variable'}</span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {isConnectedToSource ? (
          <>
            <p className="text-xs text-center text-muted-light dark:text-muted-dark bg-slate-100 dark:bg-slate-900/50 py-1.5 px-3 rounded-md">
              Source: <span className="font-semibold text-primary uppercase">{sourceNodeType}</span>
            </p>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {assignments.map((assignment, index) => (
                <div key={index} className="p-3 space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 relative group">
                  <div className="flex flex-col gap-2">
                      <div>
                          <label className="text-xs font-medium text-muted-light dark:text-muted-dark">Extract</label>
                          <select
                            className="nodrag mt-1 w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
                            value={assignment.sourceType}
                            onChange={(e) => handleAssignmentChange(index, 'sourceType', e.target.value)}
                          >
                            <option value="">Select data...</option>
                            {availableExtractions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400">south</span>
                      </div>
                      <div>
                          <label className="text-xs font-medium text-muted-light dark:text-muted-dark">And Assign to</label>
                          <input
                            className="nodrag mt-1 w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="variable_name"
                            type="text"
                            value={assignment.variableName}
                            onChange={(e) => handleAssignmentChange(index, 'variableName', e.target.value)}
                          />
                      </div>
                  </div>

                  {assignments.length > 1 && (
                    <button onClick={() => removeAssignment(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addAssignment}
              className="nodrag w-full mt-2 px-3 py-1.5 text-xs font-semibold text-primary border-2 border-primary/50 rounded-md hover:bg-primary/10 transition-colors"
            >
              + Add Extraction
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-center text-muted-light dark:text-muted-dark">No source connected. Set a static value.</p>
             <div>
              <label className="text-xs font-medium text-muted-light dark:text-muted-dark">Variable Name</label>
              <input
                  className="nodrag mt-1 w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="e.g., my_variable"
                  type="text"
                  value={data.variableName || ''}
                  onChange={(e) => data.onChange({ ...data, variableName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-light dark:text-muted-dark">Value</label>
              <textarea
                className="nodrag mt-1 w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Enter a static value or expression"
                rows="2"
                value={data.value || ''}
                onChange={(e) => data.onChange({ ...data, value: e.target.value })}
              ></textarea>
            </div>
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
    </div>
  );
};

export default VariableNode;
