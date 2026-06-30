import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Atmospheric studio backdrop — deep navy with a soft electric-blue
 * radial spot in the centre. Matches the royal-blue brand palette and
 * gives the logo centerpiece its glowing stage feeling.
 *
 * CanvasTexture so we paint a real radial gradient (cheaper than a
 * shader, drawn once at mount).
 */
function makeBackdropTexture(): THREE.CanvasTexture {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  // Deepest base
  ctx.fillStyle = '#050A18';
  ctx.fillRect(0, 0, size, size);

  // Royal-blue radial spot — centre
  const cx = size * 0.50;
  const cy = size * 0.45;
  const g = ctx.createRadialGradient(cx, cy, 30, cx, cy, size * 0.70);
  g.addColorStop(0,    'rgba(43, 108, 184, 0.95)');
  g.addColorStop(0.30, 'rgba(28, 70, 130, 0.55)');
  g.addColorStop(0.65, 'rgba(11, 31, 63, 0.18)');
  g.addColorStop(1,    'rgba(5,  10, 24, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // Subtle starfield — tiny pale blue dots
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 0.9 + 0.3;
    const a = Math.random() * 0.5 + 0.15;
    ctx.fillStyle = `rgba(170, 210, 255, ${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

export const Cyclorama: React.FC = () => {
  const backdropTex = useMemo(makeBackdropTexture, []);

  return (
    <group>
      {/* Back wall */}
      <mesh receiveShadow position={[0, 0.3, -3.6]}>
        <planeGeometry args={[22, 14]} />
        <meshStandardMaterial map={backdropTex} roughness={0.95} metalness={0} />
      </mesh>

      {/* Floor — deeper navy */}
      <mesh receiveShadow position={[0, -1.30, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 9]} />
        <meshStandardMaterial color="#070F22" roughness={0.92} metalness={0.05} />
      </mesh>
    </group>
  );
};

export default Cyclorama;
