import { PublicKey, PrivateKey, Field, Mina, AccountUpdate, SmartContract } from 'o1js';
import { AuthEntity } from './model';
import { fetchAccount, FetchedAccount } from '../../utils/fetchAccount';

const { default: Signer } = await import('mina-signer');

const deployTransactionFee = 100_000_000;
const endpointUrl = process.env.VUE_APP_MINA_NETWORK ?? 'https://proxy.berkeley.minaexplorer.com/graphql';
const Berkeley = Mina.Network(endpointUrl);
Mina.setActiveInstance(Berkeley);

export async function tryGetAccount({
  account,
  isZkAppAccount,
}: {
  account: PublicKey;
  isZkAppAccount: boolean;
}): Promise<FetchedAccount | undefined> {
  let response = await fetchAccount({ publicKey: account.toBase58() }, endpointUrl);
  let accountExists = response.account !== undefined;
  if (isZkAppAccount) {
    accountExists = response.account?.zkappState !== undefined;
  }
  return accountExists ? response.account : undefined;
}

export async function getContractTx(
  sender: PublicKey,
  zkAppPrivateKey: PrivateKey,
  zkapp: SmartContract,
  verificationKey: { data: string; hash: string | Field },
  txInclude?: (zkapp: SmartContract) => void
): Promise<{ success: boolean; tx?: string; error?: string }> {
  const zkAppPublicKey = zkAppPrivateKey.toPublicKey();

  console.log('using zkApp private key with public key', zkAppPublicKey.toBase58());

  let { account } = await fetchAccount({ publicKey: zkAppPublicKey.toBase58() }, endpointUrl);
  let isDeployed = account?.verificationKey !== undefined;

  if (isDeployed) {
    console.log('zkApp for public key', zkAppPublicKey.toBase58(), 'found deployed');
    return { success: false, error: 'already deployed.' };
  }
  console.log('Deploying zkapp for public key', zkAppPublicKey.toBase58());
  Mina.setActiveInstance(Berkeley);
  let transaction = await Mina.transaction({ sender, fee: deployTransactionFee }, () => {
    AccountUpdate.fundNewAccount(sender);
    // NOTE: this calls `init()` if this is the first deploy
    zkapp.deploy({ verificationKey, zkappKey: zkAppPrivateKey });
    txInclude?.(zkapp);
  });
  console.log('Proving transaction...');
  await transaction.prove();

  console.log('Signing transaction...');
  transaction.sign([zkAppPrivateKey]);
  const tx = transaction.toJSON();
  return { success: true, tx };
}

const timestampPrefix = 'Timestamp: ';
const secondsThreshold = 60;
export function authenticate(
  auth: AuthEntity,
  verifyTimestamp = true
): {
  success: boolean;
  error?: string;
} {
  const publicKey = auth.publicKey;
  const signature = auth.signature;
  const verifyMessage = auth.message;
  const signer = new Signer({ network: 'testnet' });

  // console.log(verifyTimestamp, verifyMessage);
  if (verifyTimestamp) {
    const lines = verifyMessage.split('\n');
    let timestampVerified = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith(timestampPrefix)) {
        const timestamp = Number(line.slice(timestampPrefix.length));
        const offset = Date.now() - timestamp;
        if (isNaN(offset)) return { success: false, error: 'wrong timestamp format' };

        if (offset < 0) return { success: false, error: 'time from future' };

        if (offset > secondsThreshold * 1000) return { success: false, error: 'signature expired' };

        timestampVerified = true;
        break;
      }
    }

    if (!timestampVerified) return { success: false, error: 'timestamp not found' };
  }

  let verifyResult;
  try {
    const nextSignature = typeof signature === 'string' ? JSON.parse(signature) : signature;
    const verifyBody = {
      data: verifyMessage,
      publicKey: publicKey,
      signature: nextSignature,
    };
    verifyResult = { success: signer.verifyMessage(verifyBody) };
  } catch (error) {
    verifyResult = { success: false, error: 'verify failed' };
  }

  return verifyResult;
}

export function num2Arr(number: bigint, length = 32): Uint8Array {
  let pos = 0;
  const arr = new Uint8Array(length);
  while (number > 0) {
    arr[pos++] = Number(number & 255n);
    number >>= 8n;
  }
  return arr;
}
