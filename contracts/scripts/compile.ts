import fs from 'fs';
import { Field } from 'snarkyjs';
import '../server/config';

import { CheckinContract } from '../src/checkin.js';
import { MazeContract } from '../src/maze.js';
import { PrimeContract } from '../src/prime.js';
import { VerifierContract } from '../src/verifier.js';
import { MeowHeroContract } from '../src/meowHero.js';

const filename = process.argv[2] ?? 'vkey.json';
const target = process.argv[3] ?? 'checkin';

const d = fs.readFileSync(filename).toString();
const vkey = JSON.parse(d);

if (['all', 'checkin', 'maze', 'prime', 'verifier', 'meowhero'].filter((_) => _ == target).length == 0) {
  throw new Error(`Unknown target: ${target}`);
}

let cname;

cname = 'checkin';
if (target == 'all' || target == cname) {
  vkey[cname] = await compile(cname, () => CheckinContract.compile());
}

cname = 'maze';
if (target == 'all' || target == cname) {
  vkey[cname] = await compile(cname, () => MazeContract.compile());
}

cname = 'prime';
if (target == 'all' || target == cname) {
  vkey[cname] = await compile(cname, () => PrimeContract.compile());
}

cname = 'verifier';
if (target == 'all' || target == cname) {
  vkey[cname] = await compile(cname, () => VerifierContract.compile());
}

cname = 'meowhero';
if (target == 'all' || target == cname) {
  vkey[cname] = await compile(cname, () => MeowHeroContract.compile());
}

let data = JSON.stringify(vkey, null, 4);
fs.writeFileSync(filename, data);
console.log('Writen to file', filename);

// ================= Functions ======================
interface VerificationKeyEntity {
  data: string;
  hash: Field;
}

async function compile(
  name: string,
  compileHandler: () => Promise<{ verificationKey: VerificationKeyEntity }>
): Promise<VerificationKeyEntity> {
  console.log(`Compiling smart contract [${name}]...`);
  console.time('compile');
  const { verificationKey } = await compileHandler();
  console.timeEnd('compile');
  return verificationKey;
}
