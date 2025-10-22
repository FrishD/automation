import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlowProvider,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
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
import EditableTitle from './components/EditableTitle.js';
import FlowCanvas from './components/FlowCanvas.js';


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
  const [state, { set: setState, undo, redo, canUndo, canRedo }] = useUndo({ nodes: [], edges: [] });
  const { nodes, edges } = state.present;

  const onNodesChange = useCallback((changes) => {
    const newNodes = applyNodeChanges(changes, nodes);
    const loopNodes = newNodes.filter(n => n.type === 'loop');
    if (!loopNodes.length) {
        setState({ ...state.present, nodes: newNodes });
        return;
    }

    const updatedNodes = newNodes.map(n => {
        if (n.type === 'loop') {
            const children = newNodes.filter(child => child.parentNode === n.id);
            if (!children.length) return n;

            const PADDING = 20;
            const minX = Math.min(...children.map(c => c.position.x)) - PADDING;
            const minY = Math.min(...children.map(c => c.position.y)) - PADDING;
            const maxX = Math.max(...children.map(c => c.position.x + c.width)) + PADDING;
            const maxY = Math.max(...children.map(c => c.position.y + c.height)) + PADDING;

            const newWidth = maxX - minX;
            const newHeight = maxY - minY;

            if (n.style?.width !== newWidth || n.style?.height !== newHeight) {
                return {
                    ...n,
                    style: {
                        ...n.style,
                        width: newWidth,
                        height: newHeight
                    }
                };
            }
        }
        return n;
    });

    setState({ ...state.present, nodes: updatedNodes });
}, [nodes, setState, state.present]);

  const onEdgesChange = useCallback((changes) => {
    const newEdges = applyEdgeChanges(changes, edges);
    const updatedEdges = newEdges.map((edge) => {
      if (edge.sourceHandle) {
        const sourceNode = nodes.find((node) => node.id === edge.source);
        if (sourceNode && sourceNode.data.conditions && sourceNode.data.conditions[edge.sourceHandle]) {
          const keyword = sourceNode.data.conditions[edge.sourceHandle].keyword;
          const newLabel = keyword || `[Connect to save keyword]`;
          if (edge.label !== newLabel) {
            return { ...edge, label: newLabel };
          }
        }
      }
      return edge;
    });

    setState({
      ...state.present,
      edges: updatedEdges,
    });
  }, [nodes, edges, setState, state.present]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [currentFlowId, setCurrentFlowId] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [showMinimap, setShowMinimap] = useState(true);
  const [loading, setLoading] = useState(true);

  const onAddNode = useCallback((type, position) => {
    let initialData = { label: `${type} node` };
      switch (type) {
        case 'speak':
          initialData.text = 'Agent says...';
          break;
        case 'condition':
          initialData.conditions = [{ keyword: '' }];
          break;
        case 'wait':
          initialData.duration = 1;
          initialData.units = 'seconds';
          break;
        case 'variable':
          initialData.variableAction = 'set';
          initialData.variableName = 'myVar';
          initialData.variableValue = 'value';
          break;
        case 'play_audio':
          initialData.url = 'https://example.com/audio.mp3';
          break;
        case 'confirmation':
          initialData.text = 'Are you sure?';
          break;
        case 'summary':
          initialData.text = 'Thank you for calling.';
          initialData.enableRating = false;
          break;
        case 'loop':
            initialData.loopType = 'count';
            initialData.count = 2;
            break;
        default:
          break;
      }
    const newNode = {
      id: `dndnode_${+new Date()}`,
      type,
      position,
      data: initialData,
    };
    setState({ ...state.present, nodes: [...nodes, newNode] });
  }, [nodes, setState, state.present]);

  const onNodeDragStop = useCallback((event, node) => {
    const parentNode = nodes.find(n =>
      node.position.x >= n.position.x &&
      node.position.x <= n.position.x + n.width &&
      node.position.y >= n.position.y &&
      node.position.y <= n.position.y + n.height &&
      n.type === 'loop' &&
      n.id !== node.id
    );

    if (parentNode) {
      setState({
        ...state.present,
        nodes: nodes.map(n =>
          n.id === node.id ? { ...n, parentNode: parentNode.id, extent: 'parent' } : n
        ),
      });
    }
  }, [nodes, setState, state.present]);


  const onNodeDataChange = useCallback((nodeId, newData) => {
    setState({
      ...state.present,
      nodes: nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      }),
    });
  }, [nodes, setState, state.present]);


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
        setState({ nodes: newFlow.nodes, edges: newFlow.edges });
        setFlowName(newFlow.name);
        setCurrentFlowId(newFlow._id);
    } catch (error) {
        console.error("Error creating new flow:", error);
    }
  }, [setState, setFlowName, setCurrentFlowId]);


  useEffect(() => {
    const fetchInitialFlow = async () => {
      setLoading(true);
      try {
        const response = await axios.get(API_URL);
        if (response.data && response.data.length > 0) {
          const firstFlow = response.data[0];
          setState({ nodes: firstFlow.nodes || [], edges: firstFlow.edges || [] });
          setFlowName(firstFlow.name || 'Untitled Flow');
          setCurrentFlowId(firstFlow._id);
          id = (firstFlow.nodes || []).length + 1;
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
  }, [setState, createNewFlow]);


  const onConnect = useCallback((params) => {
    let newEdge = { ...params };
    const sourceNode = nodes.find(node => node.id === params.source);
    if (sourceNode && params.sourceHandle) {
        if (sourceNode.data.conditions && sourceNode.data.conditions[params.sourceHandle]) {
            const keyword = sourceNode.data.conditions[params.sourceHandle].keyword;
            newEdge.label = keyword || `[Connect to save keyword]`;
        }
    }
    setState({ ...state.present, edges: addEdge(newEdge, edges) });
    }, [nodes, edges, setState, state.present]);

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
      switch (type) {
        case 'speak':
          initialData.text = 'Agent says...';
          break;
        case 'condition':
          initialData.conditions = [{ keyword: '' }];
          break;
        case 'wait':
          initialData.duration = 1;
          initialData.units = 'seconds';
          break;
        case 'variable':
          initialData.variableAction = 'set';
          initialData.variableName = 'myVar';
          initialData.variableValue = 'value';
          break;
        case 'play_audio':
          initialData.url = 'https://example.com/audio.mp3';
          break;
        case 'confirmation':
          initialData.text = 'Are you sure?';
          break;
        case 'summary':
          initialData.text = 'Thank you for calling.';
          initialData.enableRating = false;
          break;
        case 'loop':
            initialData.loopType = 'count';
            initialData.count = 2;
            break;
        default:
          break;
      }

      const newNode = {
        id: getId(),
        type,
        position,
        data: initialData,
      };

      setState({ ...state.present, nodes: nodes.concat(newNode) });
    },
    [reactFlowInstance, nodes, setState, state.present],
  );


  const saveFlow = async () => {
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
                  <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50">
                    <span className="material-symbols-outlined text-lg">undo</span>
                  </button>
                  <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50">
                    <span className="material-symbols-outlined text-lg">redo</span>
                  </button>
                </div>
                <EditableTitle value={flowName} onChange={setFlowName} />
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
              <FlowCanvas
                nodes={nodesWithDataHandlers}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onAddNode={onAddNode}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                showMinimap={showMinimap}
              />
            </div>
          </div>
        </main>
      </ReactFlowProvider>
    </div>
  );
};

export default App;
