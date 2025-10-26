import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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

// Node and component imports
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
import GoogleCalendarNode from './components/nodes/GoogleCalendarNode.js';
import Notification from './components/Notification.js';
import Modal from './components/Modal.js';
import { TourProvider } from '@reactour/tour';
import Simulator from './components/Simulator.js';
import HistoryModal from './components/HistoryModal.js';
import SettingsModal from './components/SettingsModal.js';
import Tour from './components/Tour.js';

// --- Auth Components ---
const AuthCallback = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('jwtToken', token);
      window.location.href = '/'; // Force a full refresh to re-initialize state
    } else {
      navigate('/'); // Or an error page
    }
  }, [navigate]);
  return <p>Authenticating...</p>;
};

// --- Axios interceptor to add JWT to requests ---
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let id = 0;
const getId = () => `dndnode_${id++}`;

const FlowEditor = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (token) setIsLoggedIn(true);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        setIsLoggedIn(false);
    };

    const nodeTypes = useMemo(() => ({
        start: StartNode, speak: SpeakNode, listen: ListenNode, condition: ConditionNode,
        end: EndNode, variable: VariableNode, wait: WaitNode, loop: LoopNode,
        play_audio: PlayAudioNode, confirmation: ConfirmationNode, summary: SummaryNode,
        google_calendar: GoogleCalendarNode,
    }), []);

    const reactFlowWrapper = useRef(null);
    const [ flowState, { set: setFlowState, reset: resetFlowState, undo: undoFlowState, redo: redoFlowState, canUndo, canRedo } ] = useUndo({ nodes: [], edges: [] });
    const { nodes, edges } = flowState.present;
    const setNodes = useCallback((newNodes) => setFlowState({ ...flowState.present, nodes: newNodes }), [flowState.present, setFlowState]);
    const setEdges = useCallback((newEdges) => setFlowState({ ...flowState.present, edges: newEdges }), [flowState.present, setFlowState]);

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
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const onNodesChange = (changes) => setNodes(applyNodeChanges(changes, nodes));
    const onEdgesChange = (changes) => setEdges(applyEdgeChanges(changes, edges));

    const createNewFlow = useCallback(async () => {
        try {
            const initialNodes = [{ id: 'start_node_0', type: 'start', position: { x: 150, y: 150 }, data: { label: 'Start' } }];
            const response = await api.post('/flows', { name: 'New Conversation', nodes: initialNodes, edges: [] });
            const newFlow = response.data;
            resetFlowState({ nodes: newFlow.nodes, edges: newFlow.edges });
            setFlowName(newFlow.name);
            setCurrentFlowId(newFlow._id);
        } catch (error) { console.error("Error creating new flow:", error); }
    }, [resetFlowState]);

    useEffect(() => {
        const fetchInitialFlow = async () => {
          setLoading(true);
          try {
            const response = await api.get('/flows');
            if (response.data && response.data.length > 0) {
              const firstFlow = response.data[0];
              resetFlowState({ nodes: firstFlow.nodes || [], edges: firstFlow.edges || [] });
              setFlowName(firstFlow.name || 'Untitled Flow');
              setCurrentFlowId(firstFlow._id);
            } else {
              await createNewFlow();
            }
          } catch (error) { console.error("Error fetching flows:", error); }
          finally { setLoading(false); }
        };
        fetchInitialFlow();
      }, [resetFlowState, createNewFlow]);

      const onNodeDataChange = useCallback((nodeId, newData) => {
        setNodes(nodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node));
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

    const saveFlow = useCallback(async () => {
        if (!currentFlowId) return;
        try {
            const nodesToSave = nodes.map(({ data, ...node }) => {
                const { onChange, isHighlighted, ...restData } = data;
                return { ...node, data: restData };
            });
            await api.put(`/flows/${currentFlowId}`, { name: flowName, nodes: nodesToSave, edges: edges });
            setNotification({ message: 'Flow saved!', type: 'success' });
        } catch (error) {
            setNotification({ message: 'Error saving flow.', type: 'error' });
        }
    }, [currentFlowId, flowName, nodes, edges]);

    const onConnect = useCallback((params) => setEdges(addEdge(params, edges)), [edges, setEdges]);

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
          const newNode = {
            id: getId(),
            type,
            position,
            data: { label: `${type} node` },
          };

          setNodes(nodes.concat(newNode));
        },
        [reactFlowInstance, nodes, setNodes],
      );

    const handleSimulate = useCallback(async () => {
        await saveFlow();
        setIsSimulatorOpen(true);
    }, [saveFlow]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="flex h-screen">
            <Notification message={notification.message} type={notification.type} onClear={() => setNotification({ message: '', type: '' })} />
            <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={() => {}}> Reset Canvas </Modal>
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} isLoggedIn={isLoggedIn} onLogout={handleLogout} />
            <HistoryModal isOpen={isHistoryPanelOpen} onClose={() => setIsHistoryPanelOpen(false)} currentFlowId={currentFlowId} onRestore={() => {}} />
            <Simulator isOpen={isSimulatorOpen} onClose={() => {setIsSimulatorOpen(false); setHighlightedNode(null);}} currentFlowId={currentFlowId} onNodeHighlight={setHighlightedNode} />

            <ReactFlowProvider>
                <Sidebar onReset={() => setIsResetModalOpen(true)} />
                <main className={`flex-1 bg-background-light dark:bg-background-dark p-6 ${isSimulatorOpen ? 'simulator-open' : ''}`}>
                    <div data-tour="canvas" className="h-full w-full bg-surface-light dark:bg-surface-dark rounded-xl relative overflow-hidden flex flex-col">
                        <div ref={reactFlowWrapper} className="flex-grow relative cursor-grab active:cursor-grabbing">
                            <div className="header-controls flex items-center justify-between p-1.5 border-b">
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
                                    <button data-tour="simulate-button" onClick={handleSimulate} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                                        <span className="material-symbols-outlined text-lg">play_circle</span>
                                    </button>
                                    <button data-tour="history-button" onClick={() => setIsHistoryPanelOpen(true)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                                        <span className="material-symbols-outlined text-lg">history</span>
                                    </button>
                                    <button onClick={() => setIsSettingsModalOpen(true)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                                        <span className="material-symbols-outlined text-lg">settings</span>
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
                                nodeTypes={nodeTypes}
                                fitView
                            >
                                <Background />
                                <Controls />
                                {showMinimap && <MiniMap className="absolute top-4 right-4 z-20 w-48 h-32 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer" />}
                            </ReactFlow>
                        </div>
                    </div>
                </main>
            </ReactFlowProvider>
        </div>
    );
};

const App = () => (
    <TourProvider steps={[]}>
      <Routes>
        <Route path="/" element={<FlowEditor />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </TourProvider>
);

export default App;
