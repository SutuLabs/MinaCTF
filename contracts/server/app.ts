import './config';
import express from 'express';
import { Mina } from 'o1js';
import cors from 'cors';
import PocketBase from 'pocketbase';
// import 'cross-fetch/polyfill';
import { checkChallenge, createChallenge } from './services/challenge';
import { getPkChallenges, getScoreList } from './services/score';

const pbUrl = process.env.PB_EP_URL;
const pbUsername = process.env.PB_USERNAME;
const pbPassword = process.env.PB_PASSWORD;
if (!pbUrl || !pbUsername || !pbPassword) {
  throw new Error('variable PB_EP_URL, PB_USERNAME, PB_PASSWORD must be assigned');
}
console.log(`Connecting PocketBase using ${pbUrl} and ${pbUsername}`);
const pb = new PocketBase(pbUrl);
await pb.collection('users').authWithPassword(pbUsername, pbPassword);

const endpointUrl = process.env.MINA_EP_URL ?? 'https://proxy.berkeley.minaexplorer.com/graphql';
console.log(`Connecting Mina network using ${endpointUrl}`);

const Berkeley = Mina.Network(endpointUrl);
Mina.setActiveInstance(Berkeley);

const app: express.Express = express();
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/version', async (_req: express.Request, res: express.Response) => {
  res.send(JSON.stringify({ version: '0.1' }));
});

app.post('/api/:challenge', (req: express.Request, res: express.Response) => createChallenge(pb, req, res));

app.put('/api/:challenge', async (req: express.Request, res: express.Response) => checkChallenge(endpointUrl, pb, req, res));

app.get('/api/:publicKey', async (req: express.Request, res: express.Response) => getPkChallenges(pb, req, res));

app.get('/api/score/list', async (req: express.Request, res: express.Response) => getScoreList(pb, req, res));

export default app;
