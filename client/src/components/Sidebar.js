import React from 'react';

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

const Sidebar = () => {
  return (
    <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col">
        <div className="p-4 border-b border-border-light dark:border-border-dark">
            <h1 className="text-lg font-bold text-on-surface-light dark:text-on-surface-dark">Palette</h1>
        </div>
        <div className="p-4">
            <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-light dark:text-muted-dark text-xl">search</span>
                <input className="w-full pl-10 pr-4 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-transparent focus:ring-2 focus:ring-primary focus:border-primary" placeholder="Search blocks..." type="text"/>
            </div>
        </div>
        <div className="flex-grow overflow-y-auto px-4">
            <div className="space-y-6">
                <div>
                    <h3 className="px-2 mb-2 text-xs font-semibold uppercase text-muted-light dark:text-muted-dark tracking-wider">Flow Control</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Block type="start" icon="play_arrow" name="Start" />
                        <Block type="end" icon="stop" name="End" />
                        <Block type="condition" icon="call_split" name="If" />
                        <Block type="loop" icon="repeat" name="While" />
                    </div>
                </div>
                <div>
                    <h3 className="px-2 mb-2 text-xs font-semibold uppercase text-muted-light dark:text-muted-dark tracking-wider">Data</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Block type="variable" icon="data_object" name="Set Variable" />
                    </div>
                </div>
                <div>
                    <h3 className="px-2 mb-2 text-xs font-semibold uppercase text-muted-light dark:text-muted-dark tracking-wider">Interaction</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Block type="speak" icon="record_voice_over" name="Speak" />
                        <Block type="listen" icon="hearing" name="Listen" />
                        <Block type="play_audio" icon="volume_up" name="Play Audio" />
                        <Block type="wait" icon="timer" name="Wait" />
                        <Block type="confirmation" icon="check_circle" name="Confirm" />
                        <Block type="summary" icon="summarize" name="Summary" />
                    </div>
                </div>
            </div>
        </div>
    </aside>
  );
};

export default Sidebar;
