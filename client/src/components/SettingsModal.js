import React from 'react';
import Modal from './Modal';

const SettingsModal = ({ isOpen, onClose, isLoggedIn, onLogout }) => {

  const handleConnectGoogle = () => {
    // Redirect the user to the backend authentication route
    window.location.href = 'http://localhost:5000/api/google-calendar/auth/google';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      className="settings-modal"
    >
      <div className="google-calendar-section">
        <h3 className="section-title">Google Calendar Integration</h3>
        {isLoggedIn ? (
          <div>
            <p className="status-indicator">
              Status: <span style={{color: 'green'}}>Connected</span>
            </p>
            <button onClick={onLogout} className="logout-button">
              Disconnect Google Account
            </button>
          </div>
        ) : (
          <div>
            <p className="status-indicator">
              Status: <span style={{color: 'red'}}>Disconnected</span>
            </p>
            <button onClick={handleConnectGoogle} className="connect-button">
              Connect with Google
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SettingsModal;
