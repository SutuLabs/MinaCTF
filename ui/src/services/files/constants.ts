const constants: { [key: string]: { [key: string]: string } } = {
  common: {
    FLAG: '111111',
  },
  checkin: {},
  maze: {
    MAZE_WIDTH: '23',
    MAZE_HEIGHT: '11',
    MAZE_ENCODED:
      '14474010291946539811742119980827739227862537556401246629426592379492244652031',
    MAZE_START: '26',
    MAZE_END: '202',
  },
  meowhero: {
    LEGION_TREE_HEIGHT: '10',
    INIT_POINT: '1',
    MAX_POINT: '6',
    LEGION_ROOT:
      '21437966668462597419531228685056711434672956253044931657149388835408624663326n',
    SEED: '1938301114479194655n',
  },
  prime: {
    NUMBER: '19',
  },
  verifier: {
    PUBLICKEY: "'B62qp8Qpa87wRKqraCsJDBRaVDH4NsVaLrzkiuQH62hc9UgRCWDL6zx'",
    PAYLOAD: '30',
  },
};

export function constructConstantsContent(contract: string): string {
  console.log('cons', contract);
  const list = Object.entries(constants.common)
    .concat(Object.entries(constants[contract]))
    .map((_) => ({ key: _[0], val: _[1] }));
  return list.map((_) => `export const ${_.key} = ${_.val};`).join('\n');
}
