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
import 'reactflow/dist/style.css';
import './App.css';
import axios from 'axios';
import Sidebar from './components/Sidebar.js';
import useUndo from 'use-undo';

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
import Modal from './components/Modal.js';
import { TourProvider } from '@reactour/tour';
import Simulator from './components/Simulator.js';
import HistoryModal from './components/HistoryModal.js';
import Tour from './components/Tour.js';


const API_URL = 'http://localhost:5000/api/flows';
let id = 0;
const getId = () => `dndnode_${id++}`;

const AppComponent = () => {
  const nodeTypes = useMemo(() => ({
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
  }), []);
  const reactFlowWrapper = useRef(null);
  const [
    flowState,
    {
      set: setFlowState,
      reset: resetFlowState,
      undo: undoFlowState,
      redo: redoFlowState,
      canUndo,
      canRedo,
    },
  ] = useUndo({ nodes: [], edges: [] });

  const { nodes, edges } = flowState.present;
  const setNodes = useCallback((newNodes) => setFlowState({ ...flowState.present, nodes: newNodes }), [flowState.present, setFlowState]);
  const setEdges = useCallback((newEdges) => setFlowState({ ...flowState.present, edges: newEdges }), [flowState.present, setFlowState]);

  const onNodesChange = useCallback((changes) => setNodes(applyNodeChanges(changes, nodes)), [nodes, setNodes]);
  const onEdgesChange = useCallback((changes) => setEdges(applyEdgeChanges(changes, edges)), [edges, setEdges]);

  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [currentFlowId, setCurrentFlowId] = useState(null);
  const [menu, setMenu] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [showMinimap, setShowMinimap] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [highlightedNode, setHighlightedNode] = useState(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);

  const handleRestore = (version) => {
    resetFlowState(version);
    setIsHistoryPanelOpen(false);
    setNotification({ message: 'Flow restored!', type: 'success' });
  };

  const handleReset = () => {
    const startNode = nodes.find(node => node.type === 'start');
    resetFlowState({ nodes: startNode ? [startNode] : [], edges: [] });
    setIsResetModalOpen(false);
    setNotification({ message: 'Canvas reset!', type: 'success' });
  };

  const onNodeDataChange = useCallback((nodeId, newData) => {
    setNodes(
      nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, [nodes, setNodes]);


  const nodesWithDataHandlers = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onChange: (newData) => onNodeDataChange(node.id, newData),
        isHighlighted: node.id === highlightedNode,
      }
    }));
  }, [nodes, onNodeDataChange, highlightedNode]);

  const createNewFlow = useCallback(async () => {
    try {
        const initialNodes = [{ id: 'start_node_0', type: 'start', position: { x: 150, y: 150 }, data: { label: 'Start' } }];
        const response = await axios.post(API_URL, {
            name: 'New Conversation',
            nodes: initialNodes,
            edges: [],
        });
        const newFlow = response.data;
        resetFlowState({ nodes: newFlow.nodes, edges: newFlow.edges });
        setFlowName(newFlow.name);
        setCurrentFlowId(newFlow._id);
    } catch (error) {
        console.error("Error creating new flow:", error);
    }
  }, [resetFlowState, setFlowName, setCurrentFlowId]);

  useEffect(() => {
    const root = document.getElementById('root');
    if (isSimulatorOpen) {
      root.classList.add('simulator-open');
    } else {
      root.classList.remove('simulator-open');
    }
  }, [isSimulatorOpen]);

  useEffect(() => {
    const fetchInitialFlow = async () => {
      setLoading(true);
      try {
        const response = await axios.get(API_URL);
        if (response.data && response.data.length > 0) {
          const firstFlow = response.data[0];
          resetFlowState({ nodes: firstFlow.nodes || [], edges: firstFlow.edges || [] });
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
  }, [resetFlowState, createNewFlow]);

  // Effect to update edge labels when a condition node's data changes
  useEffect(() => {
    if (loading) return;
    const newEdges = edges.map((edge) => {
      if (edge.sourceHandle) {
        const sourceNode = nodes.find((node) => node.id === edge.source);
        if (sourceNode && sourceNode.data.conditions && sourceNode.data.conditions[edge.sourceHandle]) {
          const keyword = sourceNode.data.conditions[edge.sourceHandle].keyword;
          if (edge.label !== keyword) {
            return { ...edge, label: keyword || `[Connect to save keyword]` };
          }
        }
      }
      return edge;
    });

    if (JSON.stringify(newEdges) !== JSON.stringify(edges)) {
      setEdges(newEdges);
    }
  }, [nodes, edges, setEdges, loading]);

  const onConnect = useCallback((params) => {
    let newEdge = { ...params };
    const sourceNode = nodes.find(node => node.id === params.source);
    if (sourceNode && params.sourceHandle) {
        if (sourceNode.data.conditions && sourceNode.data.conditions[params.sourceHandle]) {
            const keyword = sourceNode.data.conditions[params.sourceHandle].keyword;
            newEdge.label = keyword || `[Connect to save keyword]`;
        }
    }
    setEdges(addEdge(newEdge, edges));
    }, [nodes, edges, setEdges]);

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

      setNodes(nodes.concat(newNode));
    },
    [reactFlowInstance, nodes, setNodes],
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
    setNodes(nodes.concat(newNode));
    setMenu(null);
  };

  const saveFlow = useCallback(async () => {
    if (!currentFlowId) return;
    try {
        const nodesToSave = nodes.map(({ data, ...node }) => {
            const { onChange, ...restData } = data;
            return { ...node, data: restData };
        });

        await axios.put(`${API_URL}/${currentFlowId}`, {
            name: flowName,
            nodes: nodesToSave,
            edges: edges,
        });
        setNotification({ message: 'Flow saved!', type: 'success' });
    } catch (error) {
        console.error("Error saving flow:", error);
        setNotification({ message: 'Error saving flow.', type: 'error' });
    }
  }, [currentFlowId, flowName, nodes, edges]);

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
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleReset}
        title="Reset Canvas"
      >
        Are you sure you want to reset the canvas? All unsaved changes will be lost.
      </Modal>
      <ReactFlowProvider>
        <Simulator
          isOpen={isSimulatorOpen}
          onClose={() => {
            setIsSimulatorOpen(false);
            setHighlightedNode(null);
          }}
          currentFlowId={currentFlowId}
          onNodeHighlight={setHighlightedNode}
        />
        <HistoryModal
          isOpen={isHistoryPanelOpen}
          onClose={() => setIsHistoryPanelOpen(false)}
          currentFlowId={currentFlowId}
          onRestore={handleRestore}
        />
        <Sidebar onReset={() => setIsResetModalOpen(true)} />
        <main className="flex-1 bg-background-light dark:bg-background-dark p-6">
          <div data-tour="canvas" className="h-full w-full bg-surface-light dark:bg-surface-dark rounded-xl relative overflow-hidden flex flex-col" style={{backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
            <div ref={reactFlowWrapper} className="flex-grow relative cursor-grab active:cursor-grabbing">
              <div className="header-controls flex items-center justify-between p-1.5 border-b border-border-light dark:border-border-dark flex-shrink-0">
                <div className="flex items-center gap-1">
                  <button onClick={undoFlowState} disabled={!canUndo} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50">
                    <span className="material-symbols-outlined text-lg">undo</span>
                  </button>
                  <button onClick={redoFlowState} disabled={!canRedo} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50">
                    <span className="material-symbols-outlined text-lg">redo</span>
                  </button>
                </div>
                <input
                  data-tour="flow-name"
                  type="text"
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  className="nodrag text-sm font-medium text-on-surface-light dark:text-on-surface-dark bg-transparent text-center"
                />
                <div className="flex items-center gap-1.5 mr-1">
                  <button data-tour="simulate-button" onClick={() => setIsSimulatorOpen(true)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-lg">play_circle</span>
                  </button>
                  <button data-tour="history-button" onClick={() => setIsHistoryPanelOpen(true)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-lg">history</span>
                  </button>
                  <Tour />
                  <button data-tour="save-button" onClick={saveFlow} className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-primary text-white hover:bg-primary/90">
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
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onPaneContextMenu={onPaneContextMenu}
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
                      <button className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-light dark:text-on-surface-dark hover:bg-slate-100 dark:hover:bg-slate-700 w-all" onClick={() => onSelect('listen')}>
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

const tourSteps = [
  {
    selector: '[data-tour="palette"]',
    content: 'This is the Palette. Drag and drop nodes from here onto the canvas to build your conversation flow.',
  },
  {
    selector: '[data-tour="canvas"]',
    content: 'This is the canvas, where you build your flow. Right-click to quickly add nodes. Connect nodes by dragging from the handles.',
  },
  {
    selector: '[data-tour="flow-name"]',
    content: 'You can change the name of your conversation flow here.',
  },
  {
    selector: '[data-tour="save-button"]',
    content: 'Click here to save your progress.',
  },
  {
    selector: '[data-tour="simulate-button"]',
    content: 'Use this button to open the simulator and test your conversation.',
  },
  {
    selector: '[data-tour="history-button"]',
    content: 'Access the version history to view and restore previous versions of your flow.',
  },
  {
    selector: '[data-tour="listen-node-example"]',
    content: 'In a "Listen" node, you can drag "Variable" nodes inside to capture specific user inputs like names, dates, or numbers.',
  },
];

const App = () => (
  <TourProvider steps={tourSteps}>
    <AppComponent />
  </TourProvider>
);

export default App;
