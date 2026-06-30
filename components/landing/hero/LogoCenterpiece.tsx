import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Stage3DState } from '../primitives/Stage3D';

/**
 * The logo as the hero centerpiece — a premium glowing brand stage.
 *
 *   - The wordmark logo.png is rendered on a textured plane (alpha-aware)
 *   - A soft blue halo sits behind it (additive sprite, big radius)
 *   - Three thin electric-blue orbital rings rotate around the base
 *   - Small floating particles drift through the scene (procedural)
 *
 * No product photos. No abstract slabs. The composition is pure brand:
 * the A logo, glowing on a stage of blue light. Cursor parallax tilts
 * the whole group.
 */

function makeParticleTexture(): THREE.CanvasTexture {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0,   'rgba(180, 220, 255, 1)');
  g.addColorStop(0.4, 'rgba(120, 180, 255, 0.55)');
  g.addColorStop(1,   'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeHaloTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size/2, size/2, size*0.10, size/2, size/2, size*0.50);
  g.addColorStop(0,    'rgba(107, 182, 255, 0.55)');
  g.addColorStop(0.35, 'rgba(74, 143, 229, 0.30)');
  g.addColorStop(1,    'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const ParticleField: React.FC<{ count?: number }> = ({ count = 80 }) => {
  const points = useRef<THREE.Points>(null);
  const tex = useMemo(makeParticleTexture, []);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i*3]   = (Math.random() - 0.5) * 8;
      arr[i*3+1] = (Math.random() - 0.5) * 5;
      arr[i*3+2] = (Math.random() - 0.5) * 4 - 0.5;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    const t = state.clock.elapsedTime;
    const attr = points.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i*3+1] += Math.sin(t * 0.18 + i) * 0.0008;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.075}
        map={tex}
        transparent
        depthWrite={false}
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
};

export const LogoCenterpiece: React.FC<{
  stateRef: React.MutableRefObject<Stage3DState>;
  basePosition?: [number, number, number];
}> = ({ stateRef, basePosition = [1.30, 0.10, 0] }) => {
  const group = useRef<THREE.Group>(null);
  const ringPrimary  = useRef<THREE.Mesh>(null);
  const ringOuter    = useRef<THREE.Mesh>(null);
  const ringFaint    = useRef<THREE.Mesh>(null);

  const logoTex = useTexture('/assets/brand/any_all_A_mark_transparent.png');
  const haloTex = useMemo(makeHaloTexture, []);

  React.useEffect(() => {
    logoTex.colorSpace = THREE.SRGBColorSpace;
    logoTex.anisotropy = 16;
  }, [logoTex]);

  useFrame((_, dt) => {
    if (!group.current) return;
    const { cursor } = stateRef.current;

    // Tilt the group with cursor
    const targetY =  cursor.x *  0.22;
    const targetX = -cursor.y *  0.12;
    group.current.rotation.y += (targetY - group.current.rotation.y) * Math.min(1, dt * 4);
    group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, dt * 4);

    // Orbital rings — slow continuous motion
    if (ringPrimary.current) ringPrimary.current.rotation.z += dt * 0.07;
    if (ringOuter.current)   ringOuter.current.rotation.z   -= dt * 0.045;
    if (ringFaint.current)   ringFaint.current.rotation.y   += dt * 0.03;
  });

  return (
    <group ref={group} position={basePosition}>
      {/* Soft glow halo behind logo */}
      <mesh position={[0, 0.05, -0.4]}>
        <planeGeometry args={[5.2, 5.2]} />
        <meshBasicMaterial map={haloTex} transparent toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Logo plane — gentle Float for life, no rotation (brand mark stays upright) */}
      <Float
        speed={0.55}
        rotationIntensity={0.03}
        floatIntensity={0.18}
        floatingRange={[-0.04, 0.04]}
      >
        <mesh>
          <planeGeometry args={[2.6, 2.6]} />
          <meshBasicMaterial
            map={logoTex}
            transparent
            toneMapped={false}
            depthWrite={false}
            alphaTest={0.05}
          />
        </mesh>
      </Float>

      {/* Orbital ring — primary horizontal (slightly tilted) */}
      <mesh ref={ringPrimary} rotation={[Math.PI / 2.15, 0, 0]} position={[0, -1.05, 0]}>
        <torusGeometry args={[1.95, 0.018, 16, 128]} />
        <meshStandardMaterial
          color="#4A8FE5"
          emissive="#4A8FE5"
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>

      {/* Orbital ring — outer, electric-blue accent */}
      <mesh ref={ringOuter} rotation={[Math.PI / 2.35, 0.18, 0]} position={[0, -1.05, 0]}>
        <torusGeometry args={[2.30, 0.008, 12, 128]} />
        <meshBasicMaterial color="#6BB6FF" transparent opacity={0.62} toneMapped={false} />
      </mesh>

      {/* Orbital ring — faint, large depth marker */}
      <mesh ref={ringFaint} rotation={[Math.PI / 2.5, -0.10, 0]} position={[0, -1.05, 0]}>
        <torusGeometry args={[2.80, 0.005, 8, 128]} />
        <meshBasicMaterial color="#4A8FE5" transparent opacity={0.22} toneMapped={false} />
      </mesh>

      {/* Subtle floating particles around the scene */}
      <ParticleField count={70} />
    </group>
  );
};

export default LogoCenterpiece;
