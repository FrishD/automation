import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data }) => {
  const onLabelChange = (e) => {
    // onLabelChange is passed in the data object from the main App component
    if (data.onLabelChange) {
      data.onLabelChange(e.currentTarget.textContent);
    }
  };

  return (
    <div className="react-flow__node-default">
      <Handle type="target" position={Position.Top} />
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={onLabelChange} // Use onBlur to avoid excessive re-renders on every keystroke
        style={{ padding: 10, minWidth: 100, minHeight: 30 }}
        // Set the initial text from data.label
        dangerouslySetInnerHTML={{ __html: data.label }}
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default memo(CustomNode);
