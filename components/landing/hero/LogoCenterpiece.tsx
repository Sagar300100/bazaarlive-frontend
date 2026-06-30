import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Stage3DState } from '../primitives/Stage3D';

/**
 * The A mark as the hero centerpiece — animated brand stage.
 *
 * Motion choreography (the logo must visibly read as ALIVE):
 *   • Logo plane swings ±8° Y on a slow sine wave (3.5s period) so the
 *     eye perceives 3D rotation without ever showing the back face.
 *   • Strong <Float> — clear breathing in/out + small X tilt.
 *   • Halo behind the logo PULSES — opacity sine 0.35..0.85 over 2.4s,
 *     scale 0.95..1.10. Reads as a heartbeat glow.
 *   • Three orbital rings rotate at distinct speeds and axes.
 *   • Cursor tilts the whole group with damped lerp.
 *   • 80 additive particles drift vertically.
 *
 * The user asked: "the motion one which has motion logo in the front."
 * That's THIS — clearly animated, not a still PNG.
 */

function makeParticleTexture(): THREE.CanvasTexture {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0,   'rgba(200, 230, 255, 1)');
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
  const g = ctx.createRadialGradient(size/2, size/2, size*0.08, size/2, size/2, size*0.50);
  g.addColorStop(0,    'rgba(140, 200, 255, 0.85)');
  g.addColorStop(0.30, 'rgba(74, 143, 229, 0.45)');
  g.addColorStop(0.70, 'rgba(43, 108, 184, 0.15)');
  g.addColorStop(1,    'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const ParticleField: React.FC<{ count?: number }> = ({ count = 90 }) => {
  const points = useRef<THREE.Points>(null);
  const tex = useMemo(makeParticleTexture, []);

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds    = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i*3]   = (Math.random() - 0.5) * 8;
      positions[i*3+1] = (Math.random() - 0.5) * 5;
      positions[i*3+2] = (Math.random() - 0.5) * 4 - 0.5;
      speeds[i] = 0.06 + Math.random() * 0.18;
    }
    return { positions, speeds };
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    const t = state.clock.elapsedTime;
    const attr = points.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i*3+1] += Math.sin(t * speeds[i] + i) * 0.0014;
      arr[i*3]   += Math.cos(t * speeds[i] * 0.7 + i) * 0.0008;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.085}
        map={tex}
        transparent
        depthWrite={false}
        opacity={0.95}
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
  const group       = useRef<THREE.Group>(null);
  const logoSwing   = useRef<THREE.Group>(null);
  const halo        = useRef<THREE.Mesh>(null);
  const haloMat     = useRef<THREE.MeshBasicMaterial>(null);
  const ringPrimary = useRef<THREE.Mesh>(null);
  const ringOuter   = useRef<THREE.Mesh>(null);
  const ringFaint   = useRef<THREE.Mesh>(null);

  const logoTex = useTexture('/assets/brand/any_all_A_mark_transparent.png');
  const haloTex = useMemo(makeHaloTexture, []);

  React.useEffect(() => {
    logoTex.colorSpace = THREE.SRGBColorSpace;
    logoTex.anisotropy = 16;
  }, [logoTex]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;

    // ── Group: cursor parallax tilt
    if (group.current) {
      const { cursor } = stateRef.current;
      const targetY =  cursor.x *  0.22;
      const targetX = -cursor.y *  0.12;
      group.current.rotation.y += (targetY - group.current.rotation.y) * Math.min(1, dt * 4);
      group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, dt * 4);
    }

    // ── Logo: slow ±8° Y swing on a sine wave + tiny X bob
    if (logoSwing.current) {
      logoSwing.current.rotation.y = Math.sin(t * 1.80) * 0.14;   // ±8°
      logoSwing.current.rotation.x = Math.sin(t * 1.20) * 0.04;
      logoSwing.current.position.y = Math.sin(t * 1.45) * 0.06;   // gentle bob
    }

    // ── Halo: pulse opacity + scale (heartbeat)
    if (halo.current && haloMat.current) {
      const pulse = (Math.sin(t * 2.6) + 1) * 0.5;           // 0..1
      haloMat.current.opacity = 0.40 + pulse * 0.45;          // 0.40..0.85
      const s = 0.95 + pulse * 0.15;                          // 0.95..1.10
      halo.current.scale.set(s, s, 1);
    }

    // ── Orbital rings — distinct rotations
    if (ringPrimary.current) ringPrimary.current.rotation.z += dt * 0.14;
    if (ringOuter.current)   ringOuter.current.rotation.z   -= dt * 0.09;
    if (ringFaint.current)   ringFaint.current.rotation.y   += dt * 0.06;
  });

  return (
    <group ref={group} position={basePosition}>
      {/* Pulsing soft glow halo behind the logo */}
      <mesh ref={halo} position={[0, 0.05, -0.4]}>
        <planeGeometry args={[5.6, 5.6]} />
        <meshBasicMaterial
          ref={haloMat}
          map={haloTex}
          transparent
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Logo — strong Float wraps a swinging group so motion stacks */}
      <Float
        speed={1.4}
        rotationIntensity={0.10}
        floatIntensity={0.55}
        floatingRange={[-0.12, 0.12]}
      >
        <group ref={logoSwing}>
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
        </group>
      </Float>

      {/* Orbital ring — primary, brighter and faster */}
      <mesh ref={ringPrimary} rotation={[Math.PI / 2.15, 0, 0]} position={[0, -1.05, 0]}>
        <torusGeometry args={[1.95, 0.020, 16, 128]} />
        <meshStandardMaterial
          color="#4A8FE5"
          emissive="#4A8FE5"
          emissiveIntensity={2.6}
          toneMapped={false}
        />
      </mesh>

      {/* Orbital ring — outer accent */}
      <mesh ref={ringOuter} rotation={[Math.PI / 2.35, 0.18, 0]} position={[0, -1.05, 0]}>
        <torusGeometry args={[2.35, 0.010, 12, 128]} />
        <meshBasicMaterial color="#6BB6FF" transparent opacity={0.72} toneMapped={false} />
      </mesh>

      {/* Orbital ring — faint, large depth marker */}
      <mesh ref={ringFaint} rotation={[Math.PI / 2.5, -0.10, 0]} position={[0, -1.05, 0]}>
        <torusGeometry args={[2.85, 0.006, 8, 128]} />
        <meshBasicMaterial color="#4A8FE5" transparent opacity={0.30} toneMapped={false} />
      </mesh>

      {/* Drifting particles */}
      <ParticleField count={90} />
    </group>
  );
};

export default LogoCenterpiece;
