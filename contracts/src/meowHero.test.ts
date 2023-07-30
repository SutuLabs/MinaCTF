import { Meow, MeowHeroContract, LegionMerkleWitness, combineMeow } from './meowHero';
import { Field, PrivateKey, PublicKey, Mina, AccountUpdate, MerkleTree, UInt64 } from 'snarkyjs';
import { searchMeow } from './meowSearcher';
import { INIT_POINT, SEED, LEGION_TREE_HEIGHT } from './constants';

const genesisMeow = new Meow({
  power: UInt64.from(INIT_POINT),
  magic: UInt64.from(INIT_POINT),
  speed: UInt64.from(INIT_POINT),
  lucky: UInt64.from(INIT_POINT),
  charm: UInt64.from(INIT_POINT),
});
const meowList = [genesisMeow, genesisMeow];
const enableSearchSolution = false;

// for max 5
let moves = JSON.parse(
  '[[0,1],[1,2],[0,1],[0,4],[4,5],[5,6],[3,7],[5,6],[8,9],[8,10],[7,8],[9,12],[11,12],[11,13],[14,15],[13,16],[16,17],[17,18],[16,18],[18,20],[18,19],[21,22]]'
);
// for max 3
moves = JSON.parse('[[0,1],[1,2],[0,1],[0,4],[4,5],[5,6],[3,7],[5,6],[8,9],[8,10],[6,11]]');

// find solution
if (enableSearchSolution) {
  moves = searchMeow(meowList, Field(SEED));
  console.log('solution', JSON.stringify(moves));
}

describe('meowHero', () => {
  let playerPublicKey: PublicKey, playerPrivateKey: PrivateKey, zkAppAddress: PublicKey, zkAppPrivateKey: PrivateKey;

  beforeEach(async () => {
    let Local = Mina.LocalBlockchain({ proofsEnabled: false });
    Mina.setActiveInstance(Local);
    [{ publicKey: playerPublicKey, privateKey: playerPrivateKey }] = Local.testAccounts;
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

    // execute solution of breeding on contract
    for (let i = 0; i < moves.length; i++) {
      const [x, y] = moves[i];
      const meow1 = meowList[x];
      const meow2 = meowList[y];
      const path1 = new LegionMerkleWitness(tree.getWitness(BigInt(x)));
      const path2 = new LegionMerkleWitness(tree.getWitness(BigInt(y)));
      const babyPath = new LegionMerkleWitness(tree.getWitness(BigInt(meowList.length)));
      const seed = zkApp.seed.get();
      const baby = combineMeow(meow1, meow2, seed);
      tree.setLeaf(BigInt(meowList.length), baby.hash());
      meowList[meowList.length] = baby;

      // console.log( 'work on move', [x, y], meow1.toString(), meow2.toString(), baby.toString(), seed.toBigInt());
      txn = await Mina.transaction(playerPublicKey, async () => {
        zkApp.breed(meow1, path1, meow2, path2, babyPath);
      });
      await txn.prove();
      await txn.sign([playerPrivateKey]).send();

      // before capture, the flag keep empty(zero)
      const f = zkApp.flag.get();
      f.assertEquals(0);
    }

    {
      const x = meowList.length - 1;
      const meow = meowList[x];
      // console.log('capture meow: ', JSON.stringify(meow));
      const path = new LegionMerkleWitness(tree.getWitness(BigInt(x)));
      txn = await Mina.transaction(playerPublicKey, async () => {
        zkApp.capture(meow, path);
      });
      await txn.prove();
      await txn.sign([playerPrivateKey]).send();

      // when capture is success, get the right flag
      const f = zkApp.flag.get();
      f.assertGreaterThan(0);
      // console.log('flag:', f.toBigInt());
    }
  });
});
