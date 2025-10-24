import React from 'react';
import './SoundVisualization.css';

const SoundVisualization = ({ isAnimating }) => {
  return (
    <div className={`sound-visualization ${isAnimating ? 'animating' : ''}`}>
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="bar" style={{ '--i': i }} />
      ))}
    </div>
  );
};

export default SoundVisualization;
