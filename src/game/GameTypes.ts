export type GameMode = 'loading' | 'menu' | 'playing' | 'paused' | 'gameOver';
export type ObstacleType = 'block' | 'barrier' | 'overhead' | 'cones';
export type Lane = 0 | 1 | 2;
export interface GameStats { coins: number; distance: number; score: number; tips: number; speed: number; bestScore: number; bestDistance: number; }
export interface WorldItem { id: number; lane: Lane; z: number; type: 'coin' | ObstacleType; collected?: boolean; }
