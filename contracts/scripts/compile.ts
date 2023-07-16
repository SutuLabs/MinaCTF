import { CheckinContract } from '../src/checkin.js';
import fs from 'fs';

const filename = process.argv[2] ?? 'vkey.json';
const target = process.argv[3] ?? 'checkin';

const d = fs.readFileSync(filename).toString();
const vkey = JSON.parse(d);

let verificationKey;
console.log('Compiling smart contract...');
console.time('compile');
if (target == 'checkin') {
  ({ verificationKey } = await CheckinContract.compile());
} else {
  throw new Error(`Unknown target: ${target}`);
}
console.timeEnd('compile');
vkey[target] = verificationKey;

let data = JSON.stringify(vkey, null, 4);
fs.writeFileSync(filename, data);

console.log('writen to file ', filename);
