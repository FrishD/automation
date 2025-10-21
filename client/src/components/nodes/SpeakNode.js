import React from 'react';
import { Handle, Position } from 'reactflow';

const SpeakNode = ({ data }) => {
  return (
    <div className="relative flex flex-col gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 cursor-pointer z-10 w-56">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-2xl">record_voice_over</span>
        <span className="font-semibold text-sm">Speak</span>
      </div>
      <div className="space-y-3 pt-3 border-t border-border-light dark:border-border-dark">
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark" htmlFor="text">Text to say</label>
          <textarea
            className="mt-1 w-full px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-md bg-background-light dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
            id="text"
            placeholder="Enter text..."
            rows="3"
            defaultValue={data.text}
            onChange={(e) => data.onChange({ ...data, text: e.target.value })}
          ></textarea>
        </div>
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

export default SpeakNode;
