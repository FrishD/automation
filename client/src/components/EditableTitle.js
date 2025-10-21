import React, { useState } from 'react';

const EditableTitle = ({ value, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        onKeyDown={handleKeyDown}
        autoFocus
        className="nodrag text-sm font-medium text-on-surface-light dark:text-on-surface-dark bg-transparent text-center border-b-2 border-primary focus:outline-none"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="nodrag text-sm font-medium text-on-surface-light dark:text-on-surface-dark bg-transparent text-center cursor-pointer border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 p-1"
    >
      {value || 'Untitled Flow'}
    </div>
  );
};

export default EditableTitle;
