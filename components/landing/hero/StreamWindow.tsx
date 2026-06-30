import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, RoundedBox, useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Stage3DState } from '../primitives/Stage3D';

/**
 * Live stream window — the hero subject. 9:16 portrait with a chrome
 * bar (LIVE dot + watcher count) and the featured product photograph
 * as the stream content.
 *
 * Accepts a `basePosition` for the full-bleed layout (we push the
 * whole composition to the right side of the frame so editorial copy
 * can sit on the left without fighting the 3D).
 */
const DEFAULT_PRODUCT =
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80&auto=format&fit=crop';

interface StreamWindowProps {
  src?: string;
  scale?: number;
  stateRef: React.MutableRefObject<Stage3DState>;
  watchers?: number;
  basePosition?: [number, number, number];
}

export const StreamWindow: React.FC<StreamWindowProps> = ({
  src = DEFAULT_PRODUCT,
  scale = 1,
  stateRef,
  watchers = 2147,
  basePosition = [0, 0, 0],
}) => {
  const wrap = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const texture = useTexture(src);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
  }, [texture]);

  const watcherLabel = useMemo(() => {
    if (watchers >= 1000) return (watchers / 1000).toFixed(1) + 'K WATCHING';
    return watchers + ' WATCHING';
  }, [watchers]);

  useFrame((state, dt) => {
    if (inner.current) {
      // Stream faces the viewer; never spins 360° (it IS a video feed).
      const t = state.clock.elapsedTime;
      inner.current.rotation.y = Math.sin(t * 0.45) * 0.08;
    }
    if (wrap.current) {
      const { cursor } = stateRef.current;
      // Midground parallax — modest cursor follow around base position
      const tx = basePosition[0] + cursor.x * 0.10;
      const ty = basePosition[1] + -cursor.y * 0.06;
      wrap.current.position.x += (tx - wrap.current.position.x) * Math.min(1, dt * 5);
      wrap.current.position.y += (ty - wrap.current.position.y) * Math.min(1, dt * 5);
      wrap.current.position.z = basePosition[2];

      const next = wrap.current.scale.x + (scale - wrap.current.scale.x) * Math.min(1, dt * 4);
      wrap.current.scale.setScalar(next);
    }
  });

  const W = 1.55;
  const H = 2.65;
  const D = 0.09;
  const CHROME_H = 0.22;

  return (
    <group ref={wrap} position={basePosition}>
      <Float
        speed={0.7}
        rotationIntensity={0.04}
        floatIntensity={0.16}
        floatingRange={[-0.04, 0.04]}
      >
        <group ref={inner}>
          {/* Bezel */}
          <RoundedBox args={[W + 0.06, H + 0.06, D]} radius={0.04} smoothness={4} castShadow>
            <meshStandardMaterial color="#0A0604" metalness={0.5} roughness={0.42} />
          </RoundedBox>

          {/* Stream content area — basic material so the photo always reads */}
          <mesh position={[0, -CHROME_H / 2, D / 2 + 0.001]}>
            <planeGeometry args={[W - 0.02, H - 0.02 - CHROME_H]} />
            <meshBasicMaterial map={texture} toneMapped={false} />
          </mesh>

          {/* Chrome bar */}
          <mesh position={[0, H / 2 - CHROME_H / 2 - 0.01, D / 2 + 0.002]}>
            <planeGeometry args={[W - 0.02, CHROME_H]} />
            <meshStandardMaterial color="#0E0905" roughness={0.35} metalness={0.6} />
          </mesh>

          {/* LIVE dot */}
          <mesh position={[-W / 2 + 0.13, H / 2 - CHROME_H / 2 - 0.01, D / 2 + 0.005]}>
            <circleGeometry args={[0.024, 24]} />
            <meshStandardMaterial
              color="#E63946"
              emissive="#E63946"
              emissiveIntensity={1.8}
              toneMapped={false}
            />
          </mesh>

          {/* LIVE text */}
          <Text
            position={[-W / 2 + 0.27, H / 2 - CHROME_H / 2 - 0.01, D / 2 + 0.005]}
            fontSize={0.06}
            color="#F8F5F0"
            anchorX="left"
            anchorY="middle"
            letterSpacing={0.18}
          >
            LIVE
          </Text>

          {/* Watcher count */}
          <Text
            position={[W / 2 - 0.05, H / 2 - CHROME_H / 2 - 0.01, D / 2 + 0.005]}
            fontSize={0.052}
            color="#C9923C"
            anchorX="right"
            anchorY="middle"
            letterSpacing={0.14}
          >
            {watcherLabel}
          </Text>

          {/* Back face */}
          <mesh position={[0, 0, -D / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[W, H]} />
            <meshStandardMaterial color="#0B1F3F" roughness={0.7} />
          </mesh>
        </group>
      </Float>
    </group>
  );
};

export default StreamWindow;
