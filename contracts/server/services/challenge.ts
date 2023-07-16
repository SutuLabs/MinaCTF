import express from 'express';
import { fetchAccount, PrivateKey, PublicKey, SmartContract } from 'snarkyjs';
import { CheckinContract } from '../../src/checkin.js';
import { MazeContract } from '../../src/maze.js';
import { PrimeContract } from '../../src/prime.js';
import { VerifierContract } from '../../src/verifier.js';
import { authenticate, getContractTx, num2Arr, tryGetAccount } from './utils';
import PocketBase from 'pocketbase';
import {
  StartRequest,
  StartResponse,
  CaptureRequest,
  CaptureResponse,
} from './model';
import { challengeData as cdata } from '../challengeData';
import vkeyraw from '../vkey.json' assert { type: 'json' };

const vkey = vkeyraw as unknown as {
  [key: string]: {
    data: string;
    hash: string;
  };
};

export async function createChallenge(
  pb: PocketBase,
  req: express.Request,
  res: express.Response
) {
  try {
    const challengeName = req.params.challenge;
    const challenge = cdata[req.params.challenge];
    if (!challenge) {
      res.status(400).send({ success: false, error: 'unknown challenge' });
      return;
    }

    const verificationKey = vkey[challengeName];
    if (!verificationKey) {
      res.status(400).send({ success: false, error: 'challenge is not ready' });
      return;
    }

    const r = req.body as StartRequest;
    const deployerPublicKey = PublicKey.fromBase58(r.auth.publicKey);
    console.log(
      `Creating challenge [${challengeName}] using [${deployerPublicKey.toBase58()}]`
    );

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
    // console.log(
    //   `Using fee payer account with nonce ${account.nonce}, balance ${account.balance}`
    // );

    // create tx
    const zkAppPrivateKey = PrivateKey.random(); // maybe consider deterministic private key
    const zkAppPublicKey = zkAppPrivateKey.toPublicKey();

    let zkapp: SmartContract | undefined =
      challengeName == 'checkin'
        ? new CheckinContract(zkAppPublicKey)
        : challengeName == 'maze'
        ? new MazeContract(zkAppPublicKey)
        : challengeName == 'prime'
        ? new PrimeContract(zkAppPublicKey)
        : challengeName == 'verifier'
        ? new VerifierContract(zkAppPublicKey)
        : undefined;
    if (!zkapp) {
      res.status(400).send({
        success: false,
        error: `unexpected challenge: ${challengeName}`,
      });
      return;
    }

    const ctx = await getContractTx(
      deployerPublicKey,
      zkAppPrivateKey,
      zkapp,
      verificationKey
    );
    if (!ctx.success || !ctx.tx) {
      res.status(500).send({ success: false, error: 'failed to generate tx' });
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
      success: true,
      tx: ctx.tx,
      contractId: zkAppPublicKey.toBase58(),
    };
    console.log(`Created contract id: ${resp.contractId}`);
    res.send(resp);
  } catch (err) {
    console.warn(err);
    res.status(500).send({
      success: false,
      error: err instanceof Error ? err.message : err,
    });
  }
}

export async function checkChallenge(
  endpointUrl: string,
  pb: PocketBase,
  req: express.Request,
  res: express.Response
) {
  try {
    const challenge = cdata[req.params.challenge];
    if (!challenge) {
      res.status(400).send({ success: false, error: 'unknown challenge' });
      return;
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
    const citem = await tracker.getFirstListItem(`contractId='${contractId}'`);
    await tracker.update(citem.id, {
      captureTime: new Date(Date.now()),
      score: challenge.point,
    });

    console.log(
      `Challenge complete by ${citem.publicKey}, contract id: ${contractId}`
    );
    res.send({ success: true } as CaptureResponse);
  } catch (err) {
    console.warn(err);
    res.status(500).send({
      success: false,
      error: err instanceof Error ? err.message : err,
    });
  }
}
