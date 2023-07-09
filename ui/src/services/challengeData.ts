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
  maze: {
    flagPosition: 3,
    flagNumber: 111111n,
    title: 'Maze',
    caption: 'Find a way',
    icon: 'extension',
    difficulty: 'expert',
    point: 300,
  },
};

export default {};
