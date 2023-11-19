import { fetchAccount, PublicKey, PrivateKey, Field } from 'o1js';
import zkappWorker from './zkappWorker.ts?worker';

import type {
  ZkappWorkerRequest,
  ZkappWorkerReponse,
  WorkerFunctions,
} from './zkappWorker';

export default class ZkappWorkerClient {
  // ---------------------------------------------------------------------------------------

  loadSnarkyJS() {
    console.log('load');
    return this._call('loadSnarkyJS', {});
  }

  setActiveInstanceToBerkeley() {
    return this._call('setActiveInstanceToBerkeley', {});
  }

  loadContract() {
    return this._call('loadContract', {});
  }

  compileContract() {
    return this._call('compileContract', {});
  }

  fetchAccount({
    publicKey,
  }: {
    publicKey: PublicKey;
  }): ReturnType<typeof fetchAccount> {
    const result = this._call('fetchAccount', {
      publicKey58: publicKey.toBase58(),
    });
    return result as ReturnType<typeof fetchAccount>;
  }

  initZkappInstance(publicKey: PublicKey) {
    return this._call('initZkappInstance', {
      publicKey58: publicKey.toBase58(),
    });
  }

  async getNum(): Promise<Field> {
    const result = await this._call('getNum', {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  createStartTx() {
    return this._call('createStartTx', {});
  }

  createPlayTx() {
    return this._call('createPlayTx', {});
  }

  proveUpdateTransaction() {
    return this._call('proveUpdateTransaction', {});
  }

  async getTransactionJSON() {
    const result = await this._call('getTransactionJSON', {});
    return result;
  }

  // ---------------------------------------------------------------------------------------

  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    // this.worker = new Worker(new URL('./zkappWorker.ts', import.meta.url));
    this.promises = {};
    this.nextId = -1;

    this.worker = new zkappWorker();
    this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
      // console.log('onmessage', event);
      this.promises[event.data.id].resolve(event.data.data);
      delete this.promises[event.data.id];
    };
    console.log('new worker client');

    this._call('loadSnarkyJS', null); // any function name is idempotent
    console.log(this.promises);
  }

  waitReady(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const lr = this.promises[-1].resolve;
      this.promises[-1].resolve = function (data: any) {
        lr(data);
        resolve(data);
      };
    });
  }

  _call(fn: WorkerFunctions, args: any) {
    return new Promise((resolve, reject) => {
      this.promises[this.nextId] = { resolve, reject };

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      this.worker.postMessage(message);

      this.nextId++;
    });
  }
}
