import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import useUndo from 'use-undo';
import 'reactflow/dist/style.css';
import axios from 'axios';
import Sidebar from './components/Sidebar.js';

import StartNode from './components/nodes/StartNode.js';
import SpeakNode from './components/nodes/SpeakNode.js';
import ListenNode from './components/nodes/ListenNode.js';
import ConditionNode from './components/nodes/ConditionNode.js';
import EndNode from './components/nodes/EndNode.js';
import VariableNode from './components/nodes/VariableNode.js';
import WaitNode from './components/nodes/WaitNode.js';
import LoopNode from './components/nodes/LoopNode.js';
import PlayAudioNode from './components/nodes/PlayAudioNode.js';
import ConfirmationNode from './components/nodes/ConfirmationNode.js';
import SummaryNode from './components/nodes/SummaryNode.js';
import Notification from './components/Notification.js';


const API_URL = 'http://localhost:5000/api/flows';
let id = 0;
const getId = () => `dndnode_${id++}`;

const nodeTypes = {
  start: StartNode,
  speak: SpeakNode,
  listen: ListenNode,
  condition: ConditionNode,
  end: EndNode,
  variable: VariableNode,
  wait: WaitNode,
  loop: LoopNode,
  play_audio: PlayAudioNode,
  confirmation: ConfirmationNode,
  summary: SummaryNode,
};

const App = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, { set: setNodes, undo: undoNodes, redo: redoNodes, canUndo: canUndoNodes, canRedo: canRedoNodes }] = useUndo([]);
  const [edges, { set: setEdges, undo: undoEdges, redo: redoEdges, canUndo: canUndoEdges, canRedo: canRedoEdges }] = useUndo([]);
  const onNodesChange = (changes) => setNodes(applyNodeChanges(changes, nodes.present));
  const onEdgesChange = (changes) => setEdges(applyEdgeChanges(changes, edges.present));
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [currentFlowId, setCurrentFlowId] = useState(null);
  const [menu, setMenu] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [showMinimap, setShowMinimap] = useState(true);
  const [loading, setLoading] = useState(true);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes(nodes.present.map(node =>
      node.id === nodeId ? { ...node, data: newData } : node
    ));
  }, [nodes.present, setNodes]);


  const nodesWithDataHandlers = useMemo(() => {
    return nodes.present.map(node => ({
      ...node,
      data: {
        ...node.data,
        updateNodeData: updateNodeData
      }
    }));
  }, [nodes.present, updateNodeData]);

  const createNewFlow = useCallback(async () => {
    try {
        const initialNodes = [{ id: 'start_node_0', type: 'start', position: { x: 150, y: 150 }, data: { label: 'Start' } }];
        const response = await axios.post(API_URL, {
            name: 'New Conversation',
            nodes: initialNodes,
            edges: [],
        });
        const newFlow = response.data;
        setNodes(newFlow.nodes);
        setEdges(newFlow.edges);
        setFlowName(newFlow.name);
        setCurrentFlowId(newFlow._id);
    } catch (error) {
        console.error("Error creating new flow:", error);
    }
  }, [setNodes, setEdges, setFlowName, setCurrentFlowId]);


  useEffect(() => {
    const fetchInitialFlow = async () => {
      setLoading(true);
      try {
        const response = await axios.get(API_URL);
        if (response.data && response.data.length > 0) {
          const firstFlow = response.data[0];
          setNodes(firstFlow.nodes || []);
          setEdges(firstFlow.edges || []);
          setFlowName(firstFlow.name || 'Untitled Flow');
          setCurrentFlowId(firstFlow._id);
          id = firstFlow.nodes.length + 1;
        } else {
          await createNewFlow();
        }
      } catch (error) {
        console.error("Error fetching flows:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialFlow();
  }, [setNodes, setEdges, createNewFlow]);

  // Effect to update edge labels when a condition node's data changes
  useEffect(() => {
    if (loading) return;
    setEdges(
      edges.present.map((edge) => {
        if (edge.sourceHandle) {
          const sourceNode = nodes.present.find((node) => node.id === edge.source);
          if (sourceNode && sourceNode.data.conditions && sourceNode.data.conditions[edge.sourceHandle]) {
            const keyword = sourceNode.data.conditions[edge.sourceHandle].keyword;
            edge.label = keyword || `[Connect to save keyword]`;
          }
        }
        return edge;
      })
    );
  }, [nodes.present, setEdges, loading]);

  const onConnect = useCallback((params) => {
    let newEdge = { ...params };
    const sourceNode = nodes.present.find(node => node.id === params.source);
    if (sourceNode && params.sourceHandle) {
        if (sourceNode.data.conditions && sourceNode.data.conditions[params.sourceHandle]) {
            const keyword = sourceNode.data.conditions[params.sourceHandle].keyword;
            newEdge.label = keyword || `[Connect to save keyword]`;
        }
    }
    setEdges(addEdge(newEdge, edges.present));
    }, [nodes.present, setEdges, edges.present]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });

      let initialData = { label: `${type} node` };
      if (type === 'condition') {
          initialData.conditions = [{ keyword: '' }];
      } else if (type === 'speak') {
          initialData.text = 'Agent says...';
      }

      const newNode = {
        id: getId(),
        type,
        position,
        data: initialData,
      };

      setNodes(nodes.present.concat(newNode));
    },
    [reactFlowInstance, nodes.present, setNodes],
  );

  const onPaneContextMenu = (event) => {
    event.preventDefault();
    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setMenu({
      id: getId(),
      top: event.clientY,
      left: event.clientX,
      data: { position }
    });
  };

  const onPaneDoubleClick = (event) => {
    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setMenu({
      id: getId(),
      top: event.clientY,
      left: event.clientX,
      data: { position }
    });
  };

  const onNodeContextMenu = (event, node) => {
    event.preventDefault();
    setMenu({
      id: node.id,
      top: event.clientY,
      left: event.clientX,
      data: { node }
    });
  };

  const onSelect = (type) => {
    const { id, data: { position } } = menu;
    const newNode = {
      id,
      type,
      position,
      data: { label: `${type} node` },
    };
    setNodes(nodes.present.concat(newNode));
    setMenu(null);
  };

  const saveFlow = async () => {
    if (!currentFlowId) return;
    try {
        const nodesToSave = nodes.present.map(({ data, ...node }) => {
            const { onChange, ...restData } = data;
            return { ...node, data: restData };
        });

        await axios.put(`${API_URL}/${currentFlowId}`, {
            name: flowName,
            nodes: nodesToSave,
            edges: edges.present,
        });
        setNotification({ message: 'Flow saved!', type: 'success' });
    } catch (error) {
        console.error("Error saving flow:", error);
        setNotification({ message: 'Error saving flow.', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Notification message={notification.message} type={notification.type} onClear={() => setNotification({ message: '', type: '' })} />
      <ReactFlowProvider>
        <Sidebar />
        <main className="flex-1 bg-background-light dark:bg-background-dark p-6">
          <div className="h-full w-full bg-surface-light dark:bg-surface-dark rounded-xl relative overflow-hidden flex flex-col" style={{backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
            <div ref={reactFlowWrapper} className="flex-grow relative cursor-grab active:cursor-grabbing">
              <div className="flex items-center justify-between p-1.5 border-b border-border-light dark:border-border-dark flex-shrink-0">
                <div className="flex items-center gap-1">
                  <button onClick={() => { undoNodes(); undoEdges(); }} disabled={!canUndoNodes || !canUndoEdges} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50">
                    <span className="material-symbols-outlined text-lg">undo</span>
                  </button>
                  <button onClick={() => { redoNodes(); redoEdges(); }} disabled={!canRedoNodes || !canRedoEdges} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50">
                    <span className="material-symbols-outlined text-lg">redo</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  className="nodrag text-sm font-medium text-on-surface-light dark:text-on-surface-dark bg-transparent text-center"
                />
                <div className="flex items-center gap-1.5 mr-1">
                  <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-base">upload</span>
                    <span>Load</span>
                  </button>
                  <button onClick={saveFlow} className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-primary text-white hover:bg-primary/90">
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>Save</span>
                  </button>
                  <button onClick={() => setShowMinimap(!showMinimap)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-lg">map</span>
                  </button>
                </div>
              </div>
              <ReactFlow
                nodes={nodesWithDataHandlers}
                edges={edges.present}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onPaneContextMenu={onPaneContextMenu}
                onPaneDoubleClick={onPaneDoubleClick}
                onNodeContextMenu={onNodeContextMenu}
                fitView
                nodeTypes={nodeTypes}
              >
                <Background variant="dots" gap={20} size={1} />
                <Controls className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-1" />
                {showMinimap && <MiniMap className="absolute top-4 right-4 z-20 w-48 h-32 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer" />}
              </ReactFlow>
              {menu && (
                <div
                  className="absolute z-30 w-56 rounded-md bg-white dark:bg-slate-800 shadow-xl border border-border-light dark:border-border-dark py-2"
                  style={{ top: menu.top, left: menu.left }}
                  onClick={() => setMenu(null)}
                >
                  {menu.data.node ? (
                    <>
                      <button className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-light dark:text-on-surface-dark hover:bg-slate-100 dark:hover:bg-slate-700 w-full">
                        <span className="material-symbols-outlined text-lg text-muted-light dark:text-muted-dark">edit</span>
                        <span>Edit Properties</span>
                      </button>
                      <button className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-light dark:text-on-surface-dark hover:bg-slate-100 dark:hover:bg-slate-700 w-full">
                        <span className="material-symbols-outlined text-lg text-muted-light dark:text-muted-dark">content_copy</span>
                        <span>Duplicate Block</span>
                      </button>
                      <div className="my-1 h-px bg-border-light dark:bg-border-dark"></div>
                      <button className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full">
                        <span className="material-symbols-outlined text-lg">delete</span>
                        <span>Delete Block</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-light dark:text-on-surface-dark hover:bg-slate-100 dark:hover:bg-slate-700 w-full" onClick={() => onSelect('speak')}>
                        <span className="material-symbols-outlined text-lg text-muted-light dark:text-muted-dark">record_voice_over</span>
                        <span>Speak</span>
                      </button>
                      <button className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-light dark:text-on-surface-dark hover:bg-slate-100 dark:hover:bg-slate-700 w-full" onClick={() => onSelect('listen')}>
                        <span className="material-symbols-outlined text-lg text-muted-light dark:text-muted-dark">hearing</span>
                        <span>Listen</span>
                      </button>
                      <button className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-light dark:text-on-surface-dark hover:bg-slate-100 dark:hover:bg-slate-700 w-full" onClick={() => onSelect('condition')}>
                        <span className="material-symbols-outlined text-lg text-muted-light dark:text-muted-dark">call_split</span>
                        <span>If</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </ReactFlowProvider>
    </div>
  );
};

export default App;
