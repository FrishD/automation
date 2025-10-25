import React from 'react';
import './SoundVisualization.css';
import cx from 'classnames';

const SoundVisualization = ({ status }) => {
  const isSpeaking = status === 'speaking';
  const isListening = status === 'listening';

  const containerClasses = cx('visualization-container', {
    'speaking': isSpeaking,
    'listening': isListening,
  });

  return (
    <div className={containerClasses}>
      <div className="central-circle"></div>
      {isSpeaking && (
        <div className="ripple-container">
          <div className="ripple-circle"></div>
          <div className="ripple-circle"></div>
          <div className="ripple-circle"></div>
        </div>
      )}
    </div>
  );
};

export default SoundVisualization;
