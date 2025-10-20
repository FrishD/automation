import React from 'react';

const onDragStart = (event, nodeType) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <h3>Blocks</h3>
      <div className="dndnode input" onDragStart={(event) => onDragStart(event, 'start')} draggable>
        <span className="icon">🚀</span> Start
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'speak')} draggable>
        <span className="icon">🗣️</span> Speak
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'listen')} draggable>
        <span className="icon">👂</span> Listen
      </div>
      <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'condition')} draggable>
        <span className="icon">🔀</span> Condition
      </div>
      <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'end')} draggable>
        <span className="icon">🏁</span> End
      </div>
    </aside>
  );
};

export default Sidebar;
