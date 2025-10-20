import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import CustomNode from './components/CustomNode.js'; // Corrected import path
import './App.css';

const API_URL = 'http://localhost:5000/api/flows';
let id = 1;
const getId = () => `dndnode_${id++}`;


const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [currentFlowId, setCurrentFlowId] = useState(null);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Function to handle label changes in a node
  const handleNodeLabelChange = useCallback((nodeId, newLabel) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          // It's important to create a new object for the data property
          // to trigger a re-render of the custom node.
          return { ...node, data: { ...node.data, label: newLabel } };
        }
        return node;
      })
    );
  }, [setNodes]);

  useEffect(() => {
    const fetchInitialFlow = async () => {
      try {
        const response = await axios.get(API_URL);
        if (response.data && response.data.length > 0) {
          const firstFlow = response.data[0];
          const formattedNodes = firstFlow.nodes.map(node => ({
            ...node,
            type: node.type || 'custom',
            position: { x: node.position.x, y: node.position.y },
            // Pass the change handler to the node's data
            data: { ...node.data, onLabelChange: (newLabel) => handleNodeLabelChange(node.id, newLabel) }
          }));
          setNodes(formattedNodes || []);
          setEdges(firstFlow.edges || []);
          setFlowName(firstFlow.name || 'Untitled Flow');
          setCurrentFlowId(firstFlow._id);
        } else {
          createNewFlow();
        }
      } catch (error) {
        console.error("Error fetching flows:", error);
        setNodes([{ id: '1', type: 'input', data: { label: 'Start' }, position: { x: 250, y: 5 } }]);
      }
    };
    fetchInitialFlow();
  }, [setNodes, setEdges, handleNodeLabelChange]); // Added handleNodeLabelChange to dependencies

  const createNewFlow = async () => {
    try {
      const initialNodes = [{ id: '1', type: 'input', data: { label: 'Start' }, position: { x: 250, y: 5 } }];
      const response = await axios.post(API_URL, {
        name: 'New Conversation Flow',
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

  const onConnect = useCallback(
    (params) => {
      const label = prompt("Enter trigger phrase (e.g., 'hello', 'check balance'):");
      if (label === null) return;
      const newEdge = { ...params, label };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const addNode = () => {
    const nodeId = getId();
    const newNode = {
      id: nodeId,
      type: 'custom',
      data: {
        label: 'New Response',
        // Pass the change handler for the new node
        onLabelChange: (newLabel) => handleNodeLabelChange(nodeId, newLabel)
      },
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const saveFlow = async () => {
    if (!currentFlowId) {
      console.error("No flow ID is set. Cannot save.");
      return;
    }
    try {
      // The `nodes` state is now the source of truth, no need to query the DOM.
      // We should, however, remove the onChange handler before saving to the DB.
      const nodesToSave = nodes.map(({ data, ...node }) => {
        const { onLabelChange, ...restData } = data;
        return { ...node, data: restData };
      });

      await axios.put(`${API_URL}/${currentFlowId}`, {
        name: flowName,
        nodes: nodesToSave,
        edges: edges,
      });
      alert('Flow saved successfully!');
    } catch (error) {
      console.error("Error saving flow:", error);
      alert('Failed to save flow.');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Conversation Flow Builder</h1>
        <input
          type="text"
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          className="flow-name-input"
        />
        <button onClick={addNode} className="add-node-button">Add Node</button>
        <button onClick={saveFlow} className="save-button">Save</button>
      </header>
      <div className="editor-container">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default App;
