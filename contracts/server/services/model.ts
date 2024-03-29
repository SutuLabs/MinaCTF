export interface AuthEntity {
  publicKey: string;
  signature: { field: string; scalar: string };
  message: string;
}

export interface StartRequest {
  auth: AuthEntity;
}

export interface StartResponse extends GeneralFeedback {
  tx?: string;
  contractId?: string;
}

export interface CaptureRequest {
  contractId: string;
}

export interface GeneralFeedback {
  success: boolean;
  error?: string;
}

export type CaptureResponse = GeneralFeedback;

export interface ChallengeStatusEntity {
  contractId: string;
  score: number;
  startTime: number;
  captureTime: number;
  name: string;
}

export interface ChallengeStatusResponse {
  publicKey: string; //base58
  challenges: ChallengeStatusEntity[];
}

export interface ScoreEntity {
  username?: string;
  publicKey: string;
  score: number;
  challenge: string;
}

export interface ScoreListResponse {
  scores: ScoreEntity[];
}
