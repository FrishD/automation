import React from 'react';
import { Handle, Position } from 'reactflow';

const StartNode = ({ data }) => {
  return (
    <div className="react-flow__node-start">
      <div className="node-header">
        <span className="icon">🚀</span>
        <span>Start</span>
      </div>
      <div className="node-body">
        This is the starting point of your conversation.
      </div>
      <Handle type="source" position={Position.Bottom} id="a" />
    </div>
  );
};

export default StartNode;
