/**
 * This file defines the `Maze` smart contract and the helpers it needs.
 */
const FLAG = 111111;
const MAZE_WIDTH = 23;
const MAZE_HEIGHT = 11;
const MAZE_ENCODED = 14474010291946539611267177320239696521019383011430005103960479183690704879615n;
const MAZE_START = 26;
const MAZE_END = 52;

import { Field, State, SmartContract, state, method, Bool, Circuit } from 'snarkyjs';

export { Maze, MazeContract };

class Maze {
  maze: Bool[];
  position: Field;
  end: Field;
  width = MAZE_WIDTH;
  height = MAZE_HEIGHT;

  constructor(maze: Field, position: Field, end: Field) {
    this.maze = maze.toBits(253);
    this.position = position;
    this.end = end;
  }

  walk(direction: Field) {
    direction.assertLessThan(Field(4), 'Incorrect direction');
    const dirbits = direction.toBits(2);
    const heading = dirbits[0];
    const orientation = dirbits[1];

    // calculate the new position according to direction
    const pos = this.position.add(
      Circuit.if(orientation, Field(1), Field(this.width)).mul(Circuit.if(heading, Field(1), Field(-1)))
    );

    // the avater should not stand on the wall
    for (let i = 0; i < this.maze.length; i++) {
      const mp = this.maze[i].toField();
      const terrain = Circuit.if(pos.equals(i), mp, Field(0));
      terrain.assertEquals(Field(0), 'walked onto the wall');
    }

    this.position = pos;
  }

  printState() {
    let output = '';
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tmpPos = y * this.width + x;
        if (Number(this.position.toBigInt()) == tmpPos) {
          output += 'P';
        } else if (Number(this.end.toBigInt()) == tmpPos) {
          output += 'E';
        } else {
          output += this.maze[tmpPos].toBoolean() ? '▮' : ' ';
        }
      }
      output += '\n';
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
    this.flag.set(Field(0));
    this.maze.set(Field(MAZE_ENCODED));
    this.position.set(Field(MAZE_START));
    this.end.set(Field(MAZE_END));
  }

  @method play(direction: Field) {
    // 1. if the game is already finished, abort.
    this.maze.get().assertGreaterThan(Field(0), 'game not started');

    // 2. precondition that links this.maze.get() to the actual on-chain state
    this.maze.assertEquals(this.maze.get());
    this.position.assertEquals(this.position.get());
    this.end.assertEquals(this.end.get());

    // 3. walk direction
    const maze = new Maze(this.maze.get(), this.position.get(), this.end.get());
    maze.walk(direction);

    // 4. persistent our move
    this.position.set(maze.position);

    // 5. did I just win? If so, update the flag as well
    const won = maze.checkWinner();
    const flag = Circuit.if(won, Field(FLAG), Field(0));
    this.flag.set(flag);
  }
}
