import React from 'react';
import { Handle, Position } from 'reactflow';

const EndNode = ({ data }) => {
  return (
    <div className="react-flow__node-end">
        <Handle type="target" position={Position.Top} />
        <div className="node-header">
            <span className="icon">🏁</span>
            <span>End Conversation</span>
        </div>
        <div className="node-body">
            This marks the end of a conversation path.
        </div>
    </div>
  );
};

export default EndNode;
