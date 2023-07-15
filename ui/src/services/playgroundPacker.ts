import JSZip from 'jszip';
import tsconfigStr from './files/tsconfig.json?raw';
import packageStr from './files/package.json?raw';
import gitignoreStr from './files/.gitignore?raw';
import runStr from './files/run.ts?raw';
import checkinStr from 'app/../contracts/src/checkin.ts?raw';

export async function packPlaygroundProject(
  contract: 'checkin' | string,
  contractId: string
) {
  const zip = new JSZip();

  let contractName = '';
  if (contract == 'checkin') {
    contractName = 'CheckinContract';
    zip.file('src/contract.ts', checkinStr);
  } else {
    throw new Error('unknown contract');
  }

  zip.file('src/run.ts', runStr.replaceAll('CONTRACTNAME', contractName));
  zip.file('.env', `PRIVATE_KEY=\nCONTRACT_ID=${contractId}`);
  zip.file('.gitignore', gitignoreStr);
  zip.file('package.json', packageStr);
  zip.file('tsconfig.json', tsconfigStr);

  return zip.generateAsync({ type: 'blob' });
}
