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

  const onNodeDataChange = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const nodeTypes = useMemo(() => ({
    start: StartNode,
    speak: SpeakNode,
    listen: ListenNode,
    condition: ConditionNode,
    end: EndNode,
  }), []);

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
        setNodes(newFlow.nodes);
        setEdges(newFlow.edges);
        setFlowName(newFlow.name);
        setCurrentFlowId(newFlow._id);
    } catch (error) {
        console.error("Error creating new flow:", error);
    }
  }, [setNodes, setEdges]);


  useEffect(() => {
    const fetchInitialFlow = async () => {
      try {
        const response = await axios.get(API_URL);
        console.log('Fetched data:', response.data); // DEBUGGING
        if (response.data && response.data.length > 0) {
          const firstFlow = response.data[0];
          setNodes(firstFlow.nodes || []);
          setEdges(firstFlow.edges || []);
          setFlowName(firstFlow.name || 'Untitled Flow');
          setCurrentFlowId(firstFlow._id);
          id = firstFlow.nodes.length + 1;
        } else {
          createNewFlow();
        }
      } catch (error) {
        console.error("Error fetching flows:", error);
      }
    };
    fetchInitialFlow();
  }, [setNodes, setEdges, createNewFlow]);

  // Effect to update edge labels when a condition node's data changes
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.sourceHandle) {
          const sourceNode = nodes.find((node) => node.id === edge.source);
          if (sourceNode && sourceNode.data.conditions && sourceNode.data.conditions[edge.sourceHandle]) {
            const keyword = sourceNode.data.conditions[edge.sourceHandle].keyword;
            edge.label = keyword || `[Connect to save keyword]`;
          }
        }
        return edge;
      })
    );
  }, [nodes, setEdges]);

  const onConnect = useCallback((params) => {
    let newEdge = { ...params };
    const sourceNode = nodes.find(node => node.id === params.source);
    if (sourceNode && params.sourceHandle) {
        if (sourceNode.data.conditions && sourceNode.data.conditions[params.sourceHandle]) {
            const keyword = sourceNode.data.conditions[params.sourceHandle].keyword;
            newEdge.label = keyword || `[Connect to save keyword]`;
        }
    }
    setEdges((eds) => addEdge(newEdge, eds));
    }, [nodes, setEdges]);

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

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
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
            nodes={nodesWithDataHandlers}
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
                <input value={flowName} onChange={(e) => setFlowName(e.target.value)} className="nodrag"/>
                <button onClick={saveFlow}>Save Flow</button>
            </div>
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default App;
