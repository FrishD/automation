import React from 'react';
import './SoundVisualization.css';

const SoundVisualization = ({ isAnimating }) => {
  return (
    <div className="visualization-container">
      <div className={`sound-wave ${isAnimating ? 'animating' : ''}`}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>
    </div>
  );
};

export default SoundVisualization;
