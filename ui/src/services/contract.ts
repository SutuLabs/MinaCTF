import { PublicKey } from 'snarkyjs';
import {
  CaptureRequest,
  CaptureResponse,
  ChallengeStatusResponse,
  StartRequest,
  StartResponse,
} from 'app/../contracts/server/model';

const transactionFee = 0.1;
const rpcUrl = 'http://localhost:3030/';

export async function deploy(
  onstage?: (stage: 'sign' | 'fetch' | 'send') => void
): Promise<{
  contractId: string;
  txHash: string;
}> {
  const mina = window.mina; // wallet injection

  if (mina == null) {
    throw new Error('no wallet');
  }

  const publicKeyBase58: string = (await mina.requestAccounts())[0];
  const publicKey = PublicKey.fromBase58(publicKeyBase58);
  console.log('using key', publicKey.toBase58());

  const network = await mina.requestNetwork();
  console.log('network', network);

  onstage?.('sign');
  const signResult = await mina.signMessage({
    message: 'messages...',
  });

  onstage?.('fetch');
  const req: StartRequest = {
    auth: {
      publicKey: publicKeyBase58,
      message: signResult.data,
      signature: signResult.signature,
    },
  };
  const resp = await fetch(rpcUrl + 'api/checkin', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  });
  if (resp.status != 200) {
    throw new Error(
      'NETWORK_ERROR: ' +
        resp.status.toString() +
        '\nERROR: ' +
        (await resp.text())
    );
  }
  const { tx, contractId } = (await resp.json()) as StartResponse;

  onstage?.('send');
  console.log('requesting send transaction...');
  const { hash } = await mina.sendTransaction({
    transaction: tx,
    feePayer: {
      fee: transactionFee,
      memo: '',
    },
  });
  console.log(hash);
  return { contractId, txHash: hash };
}

export async function getStatus(
  publicKey: string
): Promise<ChallengeStatusResponse> {
  const resp = await fetch(rpcUrl + 'api/' + publicKey, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  if (resp.status != 200) {
    throw new Error(
      'NETWORK_ERROR: ' +
        resp.status.toString() +
        '\nERROR: ' +
        (await resp.text())
    );
  }
  const respjson = (await resp.json()) as ChallengeStatusResponse;

  return respjson;
}

export async function submitCapture(contractId: string, challenge: string) {
  const req: CaptureRequest = {
    contractId,
  };
  const resp = await fetch(rpcUrl + 'api/' + challenge, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  });
  if (resp.status != 200) {
    throw new Error(
      'NETWORK_ERROR: ' +
        resp.status.toString() +
        '\nERROR: ' +
        (await resp.text())
    );
  }
  const ret = (await resp.json()) as CaptureResponse;

  return ret;
}
