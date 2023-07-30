import {
  Meow,
  MeowHeroContract,
  LEGION_TREE_HEIGHT,
  SEED,
  INIT_POINT,
  LegionMerkleWitness,
  combineMeow,
} from './meowHero';
import {
  Field,
  PrivateKey,
  PublicKey,
  Mina,
  AccountUpdate,
  MerkleTree,
  UInt64,
} from 'snarkyjs';
import { searchMeow } from './meowSearcher';

const genesisMeow = new Meow({
  power: UInt64.from(INIT_POINT),
  magic: UInt64.from(INIT_POINT),
  speed: UInt64.from(INIT_POINT),
  lucky: UInt64.from(INIT_POINT),
  charm: UInt64.from(INIT_POINT),
});
const meowList = [genesisMeow, genesisMeow];
const enableSearchSolution = false;

describe('meowHero', () => {
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

  it('deploys & breed', async () => {
    const zkApp = new MeowHeroContract(zkAppAddress);

    // deploy
    let txn = await Mina.transaction(playerPublicKey, () => {
      AccountUpdate.fundNewAccount(playerPublicKey);
      zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([zkAppPrivateKey, playerPrivateKey]).send();

    // create initialize tree
    const tree = new MerkleTree(LEGION_TREE_HEIGHT);
    tree.setLeaf(0n, genesisMeow.hash());
    tree.setLeaf(1n, genesisMeow.hash());
    // console.log('Genesis tree root: ', tree.getRoot().toBigInt());

    expect(zkApp.legionRoot.get()).toEqual(tree.getRoot());

    let moves = [
      [0, 1],
      [1, 2],
      [0, 2],
      [0, 4],
      [0, 2],
      [5, 6],
      [5, 6],
      [7, 8],
      [6, 8],
      [7, 9],
      [9, 11],
      [7, 12],
      [8, 12],
      [12, 13],
      [14, 15],
      [15, 16],
      [16, 17],
      [16, 17],
    ];

    // find solution
    if (enableSearchSolution) {
      moves = searchMeow(meowList, Field(SEED));
      console.log('solution', JSON.stringify(moves));
    }

    // execute solution of breeding on contract
    for (let i = 0; i < moves.length; i++) {
      const [x, y] = moves[i];
      const meow1 = meowList[x];
      const meow2 = meowList[y];
      const path1 = new LegionMerkleWitness(tree.getWitness(BigInt(x)));
      const path2 = new LegionMerkleWitness(tree.getWitness(BigInt(y)));
      const babyPath = new LegionMerkleWitness(
        tree.getWitness(BigInt(meowList.length))
      );
      const seed = zkApp.seed.get();
      const baby = combineMeow(meow1, meow2, seed);
      tree.setLeaf(BigInt(meowList.length), baby.hash());
      meowList[meowList.length] = baby;

      console.log(
        'work on move',
        [x, y],
        JSON.stringify(meow1),
        JSON.stringify(meow2)
      );
      txn = await Mina.transaction(playerPublicKey, async () => {
        zkApp.breed(meow1, path1, meow2, path2, babyPath);
      });
      await txn.prove();
      await txn.sign([playerPrivateKey]).send();

      if (i < moves.length - 1) {
        // before last move, the flag keep empty(zero)
        const f = zkApp.flag.get();
        f.assertEquals(0);
      } else {
        // when last move is success, get the right flag
        const f = zkApp.flag.get();
        f.assertGreaterThan(0);
        console.log('flag:', f.toBigInt());
      }
    }
  });
});
