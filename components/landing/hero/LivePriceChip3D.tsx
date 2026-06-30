import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { Stage3DState } from '../primitives/Stage3D';

/**
 * Foreground floating chip showing the live bid/price next to the
 * stream window. Mono-typed price with amber-emissive border, tilted
 * slightly toward the camera. Updates in real time.
 *
 * Closest layer in the scene — so it parallaxes the most with cursor
 * movement (Lusion-style depth response).
 */
function fmtINR(n: number): string {
  // Simple Indian comma format
  const raw = Math.floor(Math.max(0, n)).toString();
  if (raw.length <= 3) return raw;
  const last3 = raw.slice(-3);
  const rest = raw.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return rest + ',' + last3;
}

export const LivePriceChip3D: React.FC<{
  value: number;
  stateRef: React.MutableRefObject<Stage3DState>;
  /** Base position. Hero passes this to anchor relative to the stream. */
  position?: [number, number, number];
  /** Scroll-driven X offset (chip drifts toward viewer as scroll advances). */
  scrollOffsetX?: number;
}> = ({ value, stateRef, position = [2.65, 0.95, 0.7], scrollOffsetX = 0 }) => {
  const group = useRef<THREE.Group>(null);
  const lastValue = useRef(value);
  const flashRef = useRef(0);

  // Track value changes to flash the chip
  React.useEffect(() => {
    if (value !== lastValue.current) {
      flashRef.current = 1;
      lastValue.current = value;
    }
  }, [value]);

  useFrame((_, dt) => {
    if (!group.current) return;
    const { cursor } = stateRef.current;
    const tx = position[0] + scrollOffsetX + cursor.x * 0.22;
    const ty = position[1] + -cursor.y * 0.14;
    group.current.position.x += (tx - group.current.position.x) * Math.min(1, dt * 5);
    group.current.position.y += (ty - group.current.position.y) * Math.min(1, dt * 5);
    group.current.position.z = position[2];

    // Decay the flash
    if (flashRef.current > 0) {
      flashRef.current = Math.max(0, flashRef.current - dt * 1.6);
    }
  });

  const display = '₹' + fmtINR(value) + '  ▲';
  const W = 1.05;
  const H = 0.30;

  return (
    <Float speed={0.9} rotationIntensity={0.08} floatIntensity={0.20} floatingRange={[-0.04, 0.04]}>
      <group ref={group} rotation={[0, -0.25, 0]}>
        {/* Glow halo behind chip — boosted intensity reads through bloom */}
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[W + 0.5, H + 0.5]} />
          <meshBasicMaterial color="#C9923C" transparent opacity={0.16} toneMapped={false} depthWrite={false} />
        </mesh>

        {/* Chip body — slate, with subtle metallic */}
        <RoundedBox args={[W, H, 0.05]} radius={0.06} smoothness={4} castShadow>
          <meshStandardMaterial color="#0A0604" metalness={0.45} roughness={0.45} />
        </RoundedBox>

        {/* Inset front — slight inner colour */}
        <mesh position={[0, 0, 0.026]}>
          <planeGeometry args={[W - 0.03, H - 0.04]} />
          <meshStandardMaterial color="#150F08" roughness={0.5} metalness={0.3} />
        </mesh>

        {/* Amber rim — emissive line above the body */}
        <mesh position={[0, -H / 2 + 0.005, 0.028]}>
          <planeGeometry args={[W - 0.04, 0.012]} />
          <meshStandardMaterial color="#C9923C" emissive="#C9923C" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>

        {/* Mono price text */}
        <Text
          position={[0, 0, 0.030]}
          fontSize={0.115}
          color="#F8F5F0"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.04}
        >
          {display}
        </Text>
      </group>
    </Float>
  );
};

export default LivePriceChip3D;
