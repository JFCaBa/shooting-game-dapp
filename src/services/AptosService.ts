import { Account, Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Instead of extending MoveResource, create our own interface
interface CoinStoreResource {
  type: string;
  data: {
    coin: {
      value: string;
    };
  };
}

export class AptosService {
  private static instance: AptosService;
  private aptos: Aptos;
  private account: Account | null = null;

  private constructor() {
    const config = new AptosConfig({ network: Network.TESTNET });
    this.aptos = new Aptos(config);
  }

  public static getInstance(): AptosService {
    if (!AptosService.instance) {
      AptosService.instance = new AptosService();
    }
    return AptosService.instance;
  }

  getAccount(): Account | null {
    return this.account;
  }

  async getBalance(address: string): Promise<string> {
    try {
      console.log('Fetching balance for address:', address);
      const resources = await this.aptos.account.getAccountResources({
        accountAddress: address,
      });

      // Use type assertion to unknown first, then to our interface
      const coinResource = resources.find(
        (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      ) as unknown as CoinStoreResource | undefined;

      const balance = coinResource?.data?.coin?.value || '0';
      const intBalance = parseInt(balance);
      const scaledBalance = intBalance / 1e8;
      return scaledBalance.toString();
    } catch (error: any) {
      console.error('Error in getBalance:', error);
      if (error.response?.data?.error_code === 'account_not_found') {
        return '0';
      }
      throw error;
    }
  }

  async transfer(to: string, amount: string): Promise<void> {
    if (!this.account) throw new Error('Account not initialized');

    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress.toString(),
        data: {
          function: '0x1::coin::transfer',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [to, amount],
        },
      });

      const senderAuthenticator = await this.aptos.transaction.sign({
        signer: this.account,
        transaction,
      });

      const committedTxn = await this.aptos.transaction.submit.simple({
        transaction,
        senderAuthenticator,
      });

      await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });
    } catch (error) {
      console.error('Error during transfer:', error);
      throw error;
    }
  }
}
