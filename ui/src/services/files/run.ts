import 'dotenv/config';
import { fetchAccount, Mina, PrivateKey, PublicKey } from 'snarkyjs';
import { CONTRACTNAME } from './contract.js';

const endpointUrl =
  process.env.ENDPOINT_URL ?? 'https://proxy.berkeley.minaexplorer.com/graphql';
const Berkeley = Mina.Network(endpointUrl);
Mina.setActiveInstance(Berkeley);

const deployTransactionFee = 100_000_000;

await (async function run() {
  if (!process.env.CONTRACT_ID) {
    console.log('set CONTRACT_ID in .env file first.');
    return;
  }

  if (!process.env.PRIVATE_KEY) {
    console.log('set PRIVATE_KEY in .env file first.');
    return;
  }

  const zkAppPublicKey = PublicKey.fromBase58(process.env.CONTRACT_ID);
  const deployerPrivateKey = PrivateKey.fromBase58(process.env.PRIVATE_KEY);
  const deployerPublicKey = deployerPrivateKey.toPublicKey();
  const zkapp = new CONTRACTNAME(zkAppPublicKey);

  console.log('Checking deployer account existence');
  const { account: deployerAccount } = await fetchAccount(
    { publicKey: deployerPublicKey },
    endpointUrl
  );
  if (deployerAccount === undefined) {
    const msg =
      'Deployer account does not exist. ' +
      'Request funds at faucet https://berkeley.minaexplorer.com/faucet or ' +
      'https://faucet.minaprotocol.com/?address=' +
      deployerPublicKey.toBase58();
    console.log(msg);
    return;
  }

  console.log('checking zkapp account existence');
  const { account: zkappAccount } = await fetchAccount(
    { publicKey: zkAppPublicKey },
    endpointUrl
  );
  const isDeployed = zkappAccount?.zkapp?.verificationKey !== undefined;

  if (!isDeployed) {
    console.log(
      'zkApp for public key',
      zkAppPublicKey.toBase58(),
      'is not found on chain. Please deploy first.'
    );
    return;
  }

  console.log('Compiling smart contract...');
  await CONTRACTNAME.compile();

  console.log('Creating transaction for zkapp', zkAppPublicKey.toBase58());
  const transaction = await Mina.transaction(
    { sender: deployerPublicKey, fee: deployTransactionFee },
    () => {
      // Modify your code here
      zkapp.play();
    }
  );

  console.log('Proving transaction...');
  await transaction.prove();

  console.log('Signing transaction...');
  transaction.sign([deployerPrivateKey]);

  console.log('Sending the transaction...');
  const res = await transaction.send();
  const hash = res.hash();
  if (hash === undefined) {
    console.log('error sending transaction (see above)');
    return;
  }

  console.log(
    'See transaction at',
    'https://berkeley.minaexplorer.com/transaction/' + hash
  );
})();
