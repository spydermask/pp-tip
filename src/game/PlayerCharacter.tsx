import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type PlayerCharacterProps = {
  laneX: number | (() => number);
  jumping: boolean | (() => boolean);
  sliding: boolean | (() => boolean);
  crashed: boolean;
  rewarding: boolean;
};

const white = '#f8fbff';
const ink = '#101927';
const teal = '#17c7cf';

/** A polished, original PP mascot built from lightweight procedural geometry. */
export default function PlayerCharacter({ laneX, jumping, sliding, crashed, rewarding }: PlayerCharacterProps) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const jetGlow = useRef<THREE.Group>(null);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.035);
    if (!root.current) return;
    const t = clock.elapsedTime;
    const laneTarget = typeof laneX === 'function' ? laneX() : laneX;
    const isJumping = typeof jumping === 'function' ? jumping() : jumping;
    const isSliding = typeof sliding === 'function' ? sliding() : sliding;
    const targetY = crashed ? -0.24 : isJumping ? 1.05 : isSliding ? 0.02 : 0.04;
    const bounce = isJumping ? Math.sin(t * 7) * 0.045 : isSliding ? 0 : Math.abs(Math.sin(t * 12.5)) * 0.045;

    root.current.position.x = THREE.MathUtils.damp(root.current.position.x, laneTarget, 14, dt);
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, targetY + bounce, 12, dt);
    root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z,
      crashed ? -0.82 : rewarding ? Math.sin(t * 8) * 0.1 : (laneTarget - root.current.position.x) * 0.11, 8, dt);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, isSliding ? -0.16 : 0, 10, dt);
    if (torso.current) {
      torso.current.position.y = THREE.MathUtils.damp(torso.current.position.y, isSliding ? 0.8 : 1.23, 12, dt);
      torso.current.scale.y = THREE.MathUtils.damp(torso.current.scale.y, isSliding ? 0.82 : 1, 12, dt);
    }
    if (head.current) {
      head.current.position.y = THREE.MathUtils.damp(head.current.position.y, isSliding ? 1.12 : 2.02, 12, dt);
      head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, isSliding ? 0.35 : Math.sin(t * 3) * 0.025, 8, dt);
      head.current.scale.y = THREE.MathUtils.damp(head.current.scale.y, isSliding ? 0.82 : 1, 10, dt);
    }
    const swing = isSliding || crashed ? 0 : Math.sin(t * 13.5) * 0.66;
    if (leftArm.current) leftArm.current.rotation.x = THREE.MathUtils.damp(leftArm.current.rotation.x, isSliding ? -1.2 : swing, 12, dt);
    if (rightArm.current) rightArm.current.rotation.x = THREE.MathUtils.damp(rightArm.current.rotation.x, isSliding ? -1.2 : -swing, 12, dt);
    if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.damp(leftLeg.current.rotation.x, isJumping ? -0.72 : isSliding ? 0.72 : -swing, 12, dt);
    if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.damp(rightLeg.current.rotation.x, isJumping ? 0.35 : isSliding ? 0.72 : swing, 12, dt);
    if (jetGlow.current) {
      jetGlow.current.visible = rewarding;
      jetGlow.current.scale.setScalar(0.9 + Math.sin(t * 18) * 0.12);
    }
  });

  return (
    <group ref={root} position={[0, 0, 0]}>
      {/* soft contact shadow */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.72, 0.42, 1]}>
        <circleGeometry args={[1, 24]} />
        <meshBasicMaterial color="#101c2b" transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* body / sporty jacket */}
      <group ref={torso} position={[0, 1.23, 0]}>
        <mesh castShadow scale={[0.43, 0.52, 0.32]}>
          <capsuleGeometry args={[0.34, 0.38, 5, 12]} />
          <meshStandardMaterial color="#202b3d" roughness={0.52} metalness={0.06} />
        </mesh>
        <mesh position={[0, 0.04, 0.294]} scale={[0.27, 0.34, 0.035]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={teal} roughness={0.36} metalness={0.12} />
        </mesh>
        <mesh position={[0, -0.23, 0.31]}>
          <boxGeometry args={[0.23, 0.055, 0.025]} />
          <meshStandardMaterial color="#eafcff" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.23, 0.31]}>
          <sphereGeometry args={[0.09, 14, 10]} />
          <meshStandardMaterial color="#f5feff" emissive={teal} emissiveIntensity={0.18} />
        </mesh>
        <mesh position={[0, 0.47, 0]}>
          <torusGeometry args={[0.16, 0.035, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#101927" roughness={0.8} />
        </mesh>
      </group>

      {/* oversized white PP head, with glasses, smile and signature antenna */}
      <group ref={head} position={[0, 2.02, 0]}>
        <mesh castShadow scale={[0.62, 0.59, 0.53]}>
          <sphereGeometry args={[1, 32, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.24} metalness={0.015} />
        </mesh>
        {/* glossy frames */}
        <mesh position={[0, 0.085, 0.475]} scale={[0.53, 0.205, 0.075]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#070d17" roughness={0.19} metalness={0.18} />
        </mesh>
        {[-0.225, 0.225].map((x) => (
          <group key={x} position={[x, 0.085, 0.526]}>
            <mesh scale={[0.215, 0.155, 0.055]}>
              <sphereGeometry args={[1, 20, 14]} />
              <meshStandardMaterial color="#101a2a" roughness={0.12} metalness={0.28} />
            </mesh>
            <mesh position={[-0.055, 0.045, 0.048]} scale={[0.045, 0.018, 0.008]} rotation={[0, 0, -0.4]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="#b8f7ff" />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.085, 0.535]} scale={[0.055, 0.035, 0.04]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#070d17" />
        </mesh>
        {/* curved smile */}
        <mesh position={[0, -0.19, 0.48]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.135, 0.022, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#172235" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.22, 0.482]} scale={[0.08, 0.025, 0.012]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#ff7f91" roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.68, 0]} rotation={[0, 0, -0.1]}>
          <cylinderGeometry args={[0.035, 0.048, 0.34, 12]} />
          <meshStandardMaterial color={ink} metalness={0.25} roughness={0.32} />
        </mesh>
        <mesh position={[-0.018, 0.88, 0]}>
          <sphereGeometry args={[0.105, 18, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.18} emissive="#d9ffff" emissiveIntensity={0.12} />
        </mesh>
      </group>

      {/* articulated arms, gloves and cuffs */}
      <group ref={leftArm} position={[-0.43, 1.39, 0]}>
        <mesh castShadow position={[0, -0.18, 0]} rotation={[0, 0, -0.25]}>
          <capsuleGeometry args={[0.125, 0.34, 5, 10]} />
          <meshStandardMaterial color={white} roughness={0.3} />
        </mesh>
        <mesh position={[-0.015, -0.39, 0.035]}>
          <sphereGeometry args={[0.135, 16, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.26} />
        </mesh>
        <mesh position={[0, -0.29, 0]} rotation={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.126, 0.126, 0.075, 12]} />
          <meshStandardMaterial color={teal} roughness={0.4} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.43, 1.39, 0]}>
        <mesh castShadow position={[0, -0.18, 0]} rotation={[0, 0, 0.25]}>
          <capsuleGeometry args={[0.125, 0.34, 5, 10]} />
          <meshStandardMaterial color={white} roughness={0.3} />
        </mesh>
        <mesh position={[0.015, -0.39, 0.035]}>
          <sphereGeometry args={[0.135, 16, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.26} />
        </mesh>
        <mesh position={[0, -0.29, 0]} rotation={[0, 0, 0.25]}>
          <cylinderGeometry args={[0.126, 0.126, 0.075, 12]} />
          <meshStandardMaterial color={teal} roughness={0.4} />
        </mesh>
      </group>

      {/* legs, bright running shoes and visible soles */}
      <group ref={leftLeg} position={[-0.205, 0.66, 0]}>
        <mesh castShadow position={[0, -0.19, 0]}>
          <capsuleGeometry args={[0.135, 0.34, 5, 10]} />
          <meshStandardMaterial color="#e8eef5" roughness={0.48} />
        </mesh>
        <mesh position={[0, -0.43, 0.095]} scale={[0.205, 0.115, 0.29]} castShadow>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial color="#f8fbff" roughness={0.26} />
        </mesh>
        <mesh position={[0, -0.505, 0.105]} scale={[0.19, 0.035, 0.275]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshStandardMaterial color={teal} roughness={0.5} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.205, 0.66, 0]}>
        <mesh castShadow position={[0, -0.19, 0]}>
          <capsuleGeometry args={[0.135, 0.34, 5, 10]} />
          <meshStandardMaterial color="#e8eef5" roughness={0.48} />
        </mesh>
        <mesh position={[0, -0.43, 0.095]} scale={[0.205, 0.115, 0.29]} castShadow>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial color="#f8fbff" roughness={0.26} />
        </mesh>
        <mesh position={[0, -0.505, 0.105]} scale={[0.19, 0.035, 0.275]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshStandardMaterial color={teal} roughness={0.5} />
        </mesh>
      </group>

      {/* short reward burst; hidden outside reward animation */}
      <group ref={jetGlow} visible={false} position={[0, 1.05, -0.48]}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.26, 0.9, 12]} />
          <meshBasicMaterial color="#5cf3ff" transparent opacity={0.72} />
        </mesh>
        <mesh position={[0, -0.42, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.13, 0.55, 10]} />
          <meshBasicMaterial color="#ffcf61" transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
}
