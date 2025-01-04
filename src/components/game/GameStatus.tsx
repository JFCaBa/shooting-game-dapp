import React, { useEffect, useState } from 'react';
import { DroneData } from '../../types/drone';

interface GameStatusProps {
  droneCount: number;
  hits: number;
  kills: number;
  isOnline: boolean;
  isWebSocketConnected: boolean;
}

const GameStatus: React.FC<GameStatusProps> = ({
  droneCount,
  hits,
  kills,
  isOnline,
  isWebSocketConnected,
}) => {
  // Network status indicator
  const getConnectionColor = (isConnected: boolean) => {
    return isConnected ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 text-white">
      {/* Left section - Drone count */}
      <div className="flex items-center space-x-2">
        <svg
          className="w-6 h-6 text-gray-400"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.7L17.5 8 12 11.3 6.5 8 12 4.7zM6 9.7l5 3v6.6l-5-3V9.7zm7 9.6v-6.6l5-3v6.6l-5 3z" />
        </svg>
        <span className="text-2xl font-bold">{droneCount}</span>
      </div>

      {/* Center section - Hits and Kills */}
      <div className="flex space-x-16">
        <div className="text-center px-4">
          <div className="text-green-500">HITS</div>
          <div className="text-2xl font-bold text-green-500">{hits}</div>
        </div>
        <div className="text-center px-4">
          <div className="text-red-500">KILLS</div>
          <div className="text-2xl font-bold text-red-500">{kills}</div>
        </div>
      </div>

      {/* Right section - Connection status */}
      <div className="flex space-x-2">
        {/* Internet connection */}
        <svg
          className={`w-6 h-6 ${getConnectionColor(isOnline)}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
        </svg>

        {/* WebSocket connection */}
        <svg
          className={`w-6 h-6 ${getConnectionColor(isWebSocketConnected)}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>
    </div>
  );
};

export default GameStatus;
