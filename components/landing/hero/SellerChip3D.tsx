import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { Stage3DState } from '../primitives/Stage3D';

/**
 * Floating "seller/show" chip — gradient avatar circle + show name +
 * handle. Anchored to the lower-left of the stream window. Mid-depth
 * layer; parallaxes a moderate amount with the cursor.
 *
 * The avatar is procedural (a CanvasTexture with a 2-tone gradient and
 * initials) so we don't need a real photo asset for V1.
 */
function makeAvatarTexture(initials: string, a = '#C9923C', b = '#0B1F3F'): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  // Diagonal gradient
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // Initials
  ctx.fillStyle = '#F8F5F0';
  ctx.font = '600 110px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2 + 6);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface SellerChip3DProps {
  name?: string;
  handle?: string;
  initials?: string;
  stateRef: React.MutableRefObject<Stage3DState>;
  position?: [number, number, number];
  /** Scroll-driven Y lift. */
  scrollLiftY?: number;
}

export const SellerChip3D: React.FC<SellerChip3DProps> = ({
  name = 'Sneaker Vault',
  handle = '@kicksdaily',
  initials = 'SV',
  stateRef,
  position = [0.45, -1.05, 0.6],
  scrollLiftY = 0,
}) => {
  const group = useRef<THREE.Group>(null);
  const avatarTex = useMemo(() => makeAvatarTexture(initials), [initials]);

  useFrame((_, dt) => {
    if (!group.current) return;
    const { cursor } = stateRef.current;
    const tx = position[0] + cursor.x * 0.18;
    const ty = position[1] + -cursor.y * 0.10 + scrollLiftY;
    group.current.position.x += (tx - group.current.position.x) * Math.min(1, dt * 5);
    group.current.position.y += (ty - group.current.position.y) * Math.min(1, dt * 5);
    group.current.position.z = position[2];
  });

  const W = 1.30;
  const H = 0.46;
  const avatarSize = 0.34;

  return (
    <Float speed={0.6} rotationIntensity={0.05} floatIntensity={0.14} floatingRange={[-0.03, 0.03]}>
      <group ref={group} rotation={[0, 0.18, 0]}>
        {/* Chip body */}
        <RoundedBox args={[W, H, 0.05]} radius={0.05} smoothness={4} castShadow>
          <meshStandardMaterial color="#120A04" metalness={0.4} roughness={0.5} />
        </RoundedBox>

        {/* Inset face */}
        <mesh position={[0, 0, 0.026]}>
          <planeGeometry args={[W - 0.02, H - 0.025]} />
          <meshStandardMaterial color="#1B120A" roughness={0.55} metalness={0.25} />
        </mesh>

        {/* Avatar circle */}
        <mesh position={[-W / 2 + 0.27, 0, 0.028]}>
          <circleGeometry args={[avatarSize / 2, 32]} />
          <meshStandardMaterial map={avatarTex} roughness={0.5} />
        </mesh>

        {/* Tiny LIVE dot top-left of avatar */}
        <mesh position={[-W / 2 + 0.10, H / 2 - 0.10, 0.030]}>
          <circleGeometry args={[0.022, 16]} />
          <meshStandardMaterial color="#E63946" emissive="#E63946" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>

        {/* Show name */}
        <Text
          position={[-W / 2 + 0.52, 0.06, 0.030]}
          fontSize={0.10}
          color="#F8F5F0"
          anchorX="left"
          anchorY="middle"
          maxWidth={W - 0.6}
        >
          {name}
        </Text>

        {/* Handle */}
        <Text
          position={[-W / 2 + 0.52, -0.08, 0.030]}
          fontSize={0.062}
          color="#C9923C"
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.04}
        >
          {handle}
        </Text>
      </group>
    </Float>
  );
};

export default SellerChip3D;
