import express from 'express';
import PocketBase from 'pocketbase';
import { ChallengeStatusResponse, ScoreListResponse } from './model';

export async function getPkChallenges(
  pb: PocketBase,
  req: express.Request,
  res: express.Response
) {
  try {
    const publicKey = req.params.publicKey; // need to escape to avoid attack

    const tracker = pb.collection('tracker');
    const clist = await tracker.getFullList({
      filter: `publicKey='${publicKey}'`,
    });
    const ret: ChallengeStatusResponse = {
      publicKey,
      challenges: clist.map((_) => ({
        contractId: _.contractId,
        score: _.score,
        startTime: new Date(_.startTime).getTime(),
        captureTime: new Date(_.captureTime).getTime(),
        name: _.challengeName,
      })),
    };
    res.send(ret);
  } catch (err) {
    console.warn(err);
    res.status(500).send({
      success: false,
      error: err instanceof Error ? err.message : err,
    });
  }
}

export async function getScoreList(
  pb: PocketBase,
  _req: express.Request,
  res: express.Response
) {
  try {
    const tracker = pb.collection('tracker');
    const clist = await tracker.getFullList();
    const ret: ScoreListResponse = {
      scores: clist.map((_) => ({
        score: _.score,
        publicKey: _.publicKey,
        challenge: _.challengeName,
      })),
    };
    res.send(ret);
  } catch (err) {
    console.warn(err);
    res.status(500).send({
      success: false,
      error: err instanceof Error ? err.message : err,
    });
  }
}
