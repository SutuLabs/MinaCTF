import JSZip from 'jszip';
import tsconfigStr from './files/tsconfig.json?raw';
import packageStr from './files/package.json?raw';
import gitignoreStr from './files/.gitignore?raw';
import runStr from './files/run.ts?raw';
import readmeStr from './files/README.md?raw';

import { challengeData as challenges } from 'app/../contracts/server/challengeData';
import checkinStr from 'app/../contracts/src/checkin.ts?raw';
import mazeStr from 'app/../contracts/src/maze.ts?raw';
import primeStr from 'app/../contracts/src/prime.ts?raw';
import verifierStr from 'app/../contracts/src/verifier.ts?raw';
import meowHeroStr from 'app/../contracts/src/meowHero.ts?raw';
import { constructConstantsContent } from './files/constants';

export async function packPlaygroundProject(
  contract: string,
  contractId: string
) {
  const zip = new JSZip();

  const c = challenges[contract];
  if (!c) {
    throw new Error(`unknown contract: ${contract}`);
  }
  const contractName = c.contractName;
  const contractContent =
    contract == 'checkin'
      ? checkinStr
      : contract == 'maze'
      ? mazeStr
      : contract == 'prime'
      ? primeStr
      : contract == 'verifer'
      ? verifierStr
      : contract == 'meowhero'
      ? meowHeroStr
      : '';

  const constantsContent = constructConstantsContent(contract);

  zip.file(
    'src/run.ts',
    runStr
      .replaceAll(
        '/* COMPLEMENT_CODE */\n',
        contract == 'meowhero'
          ? `
  const genesisMeow = new Meow({
    power: UInt64.from(INIT_POINT),
    magic: UInt64.from(INIT_POINT),
    speed: UInt64.from(INIT_POINT),
    lucky: UInt64.from(INIT_POINT),
    charm: UInt64.from(INIT_POINT),
  });
  const meowList = [genesisMeow, genesisMeow];
  const tree = new MerkleTree(LEGION_TREE_HEIGHT);
  tree.setLeaf(0n, genesisMeow.hash());
  tree.setLeaf(1n, genesisMeow.hash());
  const path1 = new LegionMerkleWitness(tree.getWitness(0n));
  const path2 = new LegionMerkleWitness(tree.getWitness(1n));
  const babyPath = new LegionMerkleWitness(tree.getWitness(BigInt(meowList.length)));
`
          : ''
      )
      .replaceAll('penv', 'process.env')
      .replaceAll('CONTRACTNAME', contractName)
      .replaceAll(
        'zkapp.play();',
        contract == 'meowhero'
          ? 'zkapp.breed(genesisMeow, path1, genesisMeow, path2, babyPath);'
          : `zkapp.play(${Array(c.parameterNumber)
              .fill('Field(0)')
              .join(', ')});`
      )
  );
  zip.file('src/contract.ts', contractContent);
  zip.file('src/constants.ts', constantsContent);
  zip.file('.env', `PRIVATE_KEY=\nCONTRACT_ID=${contractId}`);
  zip.file('.gitignore', gitignoreStr);
  zip.file('package.json', packageStr);
  zip.file('tsconfig.json', tsconfigStr);
  zip.file('README.md', readmeStr);

  return zip.generateAsync({ type: 'blob' });
}
