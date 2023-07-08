import {
  PublicKey,
  fetchAccount,
  PrivateKey,
  Field,
  Mina,
  AccountUpdate,
  SmartContract,
  Types,
} from 'snarkyjs';

export { loopUntilAccountExists, tryGetAccount, deploy };

const endpointUrl = 'http://berkeley.mina.sutulabs.com/graphql';
const Berkeley = Mina.Network(endpointUrl);
Mina.setActiveInstance(Berkeley);

async function loopUntilAccountExists({
  account,
  eachTimeNotExist,
  isZkAppAccount,
}: {
  account: PublicKey;
  eachTimeNotExist: () => void;
  isZkAppAccount: boolean;
}) {
  for (;;) {
    let response = await fetchAccount({ publicKey: account });
    let accountExists = response.account !== undefined;
    if (isZkAppAccount) {
      accountExists = response.account?.zkapp?.appState !== undefined;
    }
    if (!accountExists) {
      eachTimeNotExist();
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      // TODO add optional check that verification key is correct once this is available in SnarkyJS
      return response.account!;
    }
  }
}

async function tryGetAccount({
  account,
  isZkAppAccount,
}: {
  account: PublicKey;
  isZkAppAccount: boolean;
}): Promise<Types.Account | undefined> {
  let response = await fetchAccount({ publicKey: account }, endpointUrl);
  let accountExists = response.account !== undefined;
  if (isZkAppAccount) {
    accountExists = response.account?.zkapp?.appState !== undefined;
  }
  return accountExists ? response.account! : undefined;
}

const deployTransactionFee = 100_000_000;

async function deploy(
  deployerPrivateKey: PrivateKey,
  zkAppPrivateKey: PrivateKey,
  zkapp: SmartContract,
  verificationKey: { data: string; hash: string | Field }
): Promise<string | undefined> {
  let sender = deployerPrivateKey.toPublicKey();
  let zkAppPublicKey = zkAppPrivateKey.toPublicKey();
  console.log('using deployer private key with public key', sender.toBase58());
  console.log(
    'using zkApp private key with public key',
    zkAppPublicKey.toBase58()
  );

  let { account } = await fetchAccount(
    { publicKey: zkAppPublicKey },
    endpointUrl
  );
  let isDeployed = account?.zkapp?.verificationKey !== undefined;

  if (isDeployed) {
    console.log(
      'zkApp for public key',
      zkAppPublicKey.toBase58(),
      'found deployed'
    );
  } else {
    console.log('Deploying zkapp for public key', zkAppPublicKey.toBase58());
    let transaction = await Mina.transaction(
      { sender, fee: deployTransactionFee },
      () => {
        console.log('d1');
        AccountUpdate.fundNewAccount(sender);
        // NOTE: this calls `init()` if this is the first deploy
        console.log('d2');
        zkapp.deploy({ verificationKey, zkappKey: zkAppPrivateKey });
        // zkapp.deploy({ zkappKey: zkAppPrivateKey });
        console.log('d3');
      }
    );
    console.log('Proving transaction...');
    await transaction.prove();

    console.log('Signing transaction...');
    // transaction.sign([deployerPrivateKey, zkAppPrivateKey]);
    transaction.sign([zkAppPrivateKey]);
    const txjson = transaction.toJSON();
    console.log('tx json: ' + txjson);
    return '';

    console.log('Sending the deploy transaction...');
    const res = await transaction.send();
    const hash = res.hash();
    if (hash === undefined) {
      console.log('error sending transaction (see above)');
      return undefined;
    }

    console.log(
      'See deploy transaction at',
      'https://berkeley.minaexplorer.com/transaction/' + hash
    );
    console.log('waiting for zkApp account to be deployed...');
    await res.wait();
    isDeployed = true;
    return hash;
  }
}
