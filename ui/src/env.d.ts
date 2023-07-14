/* eslint-disable */

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
    VUE_APP_VERSION: string;
    VUE_APP_MINA_NETWORK: string;
    VUE_APP_BACKEND_RPC: string;
  }
}
