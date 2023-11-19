type FetchError = {
  statusCode: number;
  statusText: string;
};

type AuthRequired = 'Signature' | 'Proof' | 'Either' | 'None' | 'Impossible';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FetchResponse = { data: any; errors?: any };
export type FetchedAccount = {
  publicKey: string;
  token: string;
  nonce: string;
  balance: { total: string };
  tokenSymbol: string | null;
  receiptChainHash: string | null;
  timing: {
    initialMinimumBalance: string | null;
    cliffTime: string | null;
    cliffAmount: string | null;
    vestingPeriod: string | null;
    vestingIncrement: string | null;
  };
  permissions: {
    editState: AuthRequired;
    access: AuthRequired;
    send: AuthRequired;
    receive: AuthRequired;
    setDelegate: AuthRequired;
    setPermissions: AuthRequired;
    setVerificationKey: AuthRequired;
    setZkappUri: AuthRequired;
    editActionState: AuthRequired;
    setTokenSymbol: AuthRequired;
    incrementNonce: AuthRequired;
    setVotingFor: AuthRequired;
    setTiming: AuthRequired;
  } | null;
  delegateAccount: { publicKey: string } | null;
  votingFor: string | null;
  zkappState: string[] | null;
  verificationKey: { verificationKey: string; hash: string } | null;
  actionState: string[] | null;
  provedState: boolean | null;
  zkappUri: string | null;
};

export async function fetchAccount(
  accountInfo: { publicKey: string; tokenId?: string },
  graphqlEndpoint: string
): Promise<{ account: FetchedAccount; error: undefined } | { account: undefined; error: FetchError }> {
  const tokenIdBase58 = accountInfo.tokenId ?? 'wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf';

  const req = {
    operationName: null,
    query: `{
    account(publicKey: "${accountInfo.publicKey}", token: "${tokenIdBase58}") {
      publicKey
      token
      nonce
      balance { total }
      tokenSymbol
      receiptChainHash
      timing {
        initialMinimumBalance
        cliffTime
        cliffAmount
        vestingPeriod
        vestingIncrement
      }
      permissions {
        editState
        access
        send
        receive
        setDelegate
        setPermissions
        setVerificationKey
        setZkappUri
        editActionState
        setTokenSymbol
        incrementNonce
        setVotingFor
        setTiming
      }
      delegateAccount { publicKey }
      votingFor
      zkappState
      verificationKey {
        verificationKey
        hash
      }
      actionState
      provedState
      zkappUri
    }
  }`,
    variables: {},
  };
  const resp = await fetch(graphqlEndpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  });

  if (resp.status != 200) {
    throw new Error('NETWORK_ERROR: ' + resp.status.toString() + '\nERROR: ' + (await resp.text()));
  }

  const fetchedAccount = ((await resp.json()) as FetchResponse).data.account as FetchedAccount | null;
  if (!fetchedAccount) {
    return {
      account: undefined,
      error: { statusCode: 0, statusText: 'abnormal content retrieved' },
    };
  }

  return { account: fetchedAccount, error: undefined };
}
