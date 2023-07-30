import { PrimeContract } from './prime';
import { Field, PrivateKey, PublicKey, Mina, AccountUpdate } from 'snarkyjs';

describe('prime', () => {
  let playerPublicKey: PublicKey, playerPrivateKey: PrivateKey, zkAppAddress: PublicKey, zkAppPrivateKey: PrivateKey;

  beforeEach(async () => {
    let Local = Mina.LocalBlockchain({ proofsEnabled: false });
    Mina.setActiveInstance(Local);
    [{ publicKey: playerPublicKey, privateKey: playerPrivateKey }] = Local.testAccounts;
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
  });

  it('deploys & accepts a correct move', async () => {
    const zkApp = new PrimeContract(zkAppAddress);
    const number = Field(17);

    // deploy
    let txn = await Mina.transaction(playerPublicKey, () => {
      AccountUpdate.fundNewAccount(playerPublicKey);
      zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([zkAppPrivateKey, playerPrivateKey]).send();

    // check contract status
    const m = zkApp.number.get();
    expect(m).toEqual(number);

    const x = Field(3);
    const y = number.div(x);
    console.log('x=', x.toBigInt(), ',y=', y.toBigInt());

    txn = await Mina.transaction(playerPublicKey, async () => {
      zkApp.play(x, y);
    });
    await txn.prove();
    await txn.sign([playerPrivateKey]).send();
    const f = zkApp.flag.get();
    f.assertGreaterThan(0);
    console.log('flag:', f.toBigInt());
  });
});
