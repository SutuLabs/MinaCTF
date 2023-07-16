import JSZip from 'jszip';
import tsconfigStr from './files/tsconfig.json?raw';
import packageStr from './files/package.json?raw';
import gitignoreStr from './files/.gitignore?raw';
import runStr from './files/run.ts?raw';

import { challengeData as challenges } from 'app/../contracts/server/challengeData';
import checkinStr from 'app/../contracts/src/checkin.ts?raw';
import mazeStr from 'app/../contracts/src/maze.ts?raw';
import primeStr from 'app/../contracts/src/prime.ts?raw';
import verifierStr from 'app/../contracts/src/verifier.ts?raw';

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
      : '';

  zip.file('src/contract.ts', contractContent);
  zip.file('src/run.ts', runStr.replaceAll('CONTRACTNAME', contractName));
  zip.file('.env', `PRIVATE_KEY=\nCONTRACT_ID=${contractId}`);
  zip.file('.gitignore', gitignoreStr);
  zip.file('package.json', packageStr);
  zip.file('tsconfig.json', tsconfigStr);

  return zip.generateAsync({ type: 'blob' });
}
