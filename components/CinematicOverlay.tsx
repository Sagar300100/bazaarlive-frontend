import React, { useEffect } from "react";

/* ══════════════════════════════════════════════
   CinematicOverlay — global post-fx for ALL pages
   Vignette + fine film grain + subtle scanline
   so non-3D pages share the cinematic frame too.
   Mounts once at the top of App.
   ══════════════════════════════════════════════ */

const GRAIN_SVG = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
     <filter id='n'>
       <feTurbulence type='fractalNoise' baseFrequency='1.8' numOctaves='2' stitchTiles='stitch'/>
       <feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0'/>
     </filter>
     <rect width='100%' height='100%' filter='url(#n)' opacity='0.9'/>
   </svg>`
);

const CinematicOverlay: React.FC = () => {
  useEffect(() => {
    if (window.matchMedia?.("(pointer: coarse)").matches) return; // skip on touch
    const tag = document.createElement("style");
    tag.setAttribute("data-cinematic", "1");
    tag.textContent = `
      .cine-vignette {
        position: fixed; inset: 0;
        pointer-events: none; z-index: 8999;
        mix-blend-mode: multiply;
        background:
          radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.45) 100%);
      }
      .cine-grain {
        position: fixed; inset: 0;
        pointer-events: none; z-index: 9000;
        background-image: url("data:image/svg+xml,${GRAIN_SVG}");
        background-size: 200px 200px;
        opacity: 0.05;
        mix-blend-mode: overlay;
        animation: cine-grain-shift 3s steps(8) infinite;
      }
      .cine-scan {
        position: fixed; inset: 0;
        pointer-events: none; z-index: 9001;
        background: repeating-linear-gradient(
          0deg,
          transparent 0px,
          transparent 2px,
          rgba(255,255,255,0.012) 3px
        );
        mix-blend-mode: overlay;
      }
      @keyframes cine-grain-shift {
        0%   { transform: translate(0, 0); }
        25%  { transform: translate(-4%, 2%); }
        50%  { transform: translate(3%, -3%); }
        75%  { transform: translate(-2%, -2%); }
        100% { transform: translate(0, 0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .cine-grain { animation: none; }
      }
    `;
    document.head.appendChild(tag);
    return () => { document.head.removeChild(tag); };
  }, []);

  return (
    <>
      <div className="cine-vignette" aria-hidden="true" />
      <div className="cine-grain"    aria-hidden="true" />
      <div className="cine-scan"     aria-hidden="true" />
    </>
  );
};

export default CinematicOverlay;
