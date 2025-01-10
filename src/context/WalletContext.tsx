// src/context/WalletContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletConnection } from '../types/wallet';
import { AptosService } from '../services/AptosService';

interface WalletContextType {
  wallet: WalletConnection | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  aptBalance: string;
  getBalance: (address: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [aptBalance, setAptBalance] = useState<string>('0');
  const aptosService = AptosService.getInstance();

  // Check if Petra is available
  const isPetraAvailable = () => {
    return typeof window !== 'undefined' && window.aptos !== undefined;
  };

  const getBalance = async (address: string): Promise<string> => {
    try {
      const balance = await aptosService.getBalance(address);
      setAptBalance(balance);
      return balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  };

  const connect = async () => {
    if (!isPetraAvailable()) {
      throw new Error('Petra wallet is not installed');
    }

    try {
      setIsConnecting(true);
      const response = await window.aptos.connect();
      const account = await window.aptos.account();

      setWallet({
        address: account.address,
        isConnected: true,
        publicKey: account.publicKey,
      });

      // Fetch initial balance
      if (account.address) {
        await getBalance(account.address);
      }
    } catch (error) {
      console.error('Failed to connect to Petra:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await window.aptos.disconnect();
      setWallet(null);
      setAptBalance('0');
    } catch (error) {
      console.error('Failed to disconnect from Petra:', error);
      throw error;
    }
  };

  // Check initial connection status
  useEffect(() => {
    const checkConnection = async () => {
      if (isPetraAvailable()) {
        try {
          const isConnected = await window.aptos.isConnected();
          if (isConnected) {
            const account = await window.aptos.account();
            setWallet({
              address: account.address,
              isConnected: true,
              publicKey: account.publicKey,
            });
            await getBalance(account.address);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connect,
        disconnect,
        isConnecting,
        aptBalance,
        getBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
