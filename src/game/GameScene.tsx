import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Cloud, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import PlayerCharacter from './PlayerCharacter';
import { useGameStore } from '../store/gameStore';
import type { Lane, ObstacleType } from './GameTypes';

const LANE_X = [-1.65, 0, 1.65] as const;
const ROAD_WIDTH = 5.25;
const ROAD_LENGTH = 42;
const JUMP_SECONDS = 0.78;
const SLIDE_SECONDS = 0.68;

type Kind = 'coin' | ObstacleType | 'train';
interface PoolItem {
  id: number;
  lane: Lane;
  z: number;
  kind: Kind;
  active: boolean;
  previousZ: number;
}
interface Controls {
  lane: MutableRefObject<number>;
  jumping: MutableRefObject<boolean>;
  sliding: MutableRefObject<boolean>;
}

const randomLane = (): Lane => Math.floor(Math.random() * 3) as Lane;
const randomObstacle = (): Kind => {
  const roll = Math.random();
  if (roll < 0.16) return 'train';
  return (['block', 'overhead', 'cones', 'barrier'][Math.floor(Math.random() * 4)] as ObstacleType);
};

function makePool(): PoolItem[] {
  const items: PoolItem[] = [];
  let id = 0;
  // Start with a short, readable coin tutorial, then introduce hazards.
  for (let row = 0; row < 42; row++) {
    const z = -20 - row * 4.8;
    const lane = (row % 3) as Lane;
    const kind: Kind = row < 5 || row % 4 !== 3 ? 'coin' : randomObstacle();
    items.push({ id: id++, lane, z, kind, active: true, previousZ: z });
  }
  return items;
}

function Coin({ spin }: { spin: (el: THREE.Group | null) => void }) {
  return (
    <group ref={spin} position={[0, 1.05, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.11, 24]} />
        <meshStandardMaterial color="#ffc928" metalness={0.62} roughness={0.28} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.255, 0.035, 8, 24]} />
        <meshStandardMaterial color="#fff1a8" metalness={0.45} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.061]}>
        <circleGeometry args={[0.12, 12]} />
        <meshBasicMaterial color="#d99412" />
      </mesh>
    </group>
  );
}

function TrainFront() {
  return (
    <group position={[0, 0, -0.05]}>
      <mesh position={[0, 1.12, 0]} castShadow>
        <boxGeometry args={[1.58, 2.2, 1.55]} />
        <meshStandardMaterial color="#e8f1f8" metalness={0.38} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.92, 0.79]} castShadow>
        <boxGeometry args={[1.28, 0.58, 0.055]} />
        <meshStandardMaterial color="#17334c" metalness={0.25} roughness={0.22} />
      </mesh>
      <mesh position={[0, 1.57, 0.825]}>
        <boxGeometry args={[1.25, 0.055, 0.035]} />
        <meshBasicMaterial color="#79e3ff" />
      </mesh>
      <mesh position={[0, 0.96, 0.79]}>
        <boxGeometry args={[1.56, 0.22, 0.06]} />
        <meshStandardMaterial color="#ff9f2f" metalness={0.18} roughness={0.35} />
      </mesh>
      {[-0.52, 0.52].map((x) => <group key={x} position={[x, 0.35, 0.81]}>
        <mesh><sphereGeometry args={[0.105, 12, 8]} /><meshStandardMaterial color="#fff6cf" emissive="#ffbd59" emissiveIntensity={1.2} /></mesh>
        <mesh position={[0, 0, -0.025]}><sphereGeometry args={[0.18, 12, 8]} /><meshBasicMaterial color="#ffbd59" transparent opacity={0.18} /></mesh>
      </group>)}
      <mesh position={[0, 0.1, 0.82]}><boxGeometry args={[1.18, 0.12, 0.06]} /><meshStandardMaterial color="#263648" /></mesh>
      <mesh position={[0, 2.27, 0]}><boxGeometry args={[1.25, 0.12, 1.2]} /><meshStandardMaterial color="#d4e2ec" metalness={0.35} roughness={0.32} /></mesh>
    </group>
  );
}

function Obstacle({ kind }: { kind: ObstacleType | 'train' }) {
  if (kind === 'train') return <TrainFront />;
  if (kind === 'overhead') {
    return (
      <group>
        <mesh position={[0, 1.95, 0]} castShadow>
          <boxGeometry args={[1.42, 0.26, 0.42]} />
          <meshStandardMaterial color="#202a38" roughness={0.72} />
        </mesh>
        {[-0.55, 0.55].map((x) => (
          <mesh key={x} position={[x, 1.2, 0]} castShadow>
            <boxGeometry args={[0.16, 1.45, 0.36]} />
            <meshStandardMaterial color="#f3b52c" />
          </mesh>
        ))}
        <mesh position={[0, 1.79, 0.225]}>
          <boxGeometry args={[0.9, 0.08, 0.025]} />
          <meshBasicMaterial color="#f7f8fb" />
        </mesh>
      </group>
    );
  }
  if (kind === 'cones') {
    return (
      <group>
        {[-0.36, 0.36].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, 0.36, 0]} castShadow>
              <coneGeometry args={[0.23, 0.72, 8]} />
              <meshStandardMaterial color="#ff783b" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 0.12, 8]} />
              <meshStandardMaterial color="#f5f6f8" />
            </mesh>
          </group>
        ))}
      </group>
    );
  }
  return (
    <group>
      <mesh position={[0, 0.57, 0]} castShadow>
        <boxGeometry args={[kind === 'barrier' ? 1.18 : 1.05, 1.14, 0.82]} />
        <meshStandardMaterial color={kind === 'barrier' ? '#ffb52f' : '#e8edf3'} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.57, 0.42]}>
        <boxGeometry args={[0.72, 0.12, 0.025]} />
        <meshBasicMaterial color="#273244" />
      </mesh>
    </group>
  );
}

function SceneWorld({ controls }: { controls: Controls }) {
  const items = useMemo(makePool, []);
  const itemRefs = useRef<Record<number, THREE.Group | null>>({});
  const coinRefs = useRef<Record<number, THREE.Group | null>>({});
  const roadMarks = useRef<Array<THREE.Group | null>>([]);
  const sleeperRefs = useRef<Array<THREE.Group | null>>([]);
  const gantryRefs = useRef<Array<THREE.Group | null>>([]);
  const sceneryRefs = useRef<Array<THREE.Group | null>>([]);
  const playerX = useRef(0);
  const jumpTime = useRef(0);
  const slideTime = useRef(0);
  const spawnTimer = useRef(0);
  const hudTimer = useRef(0);
  const distanceRef = useRef(0);
  const speedRef = useRef(12);
  const rewardSafeTime = useRef(0);
  const rewardTimer = useRef<number | null>(null);
  const [rewardAnim, setRewardAnim] = useState(false);

  const mode = useGameStore((s) => s.mode);
  const addCoin = useGameStore((s) => s.addCoin);
  const updateRun = useGameStore((s) => s.updateRun);
  const crash = useGameStore((s) => s.crash);
  const setReward = useGameStore((s) => s.setReward);
  const reward = useGameStore((s) => s.reward);

  const targetLaneX = useCallback(() => LANE_X[Math.max(0, Math.min(2, controls.lane.current))], [controls.lane]);

  useEffect(() => {
    if (mode === 'playing') {
      distanceRef.current = 0;
      speedRef.current = 12;
      jumpTime.current = 0;
      slideTime.current = 0;
      spawnTimer.current = 0;
      rewardSafeTime.current = 0;
      hudTimer.current = 0;
      playerX.current = LANE_X[controls.lane.current] ?? 0;
      items.forEach((item, index) => {
        item.active = true;
        item.z = -20 - index * 4.8;
        item.previousZ = item.z;
        item.lane = (index % 3) as Lane;
        item.kind = index < 5 || index % 4 !== 3 ? 'coin' : randomObstacle();
      });
    }
  }, [mode, controls.lane, items]);

  useEffect(() => () => {
    if (rewardTimer.current !== null) window.clearTimeout(rewardTimer.current);
  }, []);

  useFrame((state, rawDt) => {
    if (mode !== 'playing') return;
    const dt = Math.min(rawDt, 0.035);
    distanceRef.current += speedRef.current * dt;
    speedRef.current = Math.min(23, 12 + distanceRef.current / 170);
    const speed = speedRef.current;
    rewardSafeTime.current = Math.max(0, rewardSafeTime.current - dt);

    hudTimer.current += dt;
    if (hudTimer.current >= 0.12) {
      updateRun(distanceRef.current, speed);
      hudTimer.current = 0;
    }

    playerX.current = THREE.MathUtils.damp(playerX.current, targetLaneX(), 14, dt);
    if (controls.jumping.current) {
      if (jumpTime.current <= 0 && slideTime.current <= 0) jumpTime.current = JUMP_SECONDS;
      controls.jumping.current = false;
    }
    if (controls.sliding.current) {
      if (slideTime.current <= 0) slideTime.current = SLIDE_SECONDS;
      controls.sliding.current = false;
    }
    jumpTime.current = Math.max(0, jumpTime.current - dt);
    slideTime.current = Math.max(0, slideTime.current - dt);

    // Animate the road dashes toward the camera, then recycle them ahead.
    for (const group of roadMarks.current) {
      if (!group) continue;
      group.position.z += speed * dt;
      if (group.position.z > 7) group.position.z -= 22 * 5;
    }
    // Railway sleepers and overhead gantries flow toward the player.
    for (const group of sleeperRefs.current) {
      if (!group) continue;
      group.position.z += speed * dt;
      if (group.position.z > 7) group.position.z -= 13.5 * 12;
    }
    for (const group of gantryRefs.current) {
      if (!group) continue;
      group.position.z += speed * dt;
      if (group.position.z > 12) group.position.z -= 25 * 6;
    }
    // Simple low-poly scenery pools on both sides of the track.
    for (const group of sceneryRefs.current) {
      if (!group) continue;
      group.position.z += speed * dt * 0.92;
      if (group.position.z > 10) group.position.z -= 150;
    }

    spawnTimer.current += dt;
    const spawnEvery = Math.max(0.92, 1.5 - distanceRef.current / 2400);
    if (spawnTimer.current >= spawnEvery) {
      spawnTimer.current = 0;
      const recycled = items.reduce((a, b) => (a.z > b.z ? a : b));
      const farthestAhead = Math.min(...items.map((item) => item.z));
      recycled.z = farthestAhead - 7.5;
      recycled.previousZ = recycled.z;
      recycled.lane = randomLane();
      recycled.kind = distanceRef.current < 45 || Math.random() < 0.48 ? 'coin' : randomObstacle();
      recycled.active = true;

      // Keep one clear lane in every generated hazard row.
      if (recycled.kind !== 'coin') {
        const safeCoin = items.reduce((a, b) => (a.z > b.z ? a : b));
        safeCoin.z = recycled.z - 2.0;
        safeCoin.previousZ = safeCoin.z;
        safeCoin.lane = ([0, 1, 2].filter((lane) => lane !== recycled.lane)[Math.floor(Math.random() * 2)]) as Lane;
        safeCoin.kind = 'coin';
        safeCoin.active = true;
      }
    }

    let didCrash = false;
    for (const item of items) {
      item.previousZ = item.z;
      item.z += speed * dt;
      const object = itemRefs.current[item.id];
      if (object) {
        object.position.x = LANE_X[item.lane];
        object.position.z = item.z;
        object.visible = item.active;
      }
      const coin = coinRefs.current[item.id];
      if (coin && item.kind === 'coin') coin.rotation.y += dt * 4.5;

      // Swept crossing check: detects objects passing the player between frames.
      const crossedPlayer = item.previousZ <= 0.65 && item.z >= -0.65;
      if (item.active && crossedPlayer) {
        const sameLane = Math.abs(playerX.current - LANE_X[item.lane]) < 0.72;
        if (sameLane && item.kind === 'coin') {
          item.active = false;
          if (object) object.visible = false;
          if (addCoin()) {
            setReward(true);
            setRewardAnim(true);
            rewardSafeTime.current = 1.25;
            if (rewardTimer.current !== null) window.clearTimeout(rewardTimer.current);
            rewardTimer.current = window.setTimeout(() => {
              setReward(false);
              setRewardAnim(false);
              rewardTimer.current = null;
            }, 2200);
          }
        } else if (sameLane && item.kind !== 'coin' && !reward && rewardSafeTime.current <= 0) {
          const cleared = item.kind === 'train'
            ? false
            : item.kind === 'overhead'
            ? slideTime.current > 0.08
            : item.kind === 'block'
              ? jumpTime.current > 0.18
              : jumpTime.current > 0.12 || slideTime.current > 0.12;
          if (!cleared) didCrash = true;
          else item.active = false;
        }
      }
      if (item.z > 8) {
        item.z = Math.min(...items.map((entry) => entry.z)) - 9;
        item.previousZ = item.z;
        item.lane = randomLane();
        item.kind = Math.random() < 0.56 ? 'coin' : randomObstacle();
        item.active = true;
      }
    }
    if (didCrash) {
      crash();
      return;
    }

    const camera = state.camera;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, playerX.current * 0.2, 4.5, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 4.0 + (jumpTime.current > 0 ? 0.12 : 0), 5, dt);
    camera.lookAt(playerX.current * 0.12, 1.15, -10.5);
  });

  return (
    <>
      <color attach="background" args={['#78cfff']} />
      <fog attach="fog" args={['#78cfff', 38, 125]} />
      <ambientLight intensity={1.15} />
      <hemisphereLight args={['#e8f8ff', '#68717d', 1.05]} />
      <directionalLight position={[-7, 12, 6]} intensity={2.0} castShadow shadow-mapSize={[1024, 1024]} />
      <PerspectiveCamera makeDefault position={[0, 4, 7]} fov={60} near={0.1} far={180} />

      {/* One continuous asphalt road, not three disconnected lane platforms. */}
      <mesh position={[0, -0.16, -64]} receiveShadow>
        <boxGeometry args={[ROAD_WIDTH, 0.3, 150]} />
        <meshStandardMaterial color="#303844" roughness={0.95} />
      </mesh>
      <mesh position={[-ROAD_WIDTH / 2 - 0.12, -0.08, -64]}>
        <boxGeometry args={[0.18, 0.18, 150]} />
        <meshStandardMaterial color="#f5f7fb" />
      </mesh>
      <mesh position={[ROAD_WIDTH / 2 + 0.12, -0.08, -64]}>
        <boxGeometry args={[0.18, 0.18, 150]} />
        <meshStandardMaterial color="#f5f7fb" />
      </mesh>

      {/* Steel rails, sleepers and ballast make the route read as a real subway corridor. */}
      <mesh position={[0, -0.28, -64]} receiveShadow>
        <boxGeometry args={[6.3, 0.18, 150]} />
        <meshStandardMaterial color="#535b65" roughness={1} />
      </mesh>
      {[-1.65, 0, 1.65].map((x) => [x - 0.42, x + 0.42].map((railX) => (
        <mesh key={`rail-${railX}`} position={[railX, -0.12, -64]} castShadow>
          <boxGeometry args={[0.075, 0.12, 150]} />
          <meshStandardMaterial color="#b9c5d0" metalness={0.82} roughness={0.24} />
        </mesh>
      )))}
      {Array.from({ length: 12 }, (_, i) => (
        <group key={`sleeper-${i}`} ref={(el) => { sleeperRefs.current[i] = el; }} position={[0, -0.18, -i * 13.5]}>
          <mesh receiveShadow><boxGeometry args={[5.9, 0.1, 0.34]} /><meshStandardMaterial color="#403c39" roughness={0.96} /></mesh>
        </group>
      ))}
      {/* Repeating overhead catenary frames add depth and a recognizable rail-station silhouette. */}
      {Array.from({ length: 6 }, (_, i) => (
        <group key={`gantry-${i}`} ref={(el) => { gantryRefs.current[i] = el; }} position={[0, 0, -i * 25 - 8]}>
          <mesh position={[-3.25, 4.7, 0]}><boxGeometry args={[0.12, 9.4, 0.12]} /><meshStandardMaterial color="#64717c" metalness={0.55} roughness={0.4} /></mesh>
          <mesh position={[3.25, 4.7, 0]}><boxGeometry args={[0.12, 9.4, 0.12]} /><meshStandardMaterial color="#64717c" metalness={0.55} roughness={0.4} /></mesh>
          <mesh position={[0, 8.8, 0]}><boxGeometry args={[6.6, 0.13, 0.13]} /><meshStandardMaterial color="#64717c" metalness={0.55} roughness={0.4} /></mesh>
          <mesh position={[0, 8.55, 0]}><boxGeometry args={[5.8, 0.045, 0.045]} /><meshStandardMaterial color="#d7e3ec" metalness={0.6} roughness={0.3} /></mesh>
        </group>
      ))}

      {/* Dashed lane separators are pooled and animated. */}
      {[-0.825, 0.825].map((x, laneIndex) => Array.from({ length: 22 }, (_, i) => (
        <group key={`${x}-${i}`} position={[x, -0.002, -i * 5.1]} ref={(el) => { roadMarks.current[laneIndex * 22 + i] = el; }}>
          <mesh>
            <boxGeometry args={[0.045, 0.025, 2.1]} />
            <meshBasicMaterial color="#e8edf4" />
          </mesh>
        </group>
      )))}

      {/* Original stylized city scenery. */}
      {Array.from({ length: 22 }, (_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const x = side * (4.5 + (i % 4) * 1.35);
        const z = -(i * 6.7 + 8);
        const height = 1.8 + (i % 4) * 0.55;
        const colors = ['#f5bb75', '#8ab8cc', '#a2c9a2', '#d8a5a5'];
        return (
          <group key={i} position={[x, 0, z]} ref={(el) => { sceneryRefs.current[i] = el; }}>
            <mesh position={[0, height / 2, 0]} castShadow>
              <boxGeometry args={[1.25 + (i % 3) * 0.35, height, 1.2]} />
              <meshStandardMaterial color={colors[i % colors.length]} roughness={0.9} />
            </mesh>
            <mesh position={[0, height + 0.08, 0]}>
              <boxGeometry args={[1.45 + (i % 3) * 0.35, 0.12, 1.35]} />
              <meshStandardMaterial color="#f7f8fa" />
            </mesh>
            {Array.from({ length: Math.max(1, Math.floor(height)) }, (_, windowIndex) => (
              <mesh key={windowIndex} position={[0, 0.45 + windowIndex * 0.45, 0.611]}>
                <boxGeometry args={[0.22, 0.2, 0.025]} />
                <meshBasicMaterial color="#eaf6ff" />
              </mesh>
            ))}
          </group>
        );
      })}
      <Cloud position={[-7, 7, -24]} speed={0.12} opacity={0.75} />
      <Cloud position={[8, 8, -36]} speed={0.1} opacity={0.8} />

      {items.map((item) => (
        <group
          key={item.id}
          ref={(el) => { itemRefs.current[item.id] = el; }}
          position={[LANE_X[item.lane], 0, item.z]}
          visible={item.active}
        >
          {item.kind === 'coin'
            ? <Coin spin={(el) => { coinRefs.current[item.id] = el; }} />
            : <Obstacle kind={item.kind} />}
        </group>
      ))}
      <PlayerCharacter
        laneX={() => LANE_X[controls.lane.current]}
        jumping={() => jumpTime.current > 0}
        sliding={() => slideTime.current > 0}
        crashed={mode === 'gameOver'}
        rewarding={rewardAnim}
      />
    </>
  );
}

export default function GameCanvas({ onReady }: { onReady: () => void }) {
  const lane = useRef(1);
  const jumping = useRef(false);
  const sliding = useRef(false);
  useEffect(() => {
    const timer = window.setTimeout(onReady, 450);
    return () => window.clearTimeout(timer);
  }, [onReady]);

  useEffect(() => {
    const controls = {
      left: () => { lane.current = Math.max(0, lane.current - 1); },
      right: () => { lane.current = Math.min(2, lane.current + 1); },
      jump: () => { jumping.current = true; },
      slide: () => { sliding.current = true; },
    };
    (window as Window & { __ppControls?: typeof controls }).__ppControls = controls;
    return () => { delete (window as Window & { __ppControls?: typeof controls }).__ppControls; };
  }, []);

  return (
    <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <SceneWorld controls={{ lane, jumping, sliding }} />
    </Canvas>
  );
}
