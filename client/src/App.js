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
  const [flowState, { set: setFlowState, undo: undoFlow, redo: redoFlow, canUndo: canUndoFlow, canRedo: canRedoFlow }] = useUndo({ nodes: [], edges: [] });
  const { nodes, edges } = flowState.present;
  const onNodesChange = useCallback((changes) => {
    setFlowState({
      ...flowState.present,
      nodes: applyNodeChanges(changes, nodes),
    });
  }, [flowState.present, nodes, setFlowState]);
  const onEdgesChange = useCallback((changes) => {
    setFlowState({
      ...flowState.present,
      edges: applyEdgeChanges(changes, edges),
    });
  }, [flowState.present, edges, setFlowState]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [currentFlowId, setCurrentFlowId] = useState(null);
  const [menu, setMenu] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [showMinimap, setShowMinimap] = useState(true);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchHistory = async () => {
    if (!currentFlowId) return;
    try {
      const response = await axios.get(`${API_URL}/${currentFlowId}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const restoreVersion = async (historyId) => {
    if (!currentFlowId) return;
    try {
      const response = await axios.put(`${API_URL}/${currentFlowId}/history/${historyId}`);
      setFlowState({ nodes: response.data.nodes, edges: response.data.edges });
      setNotification({ message: 'Version restored!', type: 'success' });
      setShowHistory(false);
    } catch (error) {
      console.error("Error restoring version:", error);
      setNotification({ message: 'Error restoring version.', type: 'error' });
    }
  };

  const exportFlow = () => {
    const flowData = {
      name: flowName,
      nodes: nodes.map(({ data, ...node }) => {
        const { onChange, ...restData } = data;
        return { ...node, data: restData };
      }),
      edges: edges,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flowData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${flowName.replace(/\s/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const onNodeDataChange = useCallback((nodeId, newData) => {
    setFlowState({
      ...flowState.present,
      nodes: nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      }),
    });
  }, [flowState.present, nodes, setFlowState]);


  const nodesWithDataHandlers = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onChange: (newData) => onNodeDataChange(node.id, newData)
      }
    }));
  }, [nodes, onNodeDataChange]);

  const createNewFlow = useCallback(async () => {
    try {
        const initialNodes = [{ id: 'start_node_0', type: 'start', position: { x: 150, y: 150 }, data: { label: 'Start' } }];
        const response = await axios.post(API_URL, {
            name: 'New Conversation',
            nodes: initialNodes,
            edges: [],
        });
        const newFlow = response.data;
        setFlowState({ nodes: newFlow.nodes, edges: newFlow.edges });
        setFlowName(newFlow.name);
        setCurrentFlowId(newFlow._id);
    } catch (error) {
        console.error("Error creating new flow:", error);
    }
  }, [setFlowState, setFlowName, setCurrentFlowId]);


  useEffect(() => {
    const fetchInitialFlow = async () => {
      setLoading(true);
      try {
        const response = await axios.get(API_URL);
        if (response.data && response.data.length > 0) {
          const firstFlow = response.data[0];
          setFlowState({ nodes: firstFlow.nodes || [], edges: firstFlow.edges || [] });
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
  }, [setFlowState, createNewFlow]);

  useEffect(() => {
    const handleClickOutside = () => setMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Effect to update edge labels when a condition node's data changes
  useEffect(() => {
    if (loading) return;

    let hasChanged = false;
    const newEdges = edges.map((edge) => {
      if (edge.sourceHandle) {
        const sourceNode = nodes.find((node) => node.id === edge.source);
        if (sourceNode?.data?.conditions?.[edge.sourceHandle]) {
          const keyword = sourceNode.data.conditions[edge.sourceHandle].keyword || '[Connect to save keyword]';
          if (edge.label !== keyword) {
            hasChanged = true;
            return { ...edge, label: keyword };
          }
        }
      }
      return edge;
    });

    if (hasChanged) {
      setFlowState({
        ...flowState.present,
        edges: newEdges,
      });
    }
  }, [nodes, edges, setFlowState, loading, flowState.present]);

  const onConnect = useCallback((params) => {
    let newEdge = { ...params };
    const sourceNode = nodes.find(node => node.id === params.source);
    if (sourceNode && params.sourceHandle) {
        if (sourceNode.data.conditions && sourceNode.data.conditions[params.sourceHandle]) {
            const keyword = sourceNode.data.conditions[params.sourceHandle].keyword;
            newEdge.label = keyword || `[Connect to save keyword]`;
        }
    }
    setFlowState({
        ...flowState.present,
        edges: addEdge(newEdge, edges),
    });
    }, [flowState.present, nodes, edges, setFlowState]);

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

      setFlowState({
        ...flowState.present,
        nodes: nodes.concat(newNode),
      });
    },
    [reactFlowInstance, flowState.present, nodes, setFlowState],
  );

  const onPaneContextMenu = (event) => {
    event.preventDefault();
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
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
    setFlowState({
        ...flowState.present,
        nodes: nodes.concat(newNode),
    });
    setMenu(null);
  };

  const saveFlow = useCallback(async () => {
    if (!currentFlowId) return;
    try {
        const nodesToSave = nodes.map(({ data, ...node }) => {
            const { onChange, ...restData } = data;
            return { ...node, data: restData };
        });

        await axios.post(`${API_URL}/${currentFlowId}/history`, {
            nodes: nodesToSave,
            edges: edges,
        });
    } catch (error) {
        console.error("Error autosaving flow:", error);
    }
  }, [currentFlowId, flowName, nodes, edges]);

  useEffect(() => {
    const handler = setTimeout(() => saveFlow(), 1500);
    return () => clearTimeout(handler);
  }, [nodes, edges, saveFlow]);

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
          <div className="h-full w-full bg-surface-light dark:bg-surface-dark rounded-xl relative overflow-hidden flex flex-col">
            <div ref={reactFlowWrapper} className="flex-grow relative cursor-grab active:cursor-grabbing">
              <div className="flex items-center justify-between p-1.5 border-b border-border-light dark:border-border-dark flex-shrink-0">
                <div className="flex items-center gap-1">
                  <button onClick={undoFlow} disabled={!canUndoFlow} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50">
                    <span className="material-symbols-outlined text-lg">undo</span>
                  </button>
                  <button onClick={redoFlow} disabled={!canRedoFlow} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50">
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
                  <button onClick={exportFlow} className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-base">download</span>
                    <span>Export</span>
                  </button>
                  <button onClick={saveFlow} className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-primary text-white hover:bg-primary/90">
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>Save</span>
                  </button>
                  <button onClick={() => setShowMinimap(!showMinimap)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-lg">map</span>
                  </button>
                  <button onClick={() => { fetchHistory(); setShowHistory(true); }} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-lg">history</span>
                  </button>
                </div>
              </div>
              {showHistory && (
                <div className="absolute top-0 left-0 z-40 w-full h-full bg-black/30 flex items-center justify-center">
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                    <h3 className="text-lg font-medium mb-4">Version History</h3>
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                      {history.slice().reverse().map((version) => (
                        <li key={version._id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                          <span>{new Date(version.savedAt).toLocaleString()}</span>
                          <button onClick={() => restoreVersion(version._id)} className="px-3 py-1 text-xs rounded-md bg-primary text-white hover:bg-primary/90">
                            Restore
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => setShowHistory(false)} className="mt-4 px-4 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                      Close
                    </button>
                  </div>
                </div>
              )}
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
                onNodeContextMenu={onNodeContextMenu}
                fitView
                nodeTypes={nodeTypes}
                snapToGrid={true}
                snapGrid={[20, 20]}
                multiSelectionKeyCode={null}
              >
                <Background variant="lines" gap={20} size={1} />
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
