import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { Stage3DState } from '../primitives/Stage3D';

/**
 * Abstract "live show" panel — no photos, no product imagery.
 * Composed from R3F primitives only: dark glass slab, LIVE dot,
 * typography (drei Text), thin amber accent line, mono price text.
 *
 * Reads as a live-commerce UI panel floating in 3D space — multiple
 * instances at different depths give the hero its "control room"
 * feeling.
 */
interface AbstractLiveCardProps {
  show: string;
  category: string;
  price?: number;
  watching?: number;
  stateRef: React.MutableRefObject<Stage3DState>;
  position: [number, number, number];
  size?: 'sm' | 'md' | 'lg';
  parallaxMultiplier?: number;
  /** 0..1, drops the whole card's visual presence (for background cards). */
  opacity?: number;
  /** Resting Y rotation in radians. Tilts the card. */
  baseRotY?: number;
}

const SIZES = {
  sm: { W: 1.10, H: 0.58, name: 0.082, meta: 0.050, price: 0.088 },
  md: { W: 1.40, H: 0.72, name: 0.105, meta: 0.055, price: 0.108 },
  lg: { W: 1.70, H: 0.88, name: 0.125, meta: 0.062, price: 0.125 },
};

function fmtINR(n: number): string {
  const raw = Math.floor(Math.max(0, n)).toString();
  if (raw.length <= 3) return raw;
  const last3 = raw.slice(-3);
  const rest = raw.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return rest + ',' + last3;
}

export const AbstractLiveCard: React.FC<AbstractLiveCardProps> = ({
  show,
  category,
  price,
  watching,
  stateRef,
  position,
  size = 'md',
  parallaxMultiplier = 0.10,
  opacity = 1,
  baseRotY = -0.10,
}) => {
  const wrap = useRef<THREE.Group>(null);
  const s = SIZES[size];

  useFrame((_, dt) => {
    if (!wrap.current) return;
    const { cursor } = stateRef.current;
    const tx = position[0] + cursor.x * parallaxMultiplier;
    const ty = position[1] + -cursor.y * (parallaxMultiplier * 0.6);
    wrap.current.position.x += (tx - wrap.current.position.x) * Math.min(1, dt * 5);
    wrap.current.position.y += (ty - wrap.current.position.y) * Math.min(1, dt * 5);
    wrap.current.position.z = position[2];
  });

  return (
    <Float
      speed={0.55}
      rotationIntensity={0.04}
      floatIntensity={0.14}
      floatingRange={[-0.03, 0.03]}
    >
      <group ref={wrap} position={position} rotation={[0, baseRotY, 0]}>
        {/* Faint amber halo behind card */}
        <mesh position={[0, 0, -0.014]}>
          <planeGeometry args={[s.W + 0.5, s.H + 0.5]} />
          <meshBasicMaterial color="#C9923C" transparent opacity={0.05 * opacity} toneMapped={false} depthWrite={false} />
        </mesh>

        {/* Card body — dark glass slab */}
        <RoundedBox args={[s.W, s.H, 0.045]} radius={0.04} smoothness={4} castShadow>
          <meshStandardMaterial
            color="#100805"
            metalness={0.42}
            roughness={0.46}
            transparent
            opacity={0.94 * opacity}
          />
        </RoundedBox>

        {/* Inset face */}
        <mesh position={[0, 0, 0.024]}>
          <planeGeometry args={[s.W - 0.03, s.H - 0.04]} />
          <meshStandardMaterial color="#1A0F08" roughness={0.55} metalness={0.25} transparent opacity={opacity} />
        </mesh>

        {/* LIVE dot (top-left, emissive — bloom catches it) */}
        <mesh position={[-s.W / 2 + 0.10, s.H / 2 - 0.13, 0.026]}>
          <circleGeometry args={[0.022, 16]} />
          <meshStandardMaterial
            color="#E63946"
            emissive="#E63946"
            emissiveIntensity={1.8 * opacity}
            toneMapped={false}
          />
        </mesh>

        {/* LIVE label */}
        <Text
          position={[-s.W / 2 + 0.21, s.H / 2 - 0.13, 0.027]}
          fontSize={0.052}
          color="#F8F5F0"
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.18}
          fillOpacity={opacity}
        >
          LIVE
        </Text>

        {/* Watching count (top-right) */}
        {watching != null && (
          <Text
            position={[s.W / 2 - 0.10, s.H / 2 - 0.13, 0.027]}
            fontSize={0.048}
            color="#C9923C"
            anchorX="right"
            anchorY="middle"
            letterSpacing={0.10}
            fillOpacity={opacity}
          >
            {watching} WATCHING
          </Text>
        )}

        {/* Show name */}
        <Text
          position={[-s.W / 2 + 0.10, s.H / 2 - 0.30, 0.027]}
          fontSize={s.name}
          color="#F8F5F0"
          anchorX="left"
          anchorY="middle"
          maxWidth={s.W - 0.20}
          fillOpacity={opacity}
        >
          {show}
        </Text>

        {/* Category */}
        <Text
          position={[-s.W / 2 + 0.10, s.H / 2 - 0.30 - s.name - 0.06, 0.027]}
          fontSize={s.meta}
          color="#8C7A56"
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.12}
          fillOpacity={opacity}
        >
          {category.toUpperCase()}
        </Text>

        {/* Price row at bottom */}
        {price != null && (
          <>
            {/* faint amber accent line above price */}
            <mesh position={[-s.W / 2 + 0.10, -s.H / 2 + 0.22, 0.026]}>
              <planeGeometry args={[0.32, 0.0045]} />
              <meshStandardMaterial color="#C9923C" emissive="#C9923C" emissiveIntensity={1.0 * opacity} toneMapped={false} />
            </mesh>
            <Text
              position={[-s.W / 2 + 0.10, -s.H / 2 + 0.12, 0.027]}
              fontSize={s.price}
              color="#F8F5F0"
              anchorX="left"
              anchorY="middle"
              letterSpacing={0.03}
              fillOpacity={opacity}
            >
              ₹{fmtINR(price)}
            </Text>
          </>
        )}
      </group>
    </Float>
  );
};

export default AbstractLiveCard;
