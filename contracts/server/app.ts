import './config';
import express from 'express';
import { fetchAccount, Mina, PrivateKey, PublicKey } from 'snarkyjs';
import { CheckinContract } from '../src/checkin.js';
import { authenticate, getContractTx, num2Arr, tryGetAccount } from './utils';
import cors from 'cors';
import PocketBase from 'pocketbase';
import {
  StartRequest,
  StartResponse,
  CaptureRequest,
  CaptureResponse,
  ChallengeStatusResponse,
} from './model';
import { challengeData as cdata } from './challengeData';
// import 'cross-fetch/polyfill';
import vkey from './vkey.json' assert { type: 'json' };

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

const verificationKey = vkey['checkin'];
const Berkeley = Mina.Network(
  'https://proxy.berkeley.minaexplorer.com/graphql'
);
Mina.setActiveInstance(Berkeley);

const app: express.Express = express();
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/version', async (_req: express.Request, res: express.Response) => {
  res.send(JSON.stringify({ version: '0.1' }));
});

app.post(
  '/api/:challenge',
  async (req: express.Request, res: express.Response) => {
    try {
      const challengeName = req.params.challenge;
      const challenge = cdata[req.params.challenge];
      if (!challenge) {
        res.status(400).send({ success: false, error: 'unknown challenge' });
      }

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
        filter: `publicKey='${deployerPublicKey.toBase58()}' && challengeName='${challengeName}'`,
      });

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
          challengeName: challengeName,
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
      res.status(500).send({
        success: false,
        error: err instanceof Error ? err.message : err,
      });
    }
  }
);

app.put(
  '/api/:challenge',
  async (req: express.Request, res: express.Response) => {
    try {
      const challenge = cdata[req.params.challenge];
      if (!challenge) {
        res.status(400).send({ success: false, error: 'unknown challenge' });
      }

      const r = req.body as CaptureRequest;
      const contractId = r.contractId;

      // check challenge status
      let { account } = await fetchAccount(
        { publicKey: contractId },
        endpointUrl
      );
      const state = account?.zkapp?.appState;
      const flagpos = challenge.flagPosition;
      const flagarr = state?.[flagpos]?.value?.[1];
      const targetArr = num2Arr(challenge.flagNumber);
      if (JSON.stringify(flagarr) != JSON.stringify(targetArr)) {
        res.send({ success: false, error: 'flag not caught yet' });
        return;
      }

      // update to db
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
      res.status(500).send({
        success: false,
        error: err instanceof Error ? err.message : err,
      });
    }
  }
);

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
      res.status(500).send({
        success: false,
        error: err instanceof Error ? err.message : err,
      });
    }
  }
);

export default app;
