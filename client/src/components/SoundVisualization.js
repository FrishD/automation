import React from 'react';
import './SoundVisualization.css';

const SoundVisualization = ({ isAnimating }) => {
  return (
    <div className="sound-visualization">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className={`bar ${isAnimating ? 'animating' : ''}`} style={{ '--i': i }} />
      ))}
    </div>
  );
};

export default SoundVisualization;
