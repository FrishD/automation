import React from 'react';
import './SoundVisualization.css';

const SoundVisualization = ({ isAnimating }) => {
  return (
    <div className="visualization-container">
      <div className={`circle ${isAnimating ? 'animating' : ''}`} />
      {isAnimating && (
        <div className="waves">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="wave" style={{ '--i': i }} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SoundVisualization;
