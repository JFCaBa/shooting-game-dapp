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
    <div className="absolute inset-0 flex flex-col bg-game-dark">
      {/* Scrollable container with padding bottom for navigation */}
      <div className="flex-1 overflow-y-auto pb-[170px]">
        <div className="p-4">
          {/* Header */}
          <div className="flex mb-6">
            <h1 className="text-2xl font-semibold text-white flex-1">
              Settings
            </h1>
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
                <h2 className="text-lg font-medium mb-1 text-white">
                  {isAuthenticated ? 'User Profile' : 'Create user'}
                </h2>
              </div>
              <ChevronRight className="text-gray-400" />
            </button>

            {!isAuthenticated && (
              <p className="text-gray-400 text-sm mt-2 px-1">
                Create a user for extra add-ons and better experience in the
                game.
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
                <span className="text-lg font-medium text-white">Sign out</span>
                <ChevronRight className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
