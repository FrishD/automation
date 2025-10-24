import React, { useState, useEffect, useRef } from 'react';
import SoundVisualization from './SoundVisualization';

const Simulator = ({ isOpen, onClose, currentFlowId, onNodeHighlight }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [subtitle, setSubtitle] = useState('');
  const ws = useRef(null);

  useEffect(() => {
    if (isOpen && currentFlowId) {
      const socket = new WebSocket('ws://localhost:5000');
      ws.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected');
        socket.send(JSON.stringify({ type: 'start_simulation', flowId: currentFlowId }));
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'node_active') {
          onNodeHighlight(message.nodeId);
        }

        if (message.type === 'status_update') {
          setStatus(message.status);
          setSubtitle(message.subtitle || '');
        }

        if (message.type === 'speak_start') {
          setIsAnimating(true);
        } else if (message.type === 'speak_end') {
          setIsAnimating(false);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        onNodeHighlight(null);
        setStatus('Finished');
        setSubtitle('');
        setIsAnimating(false);
      };

      // Cleanup function
      return () => {
        if (ws.current) {
          ws.current.close();
        }
        onNodeHighlight(null);
        setStatus('Idle');
        setSubtitle('');
        setIsAnimating(false);
      };
    }
  }, [isOpen, currentFlowId, onNodeHighlight]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 h-full w-96 bg-white dark:bg-slate-800 border-r border-border-light dark:border-border-dark z-40 shadow-lg p-6 flex flex-col transition-transform duration-300 ease-in-out"
         style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-on-surface-light dark:text-on-surface-dark">Simulator</h2>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center text-center">
        <SoundVisualization isAnimating={isAnimating} />
        <div className="mt-6 h-16">
          <p className="text-lg font-medium text-on-surface-light dark:text-on-surface-dark capitalize">{status}</p>
          {subtitle && <p className="text-md text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export default Simulator;
