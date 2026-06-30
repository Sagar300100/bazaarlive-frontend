import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, RoundedBox, useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * V1 hero subject. Built as a clearly-3D object on a stage:
 *
 *   - A navy pedestal sits on the floor with an amber rim
 *   - A thicker product CARD (real 3D slab, not a plane) floats above it
 *   - The card has an inset frame, the photo, a brand strip, and a
 *     proper back face
 *   - <Float> adds breathing; useFrame adds a continuous slow Y rotation
 *
 * GLB swap path: when a real scan is ready, replace the inner card
 * <group> with <primitive object={scene} /> — pedestal and stage stay.
 *
 * NB: do NOT brand-position this as "the auction product". This card is
 * a placeholder for any live drop — sneakers today, watches/sarees next.
 */
interface ProductPlaceholderProps {
  src?: string;
  /** Scroll-driven scale multiplier (1.0 at top of hero, ~1.35 at bottom). */
  scale?: number;
}

const DEFAULT_SNEAKER =
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80&auto=format&fit=crop';

export const ProductPlaceholder: React.FC<ProductPlaceholderProps> = ({
  src = DEFAULT_SNEAKER,
  scale = 1,
}) => {
  const wrapRef = useRef<THREE.Group>(null);
  const cardRef = useRef<THREE.Group>(null);
  const texture = useTexture(src);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
  }, [texture]);

  useFrame((_, dt) => {
    if (cardRef.current) {
      // Continuous slow rotation — visible even before the user scrolls
      cardRef.current.rotation.y += dt * 0.22;
    }
    if (wrapRef.current) {
      const target = scale;
      const current = wrapRef.current.scale.x;
      const next = current + (target - current) * Math.min(1, dt * 4);
      wrapRef.current.scale.setScalar(next);
    }
  });

  return (
    <group ref={wrapRef}>
      {/* ── Pedestal — gives the product something physical to sit on */}
      <group position={[0, -1.04, 0]}>
        <RoundedBox
          args={[1.9, 0.20, 1.4]}
          radius={0.04}
          smoothness={3}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#142A4D"
            metalness={0.45}
            roughness={0.40}
          />
        </RoundedBox>
        {/* Thin amber rim around the top of the pedestal */}
        <mesh position={[0, 0.105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.92, 0.96, 64]} />
          <meshBasicMaterial color="#C9923C" toneMapped={false} />
        </mesh>
      </group>

      {/* ── Floating product card */}
      <Float
        speed={0.85}
        rotationIntensity={0.05}
        floatIntensity={0.20}
        floatingRange={[-0.05, 0.05]}
      >
        <group ref={cardRef} position={[0, 0.10, 0]}>
          {/* Card body — clearly a 3D slab with depth (14cm thick) */}
          <RoundedBox
            args={[1.55, 2.05, 0.14]}
            radius={0.06}
            smoothness={5}
            castShadow
          >
            <meshStandardMaterial
              color="#F5EFE3"
              metalness={0.08}
              roughness={0.58}
            />
          </RoundedBox>

          {/* Front: inset matte panel */}
          <mesh position={[0, 0, 0.071]}>
            <planeGeometry args={[1.40, 1.92]} />
            <meshStandardMaterial color="#E8DFCC" roughness={0.72} />
          </mesh>

          {/* Front: product photograph */}
          <mesh position={[0, 0.06, 0.073]}>
            <planeGeometry args={[1.30, 1.62]} />
            <meshStandardMaterial map={texture} roughness={0.38} metalness={0.05} />
          </mesh>

          {/* Front: brand strip (deep navy bar) at bottom of card */}
          <mesh position={[0, -0.85, 0.072]}>
            <planeGeometry args={[1.30, 0.14]} />
            <meshBasicMaterial color="#0B1F3F" toneMapped={false} />
          </mesh>

          {/* Front: small amber accent under the photo */}
          <mesh position={[-0.45, -0.74, 0.073]}>
            <planeGeometry args={[0.32, 0.014]} />
            <meshBasicMaterial color="#C9923C" toneMapped={false} />
          </mesh>

          {/* Back face — deep navy */}
          <mesh position={[0, 0, -0.071]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[1.55, 2.05]} />
            <meshStandardMaterial color="#0B1F3F" roughness={0.7} />
          </mesh>
        </group>
      </Float>
    </group>
  );
};

export default ProductPlaceholder;
