export interface MazeEntity {
  maze: bigint;
  start: number;
  end: number;
}

export enum Direction {
  Up = 0,
  Down = 1,
  Left = 2,
  Right = 3,
}

/**
 * Serialize maze from ASCII representation to entity
 * @example
 * 1111111111
 * 1  S     1
 * 1     E  1
 * 1111111111
 *
 * @export
 * @param {string} maze
 * @returns {MazeEntity}
 */
export function serializeToMaze(maze: string): MazeEntity {
  const MAZE_START_TAG = 'S';
  const MAZE_END_TAG = 'E';
  const MAZE_WALL_TAG = '1';

  const lines = maze.split('\n').filter((_) => !!_);
  const height = lines.length;
  const width = lines[0].length;
  const m = [];
  let start = 0;
  let end = 0;
  for (let y = 0; y < height; y++) {
    const line = lines[y];
    for (let x = 0; x < width; x++) {
      const ele = line[x];
      const pos = y * width + x;
      if (ele == MAZE_START_TAG) {
        start = pos;
      } else if (ele == MAZE_END_TAG) {
        end = pos;
      }
      m[pos] = ele == MAZE_WALL_TAG ? 1 : 0;
    }
  }

  const fm = m.reduce(
    (pv, cv) => ({ total: pv.total + pv.acc * BigInt(cv), acc: pv.acc * 2n }),
    { total: 0n, acc: 1n }
  );

  return {
    start,
    end,
    maze: fm.total,
  };
}
