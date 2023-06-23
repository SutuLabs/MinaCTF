import { Maze, MazeContract } from './maze';
import { Field, PrivateKey, PublicKey, Mina, AccountUpdate } from 'snarkyjs';

import { Direction, serializeToMaze } from './mazeGenerator';

const defMaze = serializeToMaze(
  `
11111111111111111111111
1  S                  1
1     E               1
1                     1
1                     1
1                     1
1                     1
1                     1
1                     1
1                     1
11111111111111111111111
`.trim()
);

describe('maze', () => {
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
    const zkApp = new MazeContract(zkAppAddress);

    // deploy
    let txn = await Mina.transaction(playerPublicKey, () => {
      AccountUpdate.fundNewAccount(playerPublicKey);
      zkApp.deploy();
      zkApp.startGame(
        Field(defMaze.maze),
        Field(defMaze.start),
        Field(defMaze.end)
      );
    });
    await txn.prove();
    await txn.sign([zkAppPrivateKey, playerPrivateKey]).send();

    // check maze status
    const m = zkApp.maze.get();
    expect(m).toEqual(Field(defMaze.maze));
    const p = zkApp.position.get();
    const e = zkApp.end.get();
    new Maze(m, p, e).printState();

    // move
    const moves = [
      Direction.Down,
      Direction.Right,
      Direction.Right,
      Direction.Right,
    ];
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      txn = await Mina.transaction(playerPublicKey, async () => {
        zkApp.play(Field(move));
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
        if (f.equals(0)) {
          // print maze when last move is not success
          new Maze(
            zkApp.maze.get(),
            zkApp.position.get(),
            zkApp.end.get()
          ).printState();
        }
        f.assertGreaterThan(0);
        console.log('flag:', f.toBigInt());
      }
    }
  });
});
