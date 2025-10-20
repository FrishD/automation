import React from 'react';
import { Handle, Position } from 'reactflow';

const SpeakNode = ({ data, id }) => {

    const onTextChange = (evt) => {
        data.text = evt.target.value;
    }

  return (
    <div className="react-flow__node-speak">
        <Handle type="target" position={Position.Top} />
        <div className="node-header">
            <span className="icon">🗣️</span>
            <span>Speak</span>
        </div>
        <div className="node-body">
            <textarea
                defaultValue={data.text || 'Hello, how can I help?'}
                onChange={onTextChange}
                rows={3}
            />
        </div>
        <Handle type="source" position={Position.Bottom} id="a" />
    </div>
  );
};

export default SpeakNode;
