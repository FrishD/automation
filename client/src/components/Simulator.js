import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SoundVisualization from './SoundVisualization';
import Typewriter from './Typewriter';

const Simulator = ({ isOpen, onClose, currentFlowId, onNodeHighlight }) => {
  const [subtitle, setSubtitle] = useState('');
  const [subtitleDuration, setSubtitleDuration] = useState(0);
  const [status, setStatus] = useState('Idle');
  const ws = useRef(null);

  const playBloopSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error("Failed to play bloop sound:", error);
    }
  };

  useEffect(() => {
    if (isOpen && currentFlowId) {
      playBloopSound();
      setStatus('Initializing...');

      const socket = new WebSocket('ws://localhost:5000');
      ws.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected');
        socket.send(JSON.stringify({ type: 'start_simulation', flowId: currentFlowId }));
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Received message:", message);

        switch (message.type) {
          case 'status_update':
            setStatus(message.status);
            break;
          case 'active_node':
            onNodeHighlight(message.nodeId);
            setStatus(`Running: ${message.nodeType || 'node'}`);
            break;
          case 'speak_start':
            setStatus('Agent Speaking');
            setSubtitle(message.text || '');
            setSubtitleDuration(message.duration || 0);
            break;
          case 'speak_end':
            setStatus('Waiting for user input');
            setSubtitle('');
            setSubtitleDuration(0);
            break;
          default:
            break;
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        onNodeHighlight(null);
        if (status !== 'Finished') {
            setStatus('Finished');
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus('Error');
      };

      return () => {
        if (ws.current) {
            ws.current.close();
        }
      };
    } else {
        setStatus('Idle');
        setSubtitle('');
        setSubtitleDuration(0);
        onNodeHighlight(null);
    }
  }, [isOpen, currentFlowId]);

  const getAnimationStatus = () => {
    if (status === 'Agent Speaking') return 'speaking';
    if (status === 'listening') return 'listening';
    return 'idle';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute top-0 left-0 h-full w-96 bg-white dark:bg-slate-800 border-r border-border-light dark:border-border-dark z-40 shadow-lg p-6 flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-on-surface-light dark:text-on-surface-dark">Simulator</h2>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <div className="flex-grow flex flex-col items-center justify-center">
            <SoundVisualization status={getAnimationStatus()} />
            <div className="mt-6 text-center h-24">
              <AnimatePresence mode="wait">
                <motion.p
                  key={status}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg font-medium text-on-surface-light dark:text-on-surface-dark capitalize"
                >
                  {status.replace(/_/g, ' ')}
                </motion.p>
              </AnimatePresence>
              <div className="text-center mt-4 h-16">
                {subtitle && <Typewriter text={subtitle} duration={subtitleDuration} />}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Simulator;
