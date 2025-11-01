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
      <div className="space-y-6">
        {/* Google Calendar Integration Section */}
        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Google Calendar Integration</h3>

          {isLoggedIn ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <p className="text-slate-600 dark:text-slate-400">Status: <span className="font-medium text-green-600 dark:text-green-400">Connected</span></p>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <p className="text-slate-600 dark:text-slate-400">Status: <span className="font-medium text-red-600 dark:text-red-400">Disconnected</span></p>
              </div>
              <button
                onClick={handleConnectGoogle}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Connect with Google
              </button>
            </div>
          )}
        </div>

        {/* Add other settings sections here in the future */}
      </div>
    </Modal>
  );
};

export default SettingsModal;
