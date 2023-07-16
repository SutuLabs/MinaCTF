export interface ChallengeEntity {
  flagPosition: number;
  flagNumber: bigint;
  title: string;
  caption: string;
  icon: string;
  difficulty: 'beginner' | 'medium' | 'expert';
  point: number;
}

export const challengeData: { [key: string]: ChallengeEntity } = {
  checkin: {
    flagPosition: 1,
    flagNumber: 111111n,
    title: 'Check in',
    caption: 'Start here, check in',
    icon: 'luggage',
    difficulty: 'beginner',
    point: 100,
  },
  prime: {
    flagPosition: 1,
    flagNumber: 111111n,
    title: 'Prime',
    caption: 'Elementary math',
    icon: 'calculate',
    difficulty: 'medium',
    point: 200,
  },
  verifier: {
    flagPosition: 2,
    flagNumber: 111111n,
    title: 'Verifier',
    caption: 'Papers, Please',
    icon: 'edit_square',
    difficulty: 'medium',
    point: 200,
  },
  maze: {
    flagPosition: 3,
    flagNumber: 111111n,
    title: 'Maze',
    caption: 'Find a way out',
    icon: 'extension',
    difficulty: 'expert',
    point: 300,
  },
};

export default {};
