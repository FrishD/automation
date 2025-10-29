
import React from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

const NoteNode = ({ data, selected }) => {
    const { color = '#FFFF88', text = 'My Note' } = data;

    const onChange = (e) => {
        if (data.onChange) {
            data.onChange({ ...data, text: e.target.value });
        }
    };

    const onColorChange = (e) => {
        if (data.onChange) {
            data.onChange({ ...data, color: e.target.value });
        }
    };

    return (
        <div style={{ backgroundColor: color, border: '1px solid #333', borderRadius: '5px', padding: '10px' }} className="w-full h-full">
            <NodeResizer isVisible={selected} minWidth={100} minHeight={50} />
            <Handle type="target" position={Position.Top} />
            <textarea
                value={text}
                onChange={onChange}
                className="w-full h-full bg-transparent border-none outline-none resize-none"
                style={{ fontFamily: 'monospace' }}
            />
            {selected && (
                <div className="absolute top-full left-0 mt-2">
                    <input type="color" value={color} onChange={onColorChange} className="nodrag" />
                </div>
            )}
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default NoteNode;
