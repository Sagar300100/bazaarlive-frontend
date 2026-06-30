import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Stage3DState } from '../primitives/Stage3D';

/**
 * Background depth layer — small ticker fragments showing OTHER live
 * shows, drifting slowly across the back of the scene. They're far
 * away, low-opacity, and barely move with the cursor (background
 * layers in real depth should respond least to parallax).
 *
 * These exist purely for "the marketplace is alive" energy — the user
 * sees there are other shows happening even before they scroll.
 */
interface BgTicker {
  text: string;
  /** Starting X position (animates left across the scene). */
  startX: number;
  y: number;
  z: number;
  speed: number;
  amber?: boolean;
}

const TICKERS: BgTicker[] = [
  { text: 'RAMP & RANG   ·   NEW DROP   ·   ₹2,400',  startX:  4.2,  y:  1.20, z: -2.4, speed: 0.18 },
  { text: 'SUMI\'S SAREES   ·   SOLD   ·   ₹3,200',    startX:  6.5,  y: -0.40, z: -2.6, speed: 0.14, amber: true },
  { text: 'WATCH HUB   ·   LIVE BID   ·   ₹14,000',    startX:  5.0,  y:  0.40, z: -2.2, speed: 0.22 },
  { text: 'VINYL CIRCLE   ·   89 WATCHING',            startX:  7.8,  y: -1.10, z: -2.5, speed: 0.16 },
];

const TickerLine: React.FC<{ data: BgTicker; stateRef: React.MutableRefObject<Stage3DState> }> = ({ data, stateRef }) => {
  const ref = useRef<THREE.Group>(null);
  const xRef = useRef(data.startX);

  useFrame((_, dt) => {
    if (!ref.current) return;
    // Drift left
    xRef.current -= dt * data.speed;
    // Wrap around when off-screen
    if (xRef.current < -8) xRef.current = 8;

    // Background parallax — barely moves with cursor
    const { cursor } = stateRef.current;
    ref.current.position.x = xRef.current + cursor.x * 0.05;
    ref.current.position.y = data.y + -cursor.y * 0.03;
    ref.current.position.z = data.z;
  });

  return (
    <group ref={ref}>
      <Text
        fontSize={0.085}
        color={data.amber ? '#8C6628' : '#5A4828'}
        anchorX="left"
        anchorY="middle"
        letterSpacing={0.12}
        maxWidth={6}
      >
        {data.text}
      </Text>
    </group>
  );
};

export const BackgroundTickerCards: React.FC<{
  stateRef: React.MutableRefObject<Stage3DState>;
}> = ({ stateRef }) => {
  return (
    <group>
      {TICKERS.map((t, i) => (
        <TickerLine key={i} data={t} stateRef={stateRef} />
      ))}
    </group>
  );
};

export default BackgroundTickerCards;
