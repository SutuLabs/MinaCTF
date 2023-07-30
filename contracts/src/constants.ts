export const FLAG = Number(process.env.FLAG ?? 111111);

// maze
export const MAZE_WIDTH = Number(process.env.MAZE_WIDTH ?? 23);
export const MAZE_HEIGHT = Number(process.env.MAZE_HEIGHT ?? 11);
export const MAZE_ENCODED = BigInt(
  process.env.MAZE_ENCODED ?? 14474010291946539611267177320239696521019383011430005103960479183690704879615n
);
export const MAZE_START = Number(process.env.MAZE_START ?? 26);
export const MAZE_END = Number(process.env.MAZE_END ?? 52);

// meowHero
export const LEGION_TREE_HEIGHT = 10;
export const INIT_POINT = 1;
export const MAX_POINT = Number(process.env.MAX_POINT ?? 3);
export const LEGION_ROOT = 21437966668462597419531228685056711434672956253044931657149388835408624663326n;
export const SEED = BigInt(process.env.SEED ?? 1938301114479194655n);

// prime
export const NUMBER = BigInt(process.env.NUMBER ?? 17);

// verifier
export const PUBLICKEY = process.env.PUBLICKEY ?? 'B62qoYts8pW1GVTt44vhA3esBDN67UsX9jLBackLGarfVKBRWtjQBkU';
export const PAYLOAD = Number(process.env.PAYLOAD ?? 20);
