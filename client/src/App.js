import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import Sidebar from './components/Sidebar.js';
import './App.css';

import StartNode from './components/nodes/StartNode.js';
import SpeakNode from './components/nodes/SpeakNode.js';
import ListenNode from './components/nodes/ListenNode.js';
import ConditionNode from './components/nodes/ConditionNode.js';
import EndNode from './components/nodes/EndNode.js';


const API_URL = 'http://localhost:5000/api/flows';
let id = 0;
const getId = () => `dndnode_${id++}`;

const App = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [currentFlowId, setCurrentFlowId] = useState(null);

  const nodeTypes = useMemo(() => ({
    start: StartNode,
    speak: SpeakNode,
    listen: ListenNode,
    condition: ConditionNode,
    end: EndNode,
  }), []);

  useEffect(() => {
    const fetchInitialFlow = async () => {
      try {
        const response = await axios.get(API_URL);
        if (response.data && response.data.length > 0) {
          const firstFlow = response.data[0];
          setNodes(firstFlow.nodes || []);
          setEdges(firstFlow.edges || []);
          setFlowName(firstFlow.name || 'Untitled Flow');
          setCurrentFlowId(firstFlow._id);
        } else {
          createNewFlow();
        }
      } catch (error) {
        console.error("Error fetching flows:", error);
      }
    };
    fetchInitialFlow();
  }, []);

  const createNewFlow = async () => {
    try {
        const initialNodes = [{ id: 'start_node', type: 'start', position: { x: 150, y: 150 }, data: { label: 'Start' } }];
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
};

  const onConnect = useCallback((params) => {
    // For condition nodes, the handle ID tells us which condition it is
    if (params.sourceHandle) {
        params.label = `Condition ${params.sourceHandle}`;
    }
    setEdges((eds) => addEdge(params, eds))
    }, [setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` }, // Initial data
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance],
  );

  const saveFlow = async () => {
    if (!currentFlowId) return;
    try {
        await axios.put(`${API_URL}/${currentFlowId}`, {
            name: flowName,
            nodes: nodes,
            edges: edges,
        });
        alert('Flow saved!');
    } catch (error) {
        console.error("Error saving flow:", error);
        alert('Error saving flow.');
    }
  };

  return (
    <div className="dndflow">
      <ReactFlowProvider>
        <Sidebar />
        <div className="reactflow-wrapper" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            nodeTypes={nodeTypes}
          >
            <Controls />
            <Background variant="dots" gap={12} size={1} />
             <div className="top-bar">
                <input value={flowName} onChange={(e) => setFlowName(e.target.value)} />
                <button onClick={saveFlow}>Save Flow</button>
            </div>
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default App;
