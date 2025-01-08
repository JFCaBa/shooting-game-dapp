import React from 'react';
import { useLocationContext } from '../../context/LocationContext';

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
  const { location } = useLocationContext();

  // Network status indicator
  const getConnectionColor = (isConnected: boolean) => {
    return isConnected ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 text-white">
      {/* Left section - Drone count */}
      <div className="flex flex-col items-center space-y-1">
        <svg
          className="w-6 h-6"
          viewBox="0 0 800.00146 344.15598"
          fill="currentColor"
        >
          <g transform="matrix(1.3333333,0,0,1.3333333,7.2931382e-4,0)">
            <g>
              <path
                d="M 117.18,0 C 107.941,0.027 99.602,5.555 95.984,14.059 40.238,17.242 -0.172,22.602 0,26.789 c 0.164,4.16 40.273,5.984 95.57,4.344 1.918,5.172 5.614,9.48 10.426,12.164 H 97.02 V 59.746 H 86.039 c -2.898,0 -5.25,2.348 -5.25,5.246 v 11.723 c 0,2.898 2.348,5.246 5.246,5.246 h 73.895 c 18.617,4.379 20.699,11.059 34.644,23.277 -2.281,12.68 -5.64,26.524 -8.269,38.485 v 101.839 c 0,6.934 5.621,12.555 12.558,12.555 6.934,0 12.555,-5.621 12.555,-12.555 V 196.32 c -0.289,-41.398 6.394,-58.14 29.43,-90.187 l 5.789,-2.688 c 0,24.875 17.195,26.371 41.449,31.922 h -18.219 c -5.543,0 -10.043,4.5 -10.043,10.047 v 60 c 0,5.547 4.5,10.047 10.043,10.047 h 60.266 c 5.543,0 10.043,-4.5 10.043,-10.047 v -60 c 0,-5.547 -4.5,-10.043 -10.043,-10.043 h -18.199 c 24.246,-5.566 41.429,-7.055 41.429,-31.926 l 5.793,2.688 c 29.141,30.156 29.43,50.683 29.43,90.179 v 49.243 c 0,6.933 5.621,12.554 12.555,12.554 6.933,0 12.554,-5.621 12.554,-12.554 V 143.723 c -3.078,-13.145 -6.371,-26.922 -9.48,-40.571 13.195,-12.929 18.605,-15.84 35.734,-21.191 h 74.016 c 2.898,0 5.246,-2.348 5.246,-5.246 V 64.992 c 0,-2.894 -2.348,-5.246 -5.246,-5.246 H 502.98 V 43.297 h -8.976 c 4.816,-2.684 8.516,-6.996 10.43,-12.164 55.296,1.64 95.406,-0.184 95.566,-4.344 0.176,-4.187 -40.234,-9.539 -95.98,-12.73 -3.489,-8.188 -11.368,-13.645 -20.258,-14.032 -8.891,-0.386 -17.215,4.368 -21.403,12.219 -55.839,-1.699 -96.617,0.109 -96.851,4.297 -0.172,4.156 39.691,9.48 94.961,12.672 1.64,5.984 5.617,11.058 11.035,14.082 h -8.977 V 59.746 C 405.926,59.617 362.113,31.172 300,30 239.984,31.273 189.719,59.746 137.473,59.746 V 43.297 h -8.977 c 5.418,-3.024 9.395,-8.098 11.035,-14.082 55.27,-3.192 95.137,-8.52 94.961,-12.672 -0.234,-4.188 -41.008,-6 -96.851,-4.297 C 133.613,4.691 125.742,-0.02 117.18,0.008 Z M 300,150.078 c 14.082,0 25.656,11.574 25.656,25.656 0,14.082 -11.574,25.661 -25.656,25.661 -14.082,0 -25.668,-11.579 -25.668,-25.661 0,-14.082 11.582,-25.656 25.668,-25.656 z m 0,15.059 c -5.938,0 -10.602,4.656 -10.602,10.597 0,5.942 4.664,10.594 10.602,10.594 5.941,0 10.59,-4.652 10.59,-10.594 0,-5.941 -4.649,-10.597 -10.59,-10.597 z"
                style={{ fill: droneCount > 0 ? 'red' : 'gray' }}
              />
            </g>
          </g>
        </svg>
        <span
          className={`text-2xl font-bold ${
            droneCount > 0 ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          {droneCount}
        </span>
      </div>

      {/* Center section - Hits and Kills */}
      <div className="flex space-x-4">
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

        {/* Location status */}
        <svg
          className={`w-6 h-6 ${getConnectionColor(!!location)}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      </div>
    </div>
  );
};

export default GameStatus;
