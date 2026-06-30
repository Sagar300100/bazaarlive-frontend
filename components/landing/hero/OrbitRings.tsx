import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Stage3DState } from '../primitives/Stage3D';

/**
 * Thin orbit lines that surround the stage cluster — gives the hero
 * abstract depth and a subtle "this is a system" feeling without
 * resorting to particles, shaders, or photographs.
 *
 *   - Floor ring: amber, on the ground plane, slow z-rotation
 *   - Mid orbit: tilted, ivory low-opacity
 *   - Vertical orbit: amber, very faint
 *
 * Cursor parallax: rings respond gently, less than foreground elements.
 */
export const OrbitRings: React.FC<{
  center?: [number, number, number];
  stateRef?: React.MutableRefObject<Stage3DState>;
}> = ({ center = [1.30, 0, 0], stateRef }) => {
  const group = useRef<THREE.Group>(null);
  const floorRing = useRef<THREE.Mesh>(null);
  const midRing = useRef<THREE.Mesh>(null);
  const vertRing = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (floorRing.current) floorRing.current.rotation.z += dt * 0.04;
    if (midRing.current)   midRing.current.rotation.z   -= dt * 0.018;
    if (vertRing.current)  vertRing.current.rotation.y  += dt * 0.012;

    if (group.current && stateRef) {
      const { cursor } = stateRef.current;
      const tx = center[0] + cursor.x * 0.05;
      const ty = center[1] + -cursor.y * 0.03;
      group.current.position.x += (tx - group.current.position.x) * Math.min(1, dt * 4);
      group.current.position.y += (ty - group.current.position.y) * Math.min(1, dt * 4);
      group.current.position.z = center[2];
    }
  });

  return (
    <group ref={group} position={center}>
      {/* Floor ring — amber, prominent */}
      <mesh ref={floorRing} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.18, 0]}>
        <torusGeometry args={[1.55, 0.005, 8, 128]} />
        <meshBasicMaterial color="#C9923C" transparent opacity={0.55} toneMapped={false} />
      </mesh>

      {/* Mid orbit — tilted, ivory faint */}
      <mesh ref={midRing} rotation={[Math.PI * 0.42, 0, 0.35]}>
        <torusGeometry args={[2.10, 0.003, 8, 128]} />
        <meshBasicMaterial color="#F8F5F0" transparent opacity={0.14} toneMapped={false} />
      </mesh>

      {/* Vertical orbit — amber, very faint depth marker */}
      <mesh ref={vertRing} rotation={[0, 0.3, Math.PI / 2]}>
        <torusGeometry args={[2.55, 0.0028, 8, 128]} />
        <meshBasicMaterial color="#C9923C" transparent opacity={0.08} toneMapped={false} />
      </mesh>
    </group>
  );
};

export default OrbitRings;
