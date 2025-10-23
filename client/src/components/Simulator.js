import React, { useState, useEffect, useRef } from 'react';
import SoundVisualization from './SoundVisualization';

const Simulator = ({ isOpen, onClose, currentFlowId, onNodeHighlight }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('Idle');
  const ws = useRef(null);

  useEffect(() => {
    if (isOpen && currentFlowId) {
      setLogs([]);
      const socket = new WebSocket('ws://localhost:5000');
      ws.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected');
        socket.send(JSON.stringify({ type: 'start_simulation', flowId: currentFlowId }));
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setLogs((prevLogs) => [...prevLogs, message]);

        if (message.type === 'node_active') {
          onNodeHighlight(message.nodeId);
          setStatus(`Executing: ${message.nodeType}`);
        }

        if (message.type === 'speak_start') {
          setIsAnimating(true);
          setStatus('Agent Speaking');
        } else if (message.type === 'speak_end') {
          setIsAnimating(false);
          setStatus('Waiting for user input');
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        onNodeHighlight(null);
        setStatus('Finished');
      };

      return () => {
        socket.close();
      };
    }
  }, [isOpen, currentFlowId, onNodeHighlight]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 h-full w-96 bg-white dark:bg-slate-800 border-r border-border-light dark:border-border-dark z-40 shadow-lg p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-on-surface-light dark:text-on-surface-dark">Simulator</h2>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center">
        <SoundVisualization isAnimating={isAnimating} />
        <div className="mt-6 text-center">
            <p className="text-lg font-medium text-on-surface-light dark:text-on-surface-dark">{status}</p>
        </div>
      </div>
      <div className="h-48 bg-slate-100 dark:bg-slate-900 rounded-lg p-4 overflow-y-auto">
        {logs.map((log, index) => (
          <p key={index} className="text-sm text-slate-500 dark:text-slate-400 font-mono">
            {log.timestamp}: {log.message}
          </p>
        ))}
      </div>
    </div>
  );
};

export default Simulator;
