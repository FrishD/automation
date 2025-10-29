import React, { useState } from 'react';

const onDragStart = (event, nodeType) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

const Block = ({ type, icon, name }) => (
    <div
        className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-white hover:bg-secondary-background border border-shadow-depth cursor-pointer transition-all"
        onDragStart={(event) => onDragStart(event, type)}
        draggable
        data-testid={`dnd-node-${type}`}
    >
        <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
        <span className="font-semibold text-xs text-center text-dark-text">{name}</span>
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
    <aside data-tour="palette" className={`w-64 bg-background border-r border-shadow-depth flex flex-col ${className}`}>
        <div className="p-4 border-b border-shadow-depth">
            <h1 className="text-xl font-bold text-dark-text">Palette</h1>
        </div>
        <div className="p-4">
            <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-gray text-xl">search</span>
                <input
                  className="w-full pl-10 pr-4 py-2 text-sm border border-shadow-depth rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary"
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
                    <h3 className="px-2 mb-2 text-xs font-semibold uppercase text-muted-gray tracking-wider">{category}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {filteredBlocks[category].map(block => (
                        <Block key={block.type} {...block} />
                      ))}
                    </div>
                </div>
              ))}
            </div>
        </div>
        <div className="p-4 border-t border-shadow-depth">
            <button
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md border border-shadow-depth hover:bg-secondary-background text-dark-text transition-colors"
            >
                <span className="material-symbols-outlined text-base">refresh</span>
                <span>Reset Canvas</span>
            </button>
        </div>
    </aside>
  );
};

export default Sidebar;
