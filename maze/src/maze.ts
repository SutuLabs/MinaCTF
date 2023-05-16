/**
 * This file defines the `Maze` smart contract and the helpers it needs.
 */

import {
  Field,
  State,
  SmartContract,
  state,
  method,
  Bool,
  Circuit,
} from 'snarkyjs';

export { Maze, MazeContract };

class Maze {
  maze: Bool[];
  position: Field;
  end: Field;
  width: 23;
  height: 11;

  constructor(maze: Field, position: Field, end: Field) {
    this.maze = maze.toBits(253);
    this.position = position;
    this.end = end;
  }

  serialize(): Field {
    return Field.fromBits(this.maze);
  }

  walk(direction: Field) {
    direction.assertLessThan(4);
    const dirbits = direction.toBits(2);
    const orientation = dirbits[0].toField();
    const heading = dirbits[1].toField();

    // pos = prevPosition + width * (2 * orientation - 1) * (1 - head) + (2 * orientation - 1) * head
    const ori = orientation.mul(2).sub(1);
    const pos = this.position
      .add(Field(this.width)
        .mul(ori)
        .mul(Field(1).sub(heading)
        )
        .add(ori.mul(heading)));

    // the avater should not stand on the wall          
    for (let i = 0; i < this.maze.length; i++) {
      const mp = this.maze[i].toField();
      const terrain = Circuit.if(pos.equals(i), mp, Field(0));
      terrain.assertEquals(0);
    }
  }

  printState() {
    let output = '';
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tmpPos = y * this.width + x;
        if (Number(this.position.toBigInt()) == tmpPos) {
          output += "P";
        } else if (Number(this.end.toBigInt()) == tmpPos) {
          output += "E";
        }
        else {
          output += this.maze[tmpPos].toBoolean() ? "▮" : " ";
        }
      }
      output += "\n";
    }
    console.log(output);
  }

  checkWinner(): Bool {
    return this.position.equals(this.end);
  }
}

class MazeContract extends SmartContract {
  // The maze is serialized as a single field element
  @state(Field) maze = State<Field>();
  // position of avatar located in the maze
  @state(Field) position = State<Field>();
  // end position
  @state(Field) end = State<Field>();
  // final flag for capturing
  @state(Field) flag = State<Field>();

  init() {
    super.init();
    this.maze.set(Field(0));
    this.flag.set(Field(0));
    this.position.set(Field(0));
  }

  @method startGame(maze: Field, position: Field, end: Field) {
    this.maze.assertEquals(Field(0));
    this.maze.set(maze);
    this.position.set(position);
    this.end.set(end);
  }

  @method play(direction: Field) {
    const mazeExist = this.maze.get().greaterThan(Field(0));
    // 1. if the game is already finished, abort.
    mazeExist.assertTrue();

    // 2. walk direction
    this.maze.assertEquals(this.maze.get()); // precondition that links this.maze.get() to the actual on-chain state
    const maze = new Maze(this.maze.get(), this.position.get(), this.end.get());
    maze.walk(direction);

    // 3. persistent our move
    this.maze.set(maze.serialize());

    // 4. did I just win? If so, update the flag as well
    const won = maze.checkWinner();
    const flag = Circuit.if(won, Field(111111), Field(0));
    this.flag.set(flag);
  }
}
