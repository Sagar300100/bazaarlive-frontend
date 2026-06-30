import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

export interface Stage3DState {
  progress: number;
  cursor:   { x: number; y: number };
}

interface Stage3DProps {
  stateRef: React.MutableRefObject<Stage3DState>;
  cameraStart?: [number, number, number];
  cameraEnd?:   [number, number, number];
  fov?:         number;
  children:     React.ReactNode;
}

/**
 * Camera rig — interpolates camera position along scroll progress and
 * applies cursor parallax. Tilts the camera slightly downward as the
 * user scrolls so the stage ring on the floor becomes more visible.
 */
const CameraRig: React.FC<{
  stateRef: React.MutableRefObject<Stage3DState>;
  start: [number, number, number];
  end:   [number, number, number];
}> = ({ stateRef, start, end }) => {
  const camRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame(() => {
    const cam = camRef.current;
    if (!cam) return;
    const { progress, cursor } = stateRef.current;

    // Scroll-driven dolly
    cam.position.x = start[0] + (end[0] - start[0]) * progress;
    cam.position.y = start[1] + (end[1] - start[1]) * progress;
    cam.position.z = start[2] + (end[2] - start[2]) * progress;

    // Tilt down a touch as we push in — reveals the stage ring
    const baseTiltX = -0.06 + progress * -0.08;

    // Cursor parallax
    const targetRotY = cursor.x *  0.035;
    const targetRotX = baseTiltX + cursor.y * -0.020;
    cam.rotation.y += (targetRotY - cam.rotation.y) * 0.06;
    cam.rotation.x += (targetRotX - cam.rotation.x) * 0.06;
  });

  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      position={start}
      fov={36}
      near={0.1}
      far={60}
    />
  );
};

/**
 * Stage3D — shared canvas wrapper for the hero scene.
 *
 * Camera defaults match the new cinematic composition: starts at z=7.0
 * and dollies to z=4.2 over the pin. Bloom intensity bumped to 0.36 so
 * the stage ring + LIVE dots + price chip border read as glowing.
 */
export const Stage3D: React.FC<Stage3DProps> = ({
  stateRef,
  cameraStart = [0, 0.35, 5.2],
  cameraEnd   = [0, 0.55, 3.2],
  fov         = 38,
  children,
}) => {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ position: cameraStart, fov }}
      shadows
    >
      <CameraRig stateRef={stateRef} start={cameraStart} end={cameraEnd} />

      {/* Low ambient — scene is dark cinematic but enough to lift edges */}
      <ambientLight intensity={0.32} />

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <Suspense fallback={null}>{children}</Suspense>

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.36}
          luminanceThreshold={0.72}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.6}
        />
      </EffectComposer>
    </Canvas>
  );
};

export default Stage3D;
