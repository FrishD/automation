import React, { useState } from 'react';

const onDragStart = (event, nodeType) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

const Block = ({ type, icon, name }) => (
    <div
        className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-background-light dark:bg-background-dark hover:bg-primary-light/50 dark:hover:bg-primary/20 cursor-pointer transition-all"
        onDragStart={(event) => onDragStart(event, type)}
        draggable
    >
        <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
        <span className="font-medium text-xs text-center">{name}</span>
    </div>
);

const Sidebar = ({ onReset, className }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const blocks = {
    'Flow Control': [
      { type: 'start', icon: 'play_arrow', name: 'Start' },
      { type: 'end', icon: 'stop', name: 'End' },
      { type: 'condition', icon: 'call_split', name: 'If' },
      { type: 'loop', icon: 'repeat', name: 'While' },
    ],
    'Data': [
      { type: 'variable', icon: 'data_object', name: 'Set Variable' },
    ],
    'Interaction': [
      { type: 'speak', icon: 'record_voice_over', name: 'Speak' },
      { type: 'listen', icon: 'hearing', name: 'Listen' },
      { type: 'play_audio', icon: 'volume_up', name: 'Play Audio' },
      { type: 'wait', icon: 'timer', name: 'Wait' },
      { type: 'confirmation', icon: 'check_circle', name: 'Confirm' },
      { type: 'summary', icon: 'summarize', name: 'Summary' },
      { type: 'google_calendar', icon: 'event', name: 'Google Calendar' },
    ],
  };

  const filteredBlocks = Object.keys(blocks).reduce((acc, category) => {
    const filtered = blocks[category].filter(block =>
      block.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {});

  return (
    <aside data-tour="palette" className={`w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col ${className}`}>
        <div className="p-4 border-b border-border-light dark:border-border-dark">
            <h1 className="text-lg font-bold text-on-surface-light dark:text-on-surface-dark">Palette</h1>
        </div>
        <div className="p-4">
            <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark text-xl">search</span>
                <input
                  className="w-full pl-10 pr-4 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-transparent focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Search blocks..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <div className="flex-grow overflow-y-auto px-4">
            <div className="space-y-6">
              {Object.keys(filteredBlocks).map(category => (
                <div key={category}>
                    <h3 className="px-2 mb-2 text-xs font-semibold uppercase text-muted-light dark:text-muted-dark tracking-wider">{category}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {filteredBlocks[category].map(block => (
                        <Block key={block.type} {...block} />
                      ))}
                    </div>
                </div>
              ))}
            </div>
        </div>
        <div className="p-4 border-t border-border-light dark:border-border-dark">
            <button
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
                <span className="material-symbols-outlined text-base">refresh</span>
                <span>Reset Canvas</span>
            </button>
        </div>
    </aside>
  );
};

export default Sidebar;
