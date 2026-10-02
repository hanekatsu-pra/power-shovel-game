export interface LeverInput {
  x: number; // -1 to 1 (left to right)
  y: number; // -1 to 1 (down to up or vice-versa; we normalize so y > 0 is UP, y < 0 is DOWN)
  active: boolean;
}

export interface ExcavatorAngles {
  swing: number; // Upper structure rotation around Y (in radians)
  boom: number;  // Boom elevation angle (in radians)
  arm: number;   // Arm angle relative to boom (in radians)
  bucket: number;// Bucket curl angle relative to arm (in radians)
}

export interface ExcavatorLimits {
  boomMin: number;
  boomMax: number;
  armMin: number;
  armMax: number;
  bucketMin: number;
  bucketMax: number;
}

export interface ScoopableBall {
  id: number;
  x: number;
  y: number;
  z: number;
  baseX?: number;
  baseY?: number;
  baseZ?: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
  isScooped: boolean;
  isLoaded: boolean;
  isSpilled?: boolean;
  isGolden?: boolean;
  scoopSlot?: number;
}

export type GameMode = 'free' | 'challenge';

export interface GameStats {
  score: number;
  ballsLoaded: number;
  totalBalls: number;
  goldenBallsLoaded: number;
  criticalCount: number;
  combo: number;
  operatorRank: string;
  timeRemaining: number;
  isGameOver: boolean;
  mode: GameMode;
}
