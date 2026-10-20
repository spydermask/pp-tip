import { create } from 'zustand';
import type { GameMode, GameStats } from '../game/GameTypes';

const safeGet = (key: string, fallback: number | boolean) => { try { const v = localStorage.getItem(key); return v === null ? fallback : typeof fallback === 'boolean' ? v === 'true' : Number(v); } catch { return fallback; } };
interface GameStore {
 mode: GameMode; coins: number; distance: number; score: number; tips: number; speed: number; bestScore: number; bestDistance: number; sound: boolean; reward: boolean;
 setMode: (mode: GameMode) => void; setSound: (sound: boolean) => void; setReward: (reward: boolean) => void; addCoin: () => boolean; updateRun: (distance: number, speed: number) => void; crash: () => void; startRun: () => void; saveBest: () => void;
}
export const useGameStore = create<GameStore>((set, get) => ({
 mode: 'loading', coins: 0, distance: 0, score: 0, tips: 0, speed: 12,
 bestScore: safeGet('pp-best-score', 0) as number, bestDistance: safeGet('pp-best-distance', 0) as number,
 sound: safeGet('pp-sound', true) as boolean, reward: false,
 setMode: mode => set({ mode }), setSound: sound => { try { localStorage.setItem('pp-sound', String(sound)); } catch {} set({ sound }); }, setReward: reward => set({ reward }),
 addCoin: () => { const s = get(); const coins = s.coins + 1; const crossed = coins % 50 === 0; set({ coins, score: s.score + 10, tips: crossed ? s.tips + 1 : s.tips }); return crossed; },
 updateRun: (distance, speed) => set({ distance, score: Math.floor(distance * 2) + get().coins * 10, speed }),
 crash: () => { get().saveBest(); set({ mode: 'gameOver', reward: false }); },
 startRun: () => set({ mode: 'playing', coins: 0, distance: 0, score: 0, tips: 0, speed: 12, reward: false }),
 saveBest: () => { const s = get(); const bestScore = Math.max(s.bestScore, s.score); const bestDistance = Math.max(s.bestDistance, Math.floor(s.distance)); try { localStorage.setItem('pp-best-score', String(bestScore)); localStorage.setItem('pp-best-distance', String(bestDistance)); } catch {} set({ bestScore, bestDistance }); }
}));
