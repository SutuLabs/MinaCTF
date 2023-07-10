import JSZip from 'jszip';

export async function packPlaygroundProject(
  contract: 'checkin' | string,
  contractId: string
) {
  const zip = new JSZip();

  let contractName = '';
  if (contract == 'checkin') {
    contractName = 'CheckinContract';
    zip.file(
      'src/contract.ts',
      `
/**
 * This file defines the \`Checkin\` smart contract and the helpers it needs.
 */
const FLAG = 111111;

import { Field, State, SmartContract, state, method } from 'snarkyjs';

export { CheckinContract };

class CheckinContract extends SmartContract {
  // start flag
  @state(Field) start = State<Field>();
  // final flag for capturing
  @state(Field) flag = State<Field>();

  init() {
    super.init();
    this.flag.set(Field(0));
    this.start.set(Field(1));
  }

  @method play() {
    // precondition that links to the actual on-chain state
    this.start.assertEquals(this.start.get());

    // check started
    this.start.assertEquals(Field(1));

    // set flag
    this.flag.set(Field(FLAG));
  }
}`
    );
  } else {
    throw new Error('unknown contract');
  }

  zip.file(
    'src/run.ts',
    `
import "dotenv/config";
import { fetchAccount, Mina, PrivateKey, PublicKey } from "snarkyjs";
import { ${contractName} } from "./contract.js";

const endpointUrl = process.env.ENDPOINT_URL ?? "https://proxy.berkeley.minaexplorer.com/graphql";
const Berkeley = Mina.Network(endpointUrl);
Mina.setActiveInstance(Berkeley);

const deployTransactionFee = 100_000_000;

await (async function run() {
  if (!process.env.CONTRACT_ID) {
    console.log("set CONTRACT_ID in .env file first.");
    return;
  }

  if (!process.env.PRIVATE_KEY) {
    console.log("set PRIVATE_KEY in .env file first.");
    return;
  }

  const zkAppPublicKey = PublicKey.fromBase58(process.env.CONTRACT_ID);
  const deployerPrivateKey = PrivateKey.fromBase58(process.env.PRIVATE_KEY);
  const deployerPublicKey = deployerPrivateKey.toPublicKey();
  let zkapp = new ${contractName}(zkAppPublicKey);

  console.log("Checking deployer account existence");
  let { account: deployerAccount } = await fetchAccount({ publicKey: deployerPublicKey }, endpointUrl);
  if (deployerAccount === undefined) {
    const msg =
      "Deployer account does not exist. " +
      "Request funds at faucet https://berkeley.minaexplorer.com/faucet or " +
      "https://faucet.minaprotocol.com/?address=" +
      deployerPublicKey.toBase58();
    console.log(msg);
    return;
  }

  console.log("checking zkapp account existence");
  let { account: zkappAccount } = await fetchAccount({ publicKey: zkAppPublicKey }, endpointUrl);
  let isDeployed = zkappAccount?.zkapp?.verificationKey !== undefined;

  if (!isDeployed) {
    console.log("zkApp for public key", zkAppPublicKey.toBase58(), "is not found on chain. Please deploy first.");
    return;
  }

  console.log("Compiling smart contract...");
  await ${contractName}.compile();

  console.log("Creating transaction for zkapp", zkAppPublicKey.toBase58());
  let transaction = await Mina.transaction({ sender: deployerPublicKey, fee: deployTransactionFee }, () => {
    // Modify your code here
    zkapp.play();
  });

  console.log("Proving transaction...");
  await transaction.prove();

  console.log("Signing transaction...");
  transaction.sign([deployerPrivateKey]);

  console.log("Sending the transaction...");
  const res = await transaction.send();
  const hash = res.hash();
  if (hash === undefined) {
    console.log("error sending transaction (see above)");
    return;
  }

  console.log("See transaction at", "https://berkeley.minaexplorer.com/transaction/" + hash);
})();
`.trim()
  );

  zip.file(
    '.env',
    `
PRIVATE_KEY=
CONTRACT_ID=${contractId}
`.trim()
  );

  zip.file(
    '.gitignore',
    `
node_modules
build
.env*
`.trim()
  );

  zip.file(
    'package.json',
    `{
  "name": "minactf-playground",
  "version": "0.1.0",
  "description": "",
  "author": "",
  "license": "Apache-2.0",
  "keywords": [
    "mina-zkapp",
    "mina-zk-app",
    "mina-dapp",
    "minactf"
  ],
  "type": "module",
  "main": "build/src/index.js",
  "types": "build/src/index.d.ts",
  "scripts": {
    "build": "tsc",
    "buildw": "tsc --watch",
    "lint": "npx eslint src/* --fix",
    "start": "ts-node src/run.ts"
  },
  "lint-staged": {
    "**/*": [
      "eslint src/* --fix",
      "prettier --write --ignore-unknown"
    ]
  },
  "devDependencies": {
    "@babel/preset-env": "^7.16.4",
    "@babel/preset-typescript": "^7.16.0",
    "@types/node": "^20.3.1",
    "@typescript-eslint/eslint-plugin": "^5.5.0",
    "@typescript-eslint/parser": "^5.5.0",
    "dotenv": "^16.3.1",
    "eslint": "^8.7.0",
    "eslint-plugin-snarkyjs": "^0.1.0",
    "lint-staged": "^11.0.1",
    "prettier": "^2.3.2",
    "snarkyjs": "^0.11.0",
    "ts-node": "^10.9.1",
    "typescript": "^4.7.2"
  }
}`
  );

  zip.file(
    'tsconfig.json',
    `{
  "compilerOptions": {
    "target": "es2020",
    "module": "es2022",
    "lib": [
      "dom",
      "esnext"
    ],
    "outDir": "./build",
    "rootDir": ".",
    "strict": true,
    "strictPropertyInitialization": false, // to enable generic constructors, e.g. on CircuitValue
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "allowJs": true,
    "declaration": true,
    "sourceMap": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true
  },
  "include": [
    "./src"
  ],
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}`
  );

  return zip.generateAsync({ type: 'blob' });
}
