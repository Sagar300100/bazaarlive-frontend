import React from 'react';

/**
 * Receives the spotlight shadow under the stream window. Accepts an x
 * offset so it can sit under whichever side of the scene the stage is
 * composed on (full-bleed layout pushes the stage to the right).
 */
export const SoftShadowPlane: React.FC<{
  position?: [number, number, number];
}> = ({ position = [0, -1.18, 0.2] }) => {
  return (
    <mesh
      receiveShadow
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[6, 3.4]} />
      <shadowMaterial transparent opacity={0.28} />
    </mesh>
  );
};

export default SoftShadowPlane;
