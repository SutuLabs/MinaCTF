import { Mina, isReady, PublicKey, fetchAccount } from 'snarkyjs';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type { CheckinContract } from '../../../contracts/src/checkin';
import { CheckinContract as CheckinContractInstance } from '../../../contracts/build/src/checkin.js';

const state = {
  CheckinContract: null as null | typeof CheckinContract,
  zkapp: null as null | CheckinContract,
  transaction: null as null | Transaction,
};

// ---------------------------------------------------------------------------------------

const functions = {
  loadSnarkyJS: async () => {
    console.log('hello1');
    await isReady;
    console.log('hello2');
  },
  setActiveInstanceToBerkeley: async () => {
    const Berkeley = Mina.Network(
      'https://proxy.berkeley.minaexplorer.com/graphql'
    );
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async () => {
    state.CheckinContract = CheckinContractInstance;
  },
  compileContract: async () => {
    await state.CheckinContract!.compile();
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.CheckinContract!(publicKey);
    // state.zkapp = new state.CheckinContract!();
  },
  getNum: async () => {
    const currentNum = await state.zkapp?.flag.get();
    return JSON.stringify(currentNum?.toJSON());
  },
  createStartTx: async () => {
    const transaction = await Mina.transaction(() => {
      state.zkapp!.startGame();
    });
    state.transaction = transaction;
  },
  createPlayTx: async () => {
    const transaction = await Mina.transaction(() => {
      state.zkapp!.play();
    });
    state.transaction = transaction;
  },
  proveUpdateTransaction: async () => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async () => {
    return state.transaction!.toJSON();
  },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};
// console.log('browser', process.browser);
// if (process.browser) {
addEventListener('message', async (event: MessageEvent<ZkappWorkerRequest>) => {
  console.log('received', event);
  const returnData = await functions[event.data.fn](event.data.args);

  const message: ZkappWorkerReponse = {
    id: event.data.id,
    data: returnData,
  };
  postMessage(message);
});

console.log('worker ready');
postMessage({ id: -1, data: undefined } as ZkappWorkerReponse);
// }
