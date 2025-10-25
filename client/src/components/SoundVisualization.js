import React, { useState } from 'react';
import AudioSpectrum from 'react-audio-spectrum';
import './SoundVisualization.css';

const SoundVisualization = ({ isAnimating, audioData, isPulsing }) => {
  const [spectrumId] = useState(`spectrum-${Math.random()}`);

  return (
    <div className="visualization-container">
      <div className={`circle ${isPulsing ? 'pulsing' : ''}`} />
      {isAnimating && (
        <AudioSpectrum
          id={spectrumId}
          height={100}
          width={300}
          audioData={audioData}
          capColor={'transparent'}
          meterColor={[
            { stop: 0, color: '#4f46e5' }, // indigo-600
            { stop: 0.5, color: '#6366f1' }, // indigo-500
            { stop: 1, color: '#818cf8' }, // indigo-400
          ]}
          gap={4}
        />
      )}
    </div>
  );
};

export default SoundVisualization;
