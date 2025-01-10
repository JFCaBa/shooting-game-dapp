// src/types/wallet.ts

export interface TokenBalance {
  totalBalance: number; // Total balance of tokens
  mintedBalance: number; // Transferable/minted balance
}

export interface WalletConnection {
  address: string;
  isConnected: boolean;
  publicKey?: string;
}
