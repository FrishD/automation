import React, { useState, useEffect, useRef } from 'react';
import CircularWaveform from './CircularWaveform';

const Simulator = ({ isOpen, onClose, currentFlowId, onNodeHighlight }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('Idle');
  const [subtitle, setSubtitle] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const ws = useRef(null);
  const audioContext = useRef(null);

  useEffect(() => {
    // Initialize AudioContext on the first component mount
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  const playBloop = () => {
    if (!audioContext.current) return;
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300, audioContext.current.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.current.currentTime);

    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.current.currentTime + 0.3);
    oscillator.start();
    oscillator.stop(audioContext.current.currentTime + 0.3);
  };

  useEffect(() => {
    if (isOpen) {
      setIsOpening(true);
      playBloop();
    } else {
      setIsOpening(false);
    }
  }, [isOpen]);

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

        if (message.type === 'status_update') {
          setStatus(message.status);
          setSubtitle(message.subtitle || '');
        }

        if (message.type === 'node_active') {
          onNodeHighlight(message.nodeId);
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
      };

      return () => {
        socket.close();
      };
    }
  }, [isOpen, currentFlowId, onNodeHighlight]);

  const panelClasses = `absolute top-0 left-0 h-full w-96 bg-white dark:bg-slate-800 border-r border-border-light dark:border-border-dark z-40 shadow-lg p-6 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;

  return (
    <div className={panelClasses}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-on-surface-light dark:text-on-surface-dark">Simulator</h2>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center relative">
        <div
          className={`absolute w-48 h-48 bg-slate-100 dark:bg-slate-700 rounded-full transition-transform duration-500 ease-in-out ${isOpening ? 'scale-100' : 'scale-0'}`}
          style={{ transitionDelay: isOpening ? '100ms' : '0ms' }}
        />
        <div className="absolute">
            <CircularWaveform isAnimating={isAnimating} />
        </div>
        <div className="mt-6 text-center h-16">
            <p className="text-lg font-medium text-on-surface-light dark:text-on-surface-dark capitalize">{status}</p>
            {subtitle && <p className="text-md text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
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
