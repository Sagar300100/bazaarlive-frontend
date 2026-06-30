import React from 'react';

/**
 * Lite-mode hero — no R3F, no Canvas. Renders the brand logo with a
 * soft electric-blue glow halo. Premium feeling carried by the logo
 * itself + typography. No 3D needed.
 */
export const HeroStaticFallback: React.FC<{ src?: string; alt?: string }> = ({
  src = '/assets/brand/any_all_A_mark_transparent.png',
  alt = 'Any & All',
}) => {
  return (
    <div className="hero__static-fallback" role="img" aria-label={alt}>
      <img src={src} alt={alt} loading="eager" />
    </div>
  );
};

export default HeroStaticFallback;
