import './config';
import express, { response } from 'express';
import {
  fetchAccount,
  Mina,
  PrivateKey,
  PublicKey,
  VerificationKey,
} from 'snarkyjs';
import { CheckinContract } from '../src/checkin.js';
import fs from 'fs';
import {
  deploy,
  getContractTx,
  loopUntilAccountExists,
  tryGetAccount,
} from './utils';
import cors from 'cors';
import PocketBase from 'pocketbase';
// import 'cross-fetch/polyfill';
const { default: Signer } = await import('mina-signer');

const pbUrl = process.env.PB_URL;
const pbUsername = process.env.PB_USERNAME;
const pbPassword = process.env.PB_PASSWORD;
if (!pbUrl || !pbUsername || !pbPassword) {
  throw new Error(
    'Environment variable PB_URL, PB_USERNAME, PB_PASSWORD must be assigned'
  );
}
const pb = new PocketBase(pbUrl);
await pb.collection('users').authWithPassword(pbUsername, pbPassword);

const endpointUrl = 'http://berkeley.mina.sutulabs.com/graphql';

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// (BigInt.prototype as any).toJSON = function () {
//   return this.toString();
// };

// console.log('Compiling smart contract...');
// console.time('compile');
// await CheckinContract.compile();
// console.timeEnd('compile');

// let { verificationKey } = await CheckinContract.compile();
// // const ds = (verificationKey as any).toFields();
// // console.log(ds);
// console.log(verificationKey);
// console.log(verificationKey.data, verificationKey.hash.toString());
// console.log(JSON.stringify(verificationKey));

const verificationKey = {
  data: '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',
  hash: '10815884755335725951726806823505344379960909476639370492854279241882231738930',
};
const Berkeley = Mina.Network(
  'https://proxy.berkeley.minaexplorer.com/graphql'
);
Mina.setActiveInstance(Berkeley);

const app: express.Express = express();
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

interface DeployRequest {
  contract?: string;
  deployerPrivateKey?: string;
  zkAppPrivateKey?: string;
}

app.get('/version', async (_req: express.Request, res: express.Response) => {
  res.send(JSON.stringify({ version: '0.1' }));
});

app.post('/deploy', async (req: express.Request, res: express.Response) => {
  try {
    const r = req.body as DeployRequest;

    const transactionFee = 100_000_000;

    // const deployAlias = process.argv[2];
    // const deployerKeysFileContents = fs.readFileSync("keys/" + deployAlias + ".json", "utf8");
    // const deployerPrivateKeyBase58 = JSON.parse(deployerKeysFileContents).privateKey;
    // const deployerPrivateKey = PrivateKey.fromBase58(deployerPrivateKeyBase58);
    // const deployerPublicKey = deployerPrivateKey.toPublicKey();

    const deployerPrivateKey = r.deployerPrivateKey
      ? PrivateKey.fromBase58(r.deployerPrivateKey)
      : PrivateKey.random();
    const deployerPublicKey = deployerPrivateKey.toPublicKey();

    const zkAppPrivateKey = r.zkAppPrivateKey
      ? PrivateKey.fromBase58(r.zkAppPrivateKey)
      : PrivateKey.random();

    // ----------------------------------------------------

    let account = await tryGetAccount({
      account: deployerPublicKey,
      isZkAppAccount: false,
    });

    if (!account) {
      const msg =
        'Deployer account does not exist. ' +
        (!r.deployerPrivateKey
          ? `Generated private key is ${deployerPrivateKey.toBase58()}.`
          : '') +
        'Request funds at faucet https://berkeley.minaexplorer.com/faucet or ' +
        'https://faucet.minaprotocol.com/?address=' +
        deployerPublicKey.toBase58();
      console.log(msg);
      res.status(400).send(JSON.stringify({ success: false, error: msg }));
      return;
    }

    console.log(
      `Using fee payer account with nonce ${account.nonce}, balance ${account.balance}`
    );

    // ----------------------------------------------------

    const zkAppPublicKey = zkAppPrivateKey.toPublicKey();
    let zkapp = new CheckinContract(zkAppPublicKey);

    // Programmatic deploy:
    //   Besides the CLI, you can also create accounts programmatically. This is useful if you need
    //   more custom account creation - say deploying a zkApp to a different key than the fee payer
    //   key, programmatically parameterizing a zkApp before initializing it, or creating Smart
    //   Contracts programmatically for users as part of an application.
    const hash = await deploy(
      deployerPrivateKey,
      zkAppPrivateKey,
      zkapp,
      verificationKey
    );

    res.send(
      JSON.stringify({
        zkAppPrivateKey: r.zkAppPrivateKey
          ? undefined
          : zkAppPrivateKey.toBase58(),
        hash,
        url: 'https://berkeley.minaexplorer.com/transaction/' + hash,
      })
    );

    // await loopUntilAccountExists({
    //   account: zkAppPublicKey,
    //   eachTimeNotExist: () => console.log("waiting for zkApp account to be deployed..."),
    //   isZkAppAccount: true,
    // });

    // let num = (await zkapp.num.fetch())!;
    // console.log(`current value of num is ${num}`);

    // ----------------------------------------------------

    // let transaction = await Mina.transaction({ sender: deployerPublicKey, fee: transactionFee }, () => {
    //   zkapp.update(num.mul(num));
    // });

    // // fill in the proof - this can take a while...
    // console.log("Creating an execution proof...");
    // let time0 = performance.now();
    // await transaction.prove();
    // let time1 = performance.now();
    // console.log(`creating proof took ${(time1 - time0) / 1e3} seconds`);

    // // sign transaction with the deployer account
    // transaction.sign([deployerPrivateKey]);

    // console.log("Sending the transaction...");
    // let pendingTransaction = await transaction.send();

    // // ----------------------------------------------------

    // if (!pendingTransaction.isSuccess) {
    //   console.log("error sending transaction (see above)");
    //   process.exit(0);
    // }

    // console.log(
    //   `See transaction at https://berkeley.minaexplorer.com/transaction/${pendingTransaction.hash()}
    //   Waiting for transaction to be included...`
    // );
    // await pendingTransaction.wait();

    // console.log(`updated state! ${await zkapp.num.fetch()}`);

    // ----------------------------------------------------
  } catch (err) {
    console.warn(err);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res
      .status(500)
      .send(JSON.stringify({ success: false, error: (<any>err).message }));
  }
});

app.post('/verify', async (req: express.Request, res: express.Response) => {
  try {
    const r = req.body as any;

    const publicKey = r.publicKey;
    const signature = r.signature;
    const verifyMessage = r.data;
    const signer = new Signer({ network: 'testnet' });

    let verifyResult;
    try {
      const nextSignature =
        typeof signature === 'string' ? JSON.parse(signature) : signature;
      const verifyBody = {
        data: verifyMessage,
        publicKey: publicKey,
        signature: nextSignature,
      };
      console.log(verifyBody);
      verifyResult = signer.verifyMessage(verifyBody);
    } catch (error) {
      verifyResult = { error: { message: 'verify failed' } };
    }

    console.log(verifyResult);
    res.send(verifyResult);
  } catch (err) {
    console.warn(err);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res
      .status(500)
      .send(JSON.stringify({ success: false, error: (<any>err).message }));
  }
});

interface AuthEntity {
  publicKey: string;
  signature: { field: string; scalar: string };
  message: string;
}

interface StartRequest {
  auth: AuthEntity;
}

interface StartResponse {
  tx: string;
  contractId: string;
}

interface CaptureRequest {
  contractId: string;
}

interface GeneralFeedback {
  success: boolean;
  error?: string;
}

type CaptureResponse = GeneralFeedback;

interface ChallengeStatusResponse {
  publicKey: string; //base58
  challenges: {
    contractId: string;
    score: number;
    startTime: number;
    captureTime: number;
    name: string;
  }[];
}

interface ScoreListResponse {
  scores: { username: string; score: number }[];
}

app.post(
  '/api/:challenge',
  async (req: express.Request, res: express.Response) => {
    try {
      const challenge = req.params.challenge;
      // check challenge against dictionary

      const r = req.body as StartRequest;
      const deployerPublicKey = PublicKey.fromBase58(r.auth.publicKey);

      const a = authenticate(r.auth);
      if (!a.success) {
        console.log('error authenticate user', a);
        res.send({
          success: false,
          error: 'failed to authenticate user, maybe signature is wrong.',
        });
        return;
      }

      // check deployer pk balance

      let account = await tryGetAccount({
        account: deployerPublicKey,
        isZkAppAccount: false,
      });

      if (!account) {
        const msg =
          'Deployer account does not exist. ' +
          'Request funds at faucet https://berkeley.minaexplorer.com/faucet or ' +
          'https://faucet.minaprotocol.com/?address=' +
          deployerPublicKey.toBase58();
        console.log(msg);
        res.status(400).send(JSON.stringify({ success: false, error: msg }));
        return;
      }
      console.log(
        `Using fee payer account with nonce ${account.nonce}, balance ${account.balance}`
      );

      // create tx
      const zkAppPrivateKey = PrivateKey.random(); // maybe consider deterministic private key
      const zkAppPublicKey = zkAppPrivateKey.toPublicKey();
      // select from challenge
      let zkapp = new CheckinContract(zkAppPublicKey);

      const ctx = await getContractTx(
        deployerPublicKey,
        zkAppPrivateKey,
        zkapp,
        verificationKey
        // (zkapp) => {
        //   const app = zkapp as CheckinContract;
        //   app.startGame();
        // }
      );
      if (!ctx.success || !ctx.tx) {
        res
          .status(500)
          .send({ success: false, error: 'failed to generate tx' });
        return;
      }

      // log to db (overwrite)
      const tracker = pb.collection('tracker');
      const clist = await tracker.getFullList({
        filter: `publicKey='${deployerPublicKey.toBase58()}' && challengeName='${challenge}'`,
      });

      console.log(clist);
      if (clist.length > 0) {
        const citem = clist[0];
        await tracker.update(citem.id, {
          startTime: new Date(Date.now()),
          captureTime: 0,
          score: 0,
          contractId: zkAppPublicKey,
        });
      } else {
        await tracker.create({
          publicKey: deployerPublicKey.toBase58(),
          challengeName: challenge,
          startTime: new Date(Date.now()),
          captureTime: 0,
          score: 0,
          contractId: zkAppPublicKey,
        });
      }
      const resp: StartResponse = {
        tx: ctx.tx,
        contractId: zkAppPublicKey.toBase58(),
      };
      res.send(resp);
    } catch (err) {
      console.warn(err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res
        .status(500)
        .send(JSON.stringify({ success: false, error: (<any>err).message }));
    }
  }
);

app.put(
  '/api/:challenge',
  async (req: express.Request, res: express.Response) => {
    try {
      const challenge = req.params.challenge;
      // check challenge against dictionary

      const r = req.body as CaptureRequest;
      const contractId = r.contractId;

      //TODO: check challenge status and update db
      let { account } = await fetchAccount(
        { publicKey: contractId },
        endpointUrl
      );
      const state = account?.zkapp?.appState;
      console.log(contractId, state, account);
      const flagpos = 1;
      const flagarr = state?.[flagpos]?.value?.[1];
      const targetArr = num2Arr(111111n);
      if (JSON.stringify(flagarr) != JSON.stringify(targetArr)) {
        console.log(
          'check flag',
          JSON.stringify(flagarr),
          JSON.stringify(targetArr)
        );
        res.send({ success: false, error: 'flag not caught yet' });
        return;
      }

      // log to db
      const tracker = pb.collection('tracker');
      const citem = await tracker.getFirstListItem(
        `contractId='${contractId}'`
      );

      await tracker.update(citem.id, {
        captureTime: new Date(Date.now()),
        score: 1,
      });

      res.send({ success: true } as CaptureResponse);
    } catch (err) {
      console.warn(err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res
        .status(500)
        .send(JSON.stringify({ success: false, error: (<any>err).message }));
    }
  }
);

function num2Arr(number: bigint, length = 32): Uint8Array {
  let pos = 0;
  const arr = new Uint8Array(length);
  while (number > 0) {
    arr[pos++] = Number(number & 255n);
    number >>= 8n;
  }
  return arr;
}

app.get(
  '/api/:publicKey',
  async (req: express.Request, res: express.Response) => {
    try {
      const publicKey = req.params.publicKey; // need to escape to avoid attack

      //   - response: { publicKey: base58(string), challenges: { contractId: string, score: number, startTime: number, captureTime: number }[] }
      const tracker = pb.collection('tracker');
      const clist = await tracker.getFullList({
        filter: `publicKey='${publicKey}'`,
      });
      const ret: ChallengeStatusResponse = {
        publicKey,
        challenges: clist.map((_) => ({
          contractId: _.contractId,
          score: _.score,
          startTime: new Date(_.startTime).getTime(),
          captureTime: new Date(_.captureTime).getTime(),
          name: _.challengeName,
        })),
      };
      res.send(ret);
    } catch (err) {
      console.warn(err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res
        .status(500)
        .send(JSON.stringify({ success: false, error: (<any>err).message }));
    }
  }
);

/// legacy
// app.post(
//   '/api/user/login',
//   async (req: express.Request, res: express.Response) => {
//     try {
//       const r = req.body as LoginRequest;

//       const publicKey = r.publicKey;
//       const signature = r.signature;
//       const verifyMessage = r.message;
//       const signer = new Signer({ network: 'testnet' });

//       let verifyResult;
//       try {
//         const nextSignature =
//           typeof signature === 'string' ? JSON.parse(signature) : signature;
//         const verifyBody = {
//           data: verifyMessage,
//           publicKey: publicKey,
//           signature: nextSignature,
//         };
//         console.log(verifyBody);
//         verifyResult = signer.verifyMessage(verifyBody);
//       } catch (error) {
//         verifyResult = { error: { message: 'verify failed' } };
//       }

//       console.log(verifyResult);
//       res.send(verifyResult);
//     } catch (err) {
//       console.warn(err);
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       res
//         .status(500)
//         .send(JSON.stringify({ success: false, error: (<any>err).message }));
//     }
//   }
// );

function authenticate(auth: AuthEntity): { success: boolean; error?: string } {
  const publicKey = auth.publicKey;
  const signature = auth.signature;
  const verifyMessage = auth.message;
  const signer = new Signer({ network: 'testnet' });

  let verifyResult;
  try {
    const nextSignature =
      typeof signature === 'string' ? JSON.parse(signature) : signature;
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

export default app;
