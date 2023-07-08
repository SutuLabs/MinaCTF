import './registerCoiServcieWorker';
import { useZkAppStore } from '../stores/zkAppStore';
import { PublicKey, Field, state } from 'snarkyjs';
import ZkappWorkerClient from '../services/zkappWorkerClient';
// import './services/registerCoiServcieWorker';

const store = useZkAppStore();
const transactionFee = 0.1;

export async function sign() {
  const mina = (window as any).mina; // wallet injection

  if (mina == null) {
    store.$state.hasWallet = false;
    return;
  }

  const publicKeyBase58: string = (await mina.requestAccounts())[0];
  const publicKey = PublicKey.fromBase58(publicKeyBase58);

  console.log('using key', publicKey.toBase58());

  try {
    const signResult = await (window as any).mina.signMessage({
      message: 'messages...',
    });
    console.log(signResult);
  } catch (error) {
    console.log(error);
  }
}

export async function deploy() {
  // const zkappWorkerClient = store.$state.zkappWorkerClient
  //   ? store.$state.zkappWorkerClient
  //   : new ZkappWorkerClient();
  // store.$state.zkappWorkerClient = zkappWorkerClient;

  // await zkappWorkerClient.waitReady();
  // console.log('Loading SnarkyJS...');
  // await zkappWorkerClient.loadSnarkyJS();
  // console.log('done');

  // await zkappWorkerClient.setActiveInstanceToBerkeley();

  const mina = (window as any).mina; // wallet injection

  if (mina == null) {
    store.$state.hasWallet = false;
    return;
  }

  const publicKeyBase58: string = (await mina.requestAccounts())[0];
  const publicKey = PublicKey.fromBase58(publicKeyBase58);

  console.log('using key', publicKey.toBase58());

  console.log('requesting send transaction...');
  const transactionJSON =
    '{"feePayer":{"body":{"publicKey":"B62qn15maG5vkaU13RiY9hcZ7P3wyA5eKvH7besctmNVcM1sbWTjhD8","fee":"100000000","validUntil":null,"nonce":"2"},"authorization":"7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ"},"accountUpdates":[{"body":{"publicKey":"B62qn15maG5vkaU13RiY9hcZ7P3wyA5eKvH7besctmNVcM1sbWTjhD8","tokenId":"wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf","update":{"appState":[null,null,null,null,null,null,null,null],"delegate":null,"verificationKey":null,"permissions":null,"zkappUri":null,"tokenSymbol":null,"timing":null,"votingFor":null},"balanceChange":{"magnitude":"1000000000","sgn":"Negative"},"incrementNonce":false,"events":[],"actions":[],"callData":"0","callDepth":0,"preconditions":{"network":{"snarkedLedgerHash":null,"blockchainLength":null,"minWindowDensity":null,"totalCurrency":null,"globalSlotSinceGenesis":null,"stakingEpochData":{"ledger":{"hash":null,"totalCurrency":null},"seed":null,"startCheckpoint":null,"lockCheckpoint":null,"epochLength":null},"nextEpochData":{"ledger":{"hash":null,"totalCurrency":null},"seed":null,"startCheckpoint":null,"lockCheckpoint":null,"epochLength":null}},"account":{"balance":null,"nonce":null,"receiptChainHash":null,"delegate":null,"state":[null,null,null,null,null,null,null,null],"actionState":null,"provedState":null,"isNew":null},"validWhile":null},"useFullCommitment":true,"implicitAccountCreationFee":false,"mayUseToken":{"parentsOwnToken":false,"inheritFromParent":false},"authorizationKind":{"isSigned":true,"isProved":false,"verificationKeyHash":"0"}},"authorization":{"proof":null,"signature":"7mWxjLYgbJUkZNcGouvhVj5tJ8yu9hoexb9ntvPK8t5LHqzmrL6QJjjKtf5SgmxB4QWkDw7qoMMbbNGtHVpsbJHPyTy2EzRQ"}},{"body":{"publicKey":"B62qowMxfwAC9xfzYDCGPzhj68vDm6kqSPWvbiEkJ7v3UeMnbduXr93","tokenId":"wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf","update":{"appState":["0","0","0","0","0","0","0","0"],"delegate":null,"verificationKey":{"data":"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","hash":"10815884755335725951726806823505344379960909476639370492854279241882231738930"},"permissions":{"editState":"Proof","access":"None","send":"Proof","receive":"None","setDelegate":"Signature","setPermissions":"Signature","setVerificationKey":"Signature","setZkappUri":"Signature","editActionState":"Proof","setTokenSymbol":"Signature","incrementNonce":"Signature","setVotingFor":"Signature","setTiming":"Signature"},"zkappUri":null,"tokenSymbol":null,"timing":null,"votingFor":null},"balanceChange":{"magnitude":"0","sgn":"Positive"},"incrementNonce":true,"events":[],"actions":[],"callData":"0","callDepth":0,"preconditions":{"network":{"snarkedLedgerHash":null,"blockchainLength":null,"minWindowDensity":null,"totalCurrency":null,"globalSlotSinceGenesis":null,"stakingEpochData":{"ledger":{"hash":null,"totalCurrency":null},"seed":null,"startCheckpoint":null,"lockCheckpoint":null,"epochLength":null},"nextEpochData":{"ledger":{"hash":null,"totalCurrency":null},"seed":null,"startCheckpoint":null,"lockCheckpoint":null,"epochLength":null}},"account":{"balance":null,"nonce":{"lower":"0","upper":"0"},"receiptChainHash":null,"delegate":null,"state":[null,null,null,null,null,null,null,null],"actionState":null,"provedState":false,"isNew":null},"validWhile":null},"useFullCommitment":false,"implicitAccountCreationFee":false,"mayUseToken":{"parentsOwnToken":false,"inheritFromParent":false},"authorizationKind":{"isSigned":true,"isProved":false,"verificationKeyHash":"0"}},"authorization":{"proof":null,"signature":"7mXE2CcyzVuX5rbYFKp8s8XeaAM549Mw8VWbRffNcjmG86J7vpdnCzJgwcghS4vTLkDJF8iGn3bSixa1J4mrR4J8mirwfeKD"}}],"memo":"E4YM2vTHhWEg66xpj52JErHUBU4pZ1yageL4TVDDpTTSsv8mK6YaH"}';

  const { hash } = await (window as any).mina.sendTransaction({
    transaction: transactionJSON,
    feePayer: {
      fee: transactionFee,
      memo: '',
    },
  });
  console.log(hash);

  // const publicKeyBase58: string = (await mina.requestAccounts())[0];
  // const publicKey = PublicKey.fromBase58(publicKeyBase58);

  // console.log('using key', publicKey.toBase58());

  // console.log('checking if account exists...');
  // const res = await zkappWorkerClient.fetchAccount({
  //   publicKey: publicKey!,
  // });
  // const accountExists = res.error == null;

  // await zkappWorkerClient.loadContract();

  // console.time('compiling');
  // console.log('compiling zkApp');
  // await zkappWorkerClient.compileContract();
  // console.log('zkApp compiled');
  // console.timeEnd('compiling');

  // const zkappPublicKey = PublicKey.fromBase58(
  //   'B62qohp4zipB5jHp2r8tZyCX1j65H37aQjn4vh9uyHskn3jfnSxbeRu'
  // ) as PublicKey;

  // await zkappWorkerClient.initZkappInstance(zkappPublicKey);

  // console.log('getting zkApp state...');
  // await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey });
  // const currentNum = await zkappWorkerClient.getNum();
  // console.log('current state:', currentNum.toString());

  // // store.$state.zkappWorkerClient = zkappWorkerClient;
  // store.$state.hasWallet = true;
  // store.$state.hasBeenSetup = true;
  // store.$state.zkappPublicKey = zkappPublicKey as PublicKey;
  // store.$state.publicKey = publicKey;
  // store.$state.accountExists = accountExists;
  // store.$state.currentNum = currentNum;
}

export async function init() {
  const zkappWorkerClient = store.$state.zkappWorkerClient
    ? store.$state.zkappWorkerClient
    : new ZkappWorkerClient();
  store.$state.zkappWorkerClient = zkappWorkerClient;

  await zkappWorkerClient.waitReady();
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
