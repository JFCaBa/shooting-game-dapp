import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Settings = ({ onSignOut }) => {
  const navigate = useNavigate();

  const handleCreateUser = () => {
    navigate('/create-user');
  };

  return (
    <div className="min-h-screen bg-game-dark text-white p-4 flex flex-col">
      {/* Header */}
      <div className="flex mb-6">
        <h1 className="text-2xl font-semibold flex-1">Settings</h1>
      </div>

      {/* Settings Options */}
      <div className="space-y-6">
        {/* Create User Section */}
        <div>
          <button
            onClick={handleCreateUser}
            className="w-full bg-gray-800 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <h2 className="text-lg font-medium mb-1">Create user</h2>
              <p className="text-gray-400 text-sm">
                You will be able to create a user with a username and password
              </p>
            </div>
            <ChevronRight className="text-gray-400" />
          </button>
          <p className="text-gray-400 text-sm mt-2 px-1">
            Create a user for extra add-ons and better experience in the game.
          </p>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={onSignOut}
          className="w-full bg-gray-800 rounded-lg p-4 flex items-center justify-between"
        >
          <span className="text-lg font-medium">Sign out</span>
          <ChevronRight className="text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default Settings;
