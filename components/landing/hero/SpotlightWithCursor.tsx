import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Stage3DState } from '../primitives/Stage3D';

/**
 * Spotlight that follows the cursor — illuminates the stream window
 * from above, casts a real shadow on the floor that shifts as you
 * move the mouse. Tuned warm so it reinforces the espresso scene tone.
 *
 * Also adds a cooler rim light from behind-right to keep the bezels
 * of the foreground chips legible against the dark backdrop.
 */
export const SpotlightWithCursor: React.FC<{
  stateRef: React.MutableRefObject<Stage3DState>;
}> = ({ stateRef }) => {
  const spotRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  useFrame(() => {
    const spot = spotRef.current;
    const target = targetRef.current;
    if (!spot || !target) return;

    const { cursor } = stateRef.current;
    target.position.x = cursor.x * 1.0;
    target.position.y = -cursor.y * 0.6;
    target.position.z = 0;
    target.updateMatrixWorld();

    if (spot.target !== target) {
      spot.target = target;
    }
  });

  return (
    <>
      <primitive object={targetRef.current} />

      {/* Key warm spotlight — follows cursor */}
      <spotLight
        ref={spotRef}
        position={[1.6, 4.0, 3.2]}
        angle={0.62}
        penumbra={0.88}
        intensity={4.6}
        distance={16}
        decay={1.6}
        color="#FFE6B5"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0008}
      />

      {/* Rim light — cool, low, defines the edges of foreground chips */}
      <directionalLight
        position={[-3.5, 1.0, 3.0]}
        intensity={0.40}
        color="#9FB8E6"
      />

      {/* Fill from below — warm, low intensity, lifts the bottom of the scene */}
      <pointLight position={[0, -0.6, 2.4]} intensity={0.35} color="#C9923C" distance={6} decay={1.8} />
    </>
  );
};

export default SpotlightWithCursor;
