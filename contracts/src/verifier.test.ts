import { VerifierContract } from './verifier';
import {
  Field,
  PrivateKey,
  PublicKey,
  Mina,
  AccountUpdate,
  Signature,
} from 'snarkyjs';

describe('verifier', () => {
  let playerPublicKey: PublicKey,
    playerPrivateKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey;

  beforeEach(async () => {
    let Local = Mina.LocalBlockchain({ proofsEnabled: false });
    Mina.setActiveInstance(Local);
    [{ publicKey: playerPublicKey, privateKey: playerPrivateKey }] =
      Local.testAccounts;
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
  });

  it('deploys & accepts a correct move', async () => {
    const zkApp = new VerifierContract(zkAppAddress);
    const sk = PrivateKey.fromFields([Field(17)]);
    const pk = sk.toPublicKey();
    const payload = Field(20);

    // deploy
    let txn = await Mina.transaction(playerPublicKey, () => {
      AccountUpdate.fundNewAccount(playerPublicKey);
      zkApp.deploy();
      zkApp.startGame(pk, payload);
    });
    await txn.prove();
    await txn.sign([zkAppPrivateKey, playerPrivateKey]).send();

    // check contract status
    const m = zkApp.payload.get();
    expect(m).toEqual(payload);
    const spk = zkApp.publicKey.get();
    expect(spk).toEqual(pk);

    // try fake solution, flag should not be set
    const fakesk = PrivateKey.fromFields([Field(1)]);
    const fakesig = Signature.create(fakesk, [m]);

    txn = await Mina.transaction(playerPublicKey, async () => {
      zkApp.play(fakesig);
    });
    await txn.prove();
    await txn.sign([playerPrivateKey]).send();
    let f = zkApp.flag.get();
    f.assertEquals(0);

    // try true solution, flag should be set
    const sig = Signature.create(sk, [m]);

    txn = await Mina.transaction(playerPublicKey, async () => {
      zkApp.play(sig);
    });
    await txn.prove();
    await txn.sign([playerPrivateKey]).send();
    f = zkApp.flag.get();
    f.assertGreaterThan(0);
    console.log('flag:', f.toBigInt());
  });
});
