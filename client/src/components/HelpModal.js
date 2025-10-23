import React from 'react';

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-1/2 max-w-2xl flex flex-col p-4">
        <div className="flex justify-between items-center border-b pb-2 mb-2">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Help</h2>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          <h3 className="text-md font-semibold mt-4">Node Types</h3>
          <ul className="list-disc list-inside mt-2">
            <li><b>Start:</b> The entry point of your conversation.</li>
            <li><b>Speak:</b> Makes the agent say something.</li>
            <li><b>Listen:</b> Listens for the user's response.</li>
            <li><b>Condition:</b> Branches the conversation based on keywords.</li>
            <li><b>End:</b> Ends the conversation.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
