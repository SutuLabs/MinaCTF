import { Meow, combineMeow } from './meowHero';
import { Field, Poseidon } from 'o1js';
const heuristicNumber = 10;
const isConsoleLog = false;

interface StackItem {
  list: Meow[];
  baby: Meow;
  choice: [number, number];
  seedBefore: Field;
  seedAfter: Field;
  commands: [number, number][];
}

function combine(list: Meow[], choice: [number, number], seed: Field, commands: [number, number][]): StackItem {
  if (choice[0] == -1 && choice[1] == -1) {
    choice[0] = list.length - 2;
    choice[1] = list.length - 1;
  }
  const m1 = list[choice[0]];
  const m2 = list[choice[1]];
  const baby = combineMeow(m1, m2, seed);
  const seedAfter = Poseidon.hash([seed, Field(choice[0]), Field(choice[1])]);

  return {
    list,
    baby,
    choice,
    seedBefore: seed,
    seedAfter,
    commands: [...commands, choice],
  };
}

function getNext(item: StackItem): StackItem | undefined {
  const { choice, list, seedBefore, commands } = item;
  // iterate backward from last meow in tilt order
  /*

  require `y>x`

  | y\x | 0   | 1   | 2   | 3   | 4   | 5   | 6   | 7   |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | 0   | -   | -   | -   | -   | -   | -   | -   | -   |
  | 1   | 28  | -   | -   | -   | -   | -   | -   | -   |
  | 2   | 27  | 25  | -   | -   | -   | -   | -   | -   |
  | 3   | 26  | 23  | 20  | -   | -   | -   | -   | -   |
  | 4   | 24  | 21  | 17  | 13  | -   | -   | -   | -   |
  | 5   | 22  | 18  | 14  | 10  | 7   | -   | -   | -   |
  | 6   | 19  | 15  | 11  | 8   | 5   | 3   | -   | -   |
  | 7   | 16  | 12  | 9   | 6   | 4   | 2   | 1   | -   |

  start point: (6, 7) [(max_x-1, max_y)]
  end point: (0, 1)

  example:
  1. (5, 6) -- [y++, x--] -> (4, 7)
  2. (5, 7) -> (4, 8)x -- [y=x+y-1-max_x, x=max_x] -> (7, 4)x -> (6, 5)x -> (5, 6)
  3. (0, 7) -> (-1, 8)x -> (7, -1)x -> (6, 0)x -> (5, 1)x -> (4, 2)
  4. (0, 2) -> (-1, 3)x -- [x == -1: x=x+y-1, y=0] -> (1, 0)x -> (0, 1)
  */

  const max = list.length - 1;
  let [x, y] = choice;

  if (y == 1) {
    // implicitly assume x=0, because y>x
    // iterated all possibilities in this level, no more
    return undefined;
  }

  while (true) {
    y++;
    x--;
    if (y > max) {
      y = x + y - 1 - max;
      x = max;
    }
    if (x == -1) {
      x = x + y - 1;
      y = 0;
    }
    if (y <= x || y < 0) continue;
    break;
  }

  return combine(list, [x, y], seedBefore, commands.slice(0, commands.length - 1));
}

function getRank(item: StackItem): number {
  return item.baby.totalNum() * 10 - item.commands.length;
}

export function searchMeow(list: Meow[], seed: Field): [number, number][] {
  let stack: StackItem[] = [combine(list, [-1, -1], seed, [])];
  const generated = new Set();

  let max = 0;
  let count = 0;
  while (stack.length) {
    const item = stack.pop();
    if (!item) continue;
    const { baby, seedAfter: seed, list, commands } = item;

    // console log for diagnostic
    if (isConsoleLog) {
      count++;
      if (count % 100 == 0) {
        console.log(`[${new Date().toLocaleTimeString()}]looping in ${count} rounds, stack size: ${stack.length}`);
      }
      const rank = getRank(item);
      if (rank > max) {
        const msg = `[${new Date().toLocaleTimeString()}]new record reached: ${getRank(item)} ${JSON.stringify(
          commands
        )} : ${baby} : ${seed}`;
        console.log(msg);
        max = rank;
      }
    }

    // detect target reached
    if (baby.isMax().toBoolean()) return commands;
    if (commands.length > 30) continue;

    // add vertical (go deeper)
    {
      const ti = combine([...list, baby], [-1, -1], seed, commands);
      stack.push(ti);
      generated.add(JSON.stringify(ti.commands));
    }

    // add horizontal (go wider)
    let next: StackItem | undefined = item;
    for (let i = 0; i < heuristicNumber; i++) {
      next = getNext(next);
      // break if no next one
      if (!next) break;

      const cmd = JSON.stringify(next.commands);
      // break if anyone is already in stack
      if (generated.has(cmd)) break;

      stack.push(next);
      generated.add(cmd);
    }

    // reorder in heuristic order (reverse order)
    stack = stack.filter((_) => _.baby.totalNum() - _.commands.length > 0);
    stack.sort(function (a, b) {
      return getRank(a) - getRank(b);
    });
  }

  return [];
}
