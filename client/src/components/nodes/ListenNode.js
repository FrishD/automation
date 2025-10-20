import React from 'react';
import { Handle, Position } from 'reactflow';

const ListenNode = ({ data }) => {
  return (
    <div className="react-flow__node-listen">
        <Handle type="target" position={Position.Top} />
        <div className="node-header">
            <span className="icon">👂</span>
            <span>Listen for Input</span>
        </div>
        <div className="node-body">
            Waits for the user to speak. Connect conditions to the output handles.
        </div>
        <Handle type="source" position={Position.Bottom} id="a" />
    </div>
  );
};

export default ListenNode;
