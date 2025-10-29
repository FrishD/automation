
import React from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

const NoteNode = ({ data, selected }) => {
    const { color = 'bg-yellow-200', text = 'My Note' } = data;

    const onChange = (e) => {
        if (data.onChange) {
            data.onChange({ ...data, text: e.target.value });
        }
    };

    const onColorChange = (newColor) => {
        if (data.onChange) {
            data.onChange({ ...data, color: newColor });
        }
    };

    // Tailwind CSS color classes for the color picker
    const colorOptions = [
        'bg-yellow-200', 'bg-blue-200', 'bg-green-200', 'bg-pink-200', 'bg-purple-200', 'bg-gray-200'
    ];

    return (
        <div className={`w-full h-full rounded-lg shadow-md border border-gray-300 flex flex-col ${color}`}>
            <NodeResizer isVisible={selected} minWidth={150} minHeight={100} handleClassName="w-3 h-3 bg-white border-2 border-primary rounded-full" />
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-accent" />

            <div className="p-2 bg-black bg-opacity-10 rounded-t-lg flex items-center justify-between">
                <span className="font-bold text-xs text-gray-700">NOTE</span>
                {selected && (
                    <div className="flex space-x-1.5 nodrag">
                        {colorOptions.map(colorClass => (
                            <button
                                key={colorClass}
                                onClick={() => onColorChange(colorClass)}
                                className={`w-4 h-4 rounded-full cursor-pointer border-2 ${data.color === colorClass ? 'border-primary' : 'border-transparent'}`}
                                style={{ backgroundColor: colorClass.replace('bg-', '').split('-')[0] === 'gray' ? '#E5E7EB' : `#${colorClass.split('-')[1]}0` }} // Simplified for display
                            >
                              <div className={`${colorClass} w-full h-full rounded-full`}></div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <textarea
                value={text}
                onChange={onChange}
                className="w-full h-full p-2 bg-transparent border-none outline-none resize-none text-sm text-gray-800 nodrag"
                placeholder="Type your note here..."
            />

            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-accent" />
        </div>
    );
};

export default NoteNode;
