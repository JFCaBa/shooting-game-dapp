// src/pages/Wallet.tsx
import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../constants/endpoints';

interface TokenBalance {
  totalBalance: number;
  mintedBalance: number;
}

const Wallet = () => {
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      try {
        const playerId = localStorage.getItem('playerId');
        const token = localStorage.getItem('token');

        if (!playerId || !token) {
          setError('Authentication required');
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `${API_ENDPOINTS.PLAYER_TOKENS(playerId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch token balance');
        }

        const data = await response.json();
        setTokenBalance({
          totalBalance: data.totalBalance,
          mintedBalance: data.mintedBalance,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load balance');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenBalance();
  }, []);

  const handleConnectWallet = () => {
    // Wallet connection logic will be implemented here
    console.log('Connect wallet clicked');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-game-dark text-white p-4 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-game-dark">
      {/* Scrollable container with padding bottom for navigation */}
      <div className="flex-1 overflow-y-auto pb-[170px]">
        <div className="p-4">
          {/* Header */}
          <h1 className="text-2xl font-bold text-white mb-6">Wallet</h1>

          {/* Connect Wallet Button */}
          <button
            onClick={handleConnectWallet}
            className="w-full bg-[#FF5B37] hover:bg-[#FF4120] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 mb-8"
          >
            Connect Petra Wallet
          </button>

          {/* Balance Cards */}
          <div className="space-y-4">
            {/* Total Balance Card */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-gray-400 text-sm mb-2">Total Balance</h2>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">
                  {tokenBalance?.totalBalance ?? 0}
                </span>
                <span className="ml-2 text-gray-400">SHOT</span>
              </div>
            </div>

            {/* Transferable Balance Card */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-gray-400 text-sm mb-2">
                Transferable Balance
              </h2>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">
                  {tokenBalance?.mintedBalance ?? 0}
                </span>
                <span className="ml-2 text-gray-400">SHOT</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-center mt-4 p-4 bg-red-500 bg-opacity-10 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
