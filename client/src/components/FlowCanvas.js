import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useReactFlow,
} from 'reactflow';

const FlowCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onInit,
  onDrop,
  onDragOver,
  onAddNode,
  nodeTypes,
  showMinimap
}) => {
  const minimapRef = useRef(null);
  const { deleteElements, screenToFlowPosition } = useReactFlow();
  const [menu, setMenu] = useState(null);

  const onNodesDelete = useCallback((nodesToDelete) => {
    deleteElements({ nodes: nodesToDelete, edges });
  }, [edges, deleteElements]);

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    setMenu({
      id: `dndnode_${+new Date()}`,
      top: event.clientY,
      left: event.clientX,
      data: { position: { x: event.clientX, y: event.clientY } }
    });
  }, []);


  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setMenu({
      id: node.id,
      top: event.clientY,
      left: event.clientX,
      data: { node, position: { x: event.clientX, y: event.clientY } }
    });
  }, []);

  const onSelect = (type) => {
    const { data: { position } } = menu;
    onAddNode(type, position);
    setMenu(null);
  };

  return (
    <>
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
      onNodeContextMenu={onNodeContextMenu}
      onNodesDelete={onNodesDelete}
      deleteKeyCode={'Backspace'}
      fitView
      nodeTypes={nodeTypes}
    >
      <Background variant="dots" gap={20} size={1} />
      <Controls className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-1" />
        <div ref={minimapRef} style={{position: 'absolute', top: 20, left: 20}} className={`z-20 transition-opacity duration-300 ${showMinimap ? 'opacity-100' : 'opacity-0'}`}>
          <MiniMap className="w-48 h-32 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-b-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden" />
        </div>
    </ReactFlow>
    {menu && (
      <div
        className="absolute z-30 w-48 rounded-md bg-white dark:bg-slate-800 shadow-xl border border-border-light dark:border-border-dark py-1"
        style={{ top: menu.top, left: menu.left }}
        onClick={() => setMenu(null)}
      >
        {menu.data.node ? (
          <>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-on-surface-light dark:text-on-surface-dark hover:bg-slate-100 dark:hover:bg-slate-700 w-full">
              <span className="material-symbols-outlined text-base text-muted-light dark:text-muted-dark">content_copy</span>
              <span>Duplicate</span>
            </button>
            <div className="my-1 h-px bg-border-light dark:bg-border-dark"></div>
            <button onClick={() => onNodesDelete([menu.data.node])} className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full">
              <span className="material-symbols-outlined text-base">delete</span>
              <span>Delete</span>
            </button>
          </>
        ) : (
          <>
            <p className="px-3 py-1 text-xs font-semibold text-muted-light dark:text-muted-dark">Add Node</p>
            <div className="my-1 h-px bg-border-light dark:bg-border-dark"></div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm w-full hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => onSelect('speak')}>Speak</button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm w-full hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => onSelect('listen')}>Listen</button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm w-full hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => onSelect('condition')}>If</button>
            <div className="my-1 h-px bg-border-light dark:bg-border-dark"></div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm w-full hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => onSelect('variable')}>Variable</button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm w-full hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => onSelect('wait')}>Wait</button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm w-full hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => onSelect('play_audio')}>Play Audio</button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm w-full hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => onSelect('loop')}>Loop</button>
            <div className="my-1 h-px bg-border-light dark:bg-border-dark"></div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm w-full hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => onSelect('confirmation')}>Confirmation</button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm w-full hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => onSelect('summary')}>Summary</button>
          </>
        )}
      </div>
    )}
    </>
  );
};

export default FlowCanvas;
