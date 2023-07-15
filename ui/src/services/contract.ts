import { PublicKey } from 'snarkyjs';
import {
  CaptureRequest,
  CaptureResponse,
  ChallengeStatusResponse,
  ScoreListResponse,
  StartRequest,
  StartResponse,
} from 'app/../contracts/server/services/model';

const transactionFee = 0.1;
const rpcUrl = process.env.VUE_APP_BACKEND_RPC ?? 'http://localhost:3030/';

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

  const network = await mina.requestNetwork();
  if (network != 'Berkeley') {
    throw new Error(
      'Only support Berkeley network now, please switch network first!'
    );
  }
  // console.log('network', network);

  onstage?.('sign');
  const signResult = await mina.signMessage({
    message: `Deploy Signature for MinaCTF

Time: ${new Date().toString()}
Timestamp: ${Date.now()}`,
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
  const { tx, contractId, success, error } =
    (await resp.json()) as StartResponse;
  if (!success || !tx || !contractId) {
    throw new Error(error ?? 'unknown error when getting tx');
  }

  onstage?.('send');
  // console.log('requesting send transaction...');
  const { hash } = await mina.sendTransaction({
    transaction: tx,
    feePayer: {
      fee: transactionFee,
      memo: '',
    },
  });
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

  return (await resp.json()) as ChallengeStatusResponse;
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

  return (await resp.json()) as CaptureResponse;
}

export async function getScoreList(): Promise<ScoreListResponse> {
  const resp = await fetch(rpcUrl + 'api/score/list', {
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

  return (await resp.json()) as ScoreListResponse;
}
