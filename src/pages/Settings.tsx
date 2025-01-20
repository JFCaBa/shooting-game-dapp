import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import CameraSettings from '../components/settings/CameraSettings';

interface SettingsProps {
  onSignOut: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onSignOut }) => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <div className="min-h-screen bg-game-dark text-white p-4 flex flex-col">
      {/* Header */}
      <div className="flex mb-6">
        <h1 className="text-2xl font-semibold flex-1">Settings</h1>
      </div>
      {/* Settings Options */}
      <div className="space-y-6">
        {/* User Section */}
        <button
          onClick={() =>
            navigate(isAuthenticated ? '/profile' : '/create-user')
          }
          className="w-full bg-gray-800 rounded-lg p-4 flex items-center justify-between"
        >
          <div>
            <h2 className="text-lg font-medium mb-1">
              {isAuthenticated ? 'User Profile' : 'Create user'}
            </h2>
          </div>
          <ChevronRight className="text-gray-400" />
        </button>
        {!isAuthenticated && (
          <p className="text-gray-400 text-sm mt-2 px-1">
            Create a user for extra add-ons and better experience in the game.
          </p>
        )}

        {/* Camera Settings */}
        <div className="bg-gray-800 rounded-lg p-4">
          <CameraSettings />
        </div>

        {/* Show Sign Out only when authenticated */}
        {isAuthenticated && (
          <button
            onClick={onSignOut}
            className="w-full bg-gray-800 rounded-lg p-4 flex items-center justify-between"
          >
            <span className="text-lg font-medium">Sign out</span>
            <ChevronRight className="text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Settings;
