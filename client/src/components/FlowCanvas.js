import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useReactFlow,
} from 'reactflow';
import Draggable from 'react-draggable';

const FlowCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onInit,
  onDrop,
  onDragOver,
  onPaneContextMenu,
  onPaneDoubleClick,
  onNodeContextMenu,
  nodeTypes,
  showMinimap
}) => {
  const { deleteElements } = useReactFlow();
  const minimapRef = useRef(null);

  const onNodesDelete = useCallback(() => {
    deleteElements({ nodes, edges });
  }, [nodes, edges, deleteElements]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onInit={onInit}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onPaneContextMenu={onPaneContextMenu}
      onPaneDoubleClick={onPaneDoubleClick}
      onNodeContextMenu={onNodeContextMenu}
      onNodesDelete={onNodesDelete}
      deleteKeyCode={'Backspace'}
      fitView
      nodeTypes={nodeTypes}
    >
      <Background variant="dots" gap={20} size={1} />
      <Controls className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-1" />
      <Draggable
        nodeRef={minimapRef}
        defaultPosition={JSON.parse(localStorage.getItem('minimapPos')) || {x: window.innerWidth - 1000, y: 20}}
        onStop={(e, data) => localStorage.setItem('minimapPos', JSON.stringify({x: data.x, y: data.y}))}
        handle=".minimap-handle"
      >
        <div ref={minimapRef} className={`absolute z-20 transition-opacity duration-300 ${showMinimap ? 'opacity-100' : 'opacity-0'}`}>
          <div className="minimap-handle cursor-move h-6 w-full bg-slate-200 dark:bg-slate-700 rounded-t-lg"></div>
          <MiniMap className="w-48 h-32 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-b-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden" />
        </div>
      </Draggable>
    </ReactFlow>
  );
};

export default FlowCanvas;
