export {};

declare global {
  interface Window {
    aptos?: {
      connect: () => Promise<{ address: string; publicKey: string }>;
      disconnect: () => Promise<void>;
      isConnected: () => Promise<boolean>;
      account: () => Promise<{ address: string; publicKey: string }>;
      signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>;
      signMessage: (message: { message: string; nonce: string }) => Promise<{
        signature: string;
        fullMessage: string;
      }>;
      network: () => Promise<{
        name: string;
        chainId: string;
        url: string;
      }>;
      getAccountResources: (address: string) => Promise<
        Array<{
          type: string;
          data: {
            coin?: {
              value: string;
            };
            [key: string]: any;
          };
        }>
      >;
    };
  }
}
