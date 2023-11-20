interface Window {
  mina?: MinaWallet;
}

interface SendTransactionArgs {
  transaction: any;
  feePayer?: {
    fee?: number;
    memo?: string;
  };
}
interface SignMessageArgs {
  message: string;
}

interface SignedData {
  publicKey: string;
  data: string;
  signature: {
    field: string;
    scalar: string;
  };
}

interface VerifyMessageArgs {
  publicKey: string;
  payload: string;
  signature: {
    field: string;
    scalar: string;
  };
}
type ChainInfoArgs = {
  chainId: 'mainnet' | 'devnet' | 'berkeley' | 'testworld2';
  name: string;
};

interface MinaWallet {
  requestAccounts(): Promise<string[]>;
  requestNetwork(): Promise<
    'Mainnet' | 'Devnet' | 'Berkeley' | 'Unknown' | ChainInfoArgs
  >;
  getAccounts(): Promise<string[]>;

  sendTransaction(args: SendTransactionArgs): Promise<{ hash: string }>;
  signMessage(args: SignMessageArgs): Promise<SignedData>;
  verifyMessage(args: VerifyMessageArgs): Promise<boolean>;
}
