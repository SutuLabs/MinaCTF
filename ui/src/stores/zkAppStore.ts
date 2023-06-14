import { defineStore } from 'pinia';
import { PublicKey, Field } from 'snarkyjs';
import ZkappWorkerClient from 'src/services/zkappWorkerClient';

export const useZkAppStore = defineStore('zkApp', {
  state: () => ({
    counter: 0,
    hasWallet: undefined as undefined | boolean,
    hasBeenSetup: undefined as undefined | boolean,

    zkappWorkerClient: undefined as undefined | ZkappWorkerClient,

    zkappPublicKey: PublicKey.empty() as PublicKey,
    publicKey: PublicKey.empty() as PublicKey,
    accountExists: undefined as undefined | boolean,
    currentNum: undefined as undefined | Field,
    creatingTransaction: false,
  }),

  getters: {
    doubleCount(state) {
      return state.counter * 2;
    },
  },

  actions: {
    increment() {
      this.counter++;
    },
  },
});
