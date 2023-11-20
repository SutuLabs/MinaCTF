import { CheckinContract } from './checkin';
import { Field, PrivateKey, PublicKey, Mina, AccountUpdate } from 'o1js';

describe('checkin', () => {
  let playerPublicKey: PublicKey, playerPrivateKey: PrivateKey, zkAppAddress: PublicKey, zkAppPrivateKey: PrivateKey;

  beforeEach(async () => {
    let Local = Mina.LocalBlockchain({ proofsEnabled: false });
    Mina.setActiveInstance(Local);
    [{ publicKey: playerPublicKey, privateKey: playerPrivateKey }] = Local.testAccounts;
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
  });

  it('deploys & accepts a correct move', async () => {
    const zkApp = new CheckinContract(zkAppAddress);

    // deploy
    let txn = await Mina.transaction(playerPublicKey, () => {
      AccountUpdate.fundNewAccount(playerPublicKey);
      zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([zkAppPrivateKey, playerPrivateKey]).send();

    // check contract status
    const m = zkApp.start.get();
    expect(m).toEqual(Field(1));

    txn = await Mina.transaction(playerPublicKey, async () => {
      zkApp.play();
    });
    await txn.prove();
    await txn.sign([playerPrivateKey]).send();
    const f = zkApp.flag.get();
    f.assertGreaterThan(0);
    // console.log('flag:', f.toBigInt());
  });
});
