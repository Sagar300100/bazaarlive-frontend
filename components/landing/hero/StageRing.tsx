import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Stage3DState } from '../primitives/Stage3D';

/**
 * Amber glowing stage ring on the floor under the stream window.
 * Accepts a `basePosition` so the hero can shift the whole stage
 * (ring + stream + shadow) into the right half of the frame for the
 * full-bleed layout.
 */
export const StageRing: React.FC<{
  stateRef: React.MutableRefObject<Stage3DState>;
  basePosition?: [number, number, number];
}> = ({ stateRef, basePosition = [0, -1.15, -0.4] }) => {
  const group = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (!group.current) return;
    const { cursor } = stateRef.current;
    const tx = basePosition[0] + cursor.x * 0.04;
    const ty = basePosition[1] + cursor.y * 0.02;
    group.current.position.x += (tx - group.current.position.x) * Math.min(1, dt * 4);
    group.current.position.y += (ty - group.current.position.y) * Math.min(1, dt * 4);
    group.current.position.z = basePosition[2];
  });

  return (
    <group ref={group} position={basePosition} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Outer ring — main glowing torus */}
      <mesh>
        <torusGeometry args={[1.25, 0.018, 14, 96]} />
        <meshStandardMaterial
          color="#C9923C"
          emissive="#C9923C"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>

      {/* Inner halo disk */}
      <mesh position={[0, 0, 0.012]}>
        <ringGeometry args={[0.4, 1.22, 96]} />
        <meshBasicMaterial
          color="#C9923C"
          transparent
          opacity={0.18}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Outer haze */}
      <mesh position={[0, 0, 0.005]}>
        <ringGeometry args={[1.20, 1.85, 64]} />
        <meshBasicMaterial
          color="#C9923C"
          transparent
          opacity={0.07}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export default StageRing;
