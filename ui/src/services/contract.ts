import './registerCoiServcieWorker';
import { useZkAppStore } from '../stores/zkAppStore';
import { PublicKey, Field, state } from 'snarkyjs';
import ZkappWorkerClient from '../services/zkappWorkerClient';
// import './services/registerCoiServcieWorker';

const store = useZkAppStore();
const transactionFee = 0.1;

export async function init() {
  const zkappWorkerClient = store.$state.zkappWorkerClient
    ? store.$state.zkappWorkerClient
    : new ZkappWorkerClient();
  store.$state.zkappWorkerClient = zkappWorkerClient;

  console.log('Loading SnarkyJS...');
  await zkappWorkerClient.loadSnarkyJS();
  console.log('done');

  await zkappWorkerClient.setActiveInstanceToBerkeley();

  const mina = (window as any).mina; // wallet injection

  if (mina == null) {
    store.$state.hasWallet = false;
    return;
  }

  const publicKeyBase58: string = (await mina.requestAccounts())[0];
  const publicKey = PublicKey.fromBase58(publicKeyBase58);

  console.log('using key', publicKey.toBase58());

  console.log('checking if account exists...');
  const res = await zkappWorkerClient.fetchAccount({
    publicKey: publicKey!,
  });
  const accountExists = res.error == null;

  await zkappWorkerClient.loadContract();

  console.time('compiling');
  console.log('compiling zkApp');
  await zkappWorkerClient.compileContract();
  console.log('zkApp compiled');
  console.timeEnd('compiling');

  const zkappPublicKey = PublicKey.fromBase58(
    'B62qohp4zipB5jHp2r8tZyCX1j65H37aQjn4vh9uyHskn3jfnSxbeRu'
  ) as PublicKey;

  await zkappWorkerClient.initZkappInstance(zkappPublicKey);

  console.log('getting zkApp state...');
  await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey });
  const currentNum = await zkappWorkerClient.getNum();
  console.log('current state:', currentNum.toString());

  // store.$state.zkappWorkerClient = zkappWorkerClient;
  store.$state.hasWallet = true;
  store.$state.hasBeenSetup = true;
  store.$state.zkappPublicKey = zkappPublicKey as PublicKey;
  store.$state.publicKey = publicKey;
  store.$state.accountExists = accountExists;
  store.$state.currentNum = currentNum;
}

export async function getAccount() {
  if (
    store.$state.hasBeenSetup &&
    !store.$state.accountExists &&
    store.$state.zkappPublicKey
  ) {
    for (;;) {
      console.log('checking if account exists...');
      const res = await store.$state.zkappWorkerClient!.fetchAccount({
        publicKey: store.$state.publicKey as PublicKey,
      });
      const accountExists = res.error == null;
      if (accountExists) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    store.$state.accountExists = true;
  }
}

// -------------------------------------------------------
// Send a transaction

export async function sendTx() {
  store.$state.creatingTransaction = true;
  console.log('sending a transaction...');

  // if (!store.$state.publicKey)
  // {
  // console.log('no public key');
  //   return
  // }

  await store.$state.zkappWorkerClient!.fetchAccount({
    publicKey: store.$state.publicKey as PublicKey,
  });

  await store.$state.zkappWorkerClient!.createStartTx();

  console.time('proving');
  console.log('creating proof...');
  await store.$state.zkappWorkerClient!.proveUpdateTransaction();
  console.timeEnd('proving');

  console.log('getting Transaction JSON...');
  const transactionJSON =
    await store.$state.zkappWorkerClient!.getTransactionJSON();

  console.log('requesting send transaction...');
  const { hash } = await (window as any).mina.sendTransaction({
    transaction: transactionJSON,
    feePayer: {
      fee: transactionFee,
      memo: '',
    },
  });

  console.log(
    'See transaction at https://berkeley.minaexplorer.com/transaction/' + hash
  );

  store.$state.creatingTransaction = false;
}

// -------------------------------------------------------
// Refresh the current state

export async function refreshState() {
  console.log('getting zkApp state...');
  await store.$state.zkappWorkerClient!.fetchAccount({
    publicKey: store.$state.zkappPublicKey as PublicKey,
  });
  const currentNum = await store.$state.zkappWorkerClient!.getNum();
  console.log('current state:', currentNum.toString());

  store.$state.currentNum = currentNum;
}

// -------------------------------------------------------
// Create UI elements

// if (hasWallet != null && !hasWallet) {
//   const auroLink = 'https://www.aurowallet.com/';
// const auroLinkElem = (
//   <a href={auroLink} target="_blank" rel="noreferrer">
//     {' '}
//     [Link]{' '}
//   </a>
// );
// hasWallet = (
//   <div>
//     {' '}
//     Could not find a wallet. Install Auro wallet here: {auroLinkElem}
//   </div>
// );
// }

// let setupText = state.hasBeenSetup
//   ? 'SnarkyJS Ready'
//   : 'Setting up SnarkyJS...';
// let setup = (
//   <div>
//     {' '}
//     {setupText} {hasWallet}
//   </div>
// );

// let accountDoesNotExist;
// if (state.hasBeenSetup && !state.accountExists) {
//   const faucetLink =
//     'https://faucet.minaprotocol.com/?address=' + state.publicKey!.toBase58();
//   accountDoesNotExist = (
//     <div>
//       Account does not exist. Please visit the faucet to fund this account
//       <a href={faucetLink} target="_blank" rel="noreferrer">
//         {' '}
//         [Link]{' '}
//       </a>
//     </div>
//   );
// }

// let mainContent;
// if (state.hasBeenSetup && state.accountExists) {
//   mainContent = (
//     <div>
//       <button
//         onClick={onSendTransaction}
//         disabled={state.creatingTransaction}
//       >
//         {' '}
//         Send Transaction{' '}
//       </button>
//       <div> Current Number in zkApp: {state.currentNum!.toString()} </div>
//       <button onClick={onRefreshCurrentNum}> Get Latest State </button>
//     </div>
//   );
// }
