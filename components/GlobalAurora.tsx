import React, { useEffect, useState } from "react";

/* ══════════════════════════════════════════════
   GlobalAurora — fixed cinematic backdrop that
   lives behind every non-landing page. Subtle
   flowing aurora gradients give every screen a
   premium "alive" feel without competing with
   content. Skips itself on the landing page so
   the hero 3D scene isn't doubled up.
   ══════════════════════════════════════════════ */
const GlobalAurora: React.FC = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const check = () => {
      const onLanding =
        !!document.querySelector(".lp-hero") &&
        !document.querySelector("[data-app-page]");
      setShow(!onLanding);
    };
    check();
    const id = window.setInterval(check, 600);
    return () => window.clearInterval(id);
  }, []);

  if (!show) return null;

  return (
    <div className="ga-root" aria-hidden="true">
      <div className="ga-base" />
      <div className="ga-blob ga-blob-1" />
      <div className="ga-blob ga-blob-2" />
      <div className="ga-blob ga-blob-3" />
      <div className="ga-grid" />
      <style>{styles}</style>
    </div>
  );
};

const styles = `
.ga-root {
  position: fixed; inset: 0; z-index: -1;
  pointer-events: none; overflow: hidden;
}
.ga-base {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, #070D1B 0%, #0B1F3F 35%, #0F2A52 65%, #0A1B3A 100%);
}
.ga-blob {
  position: absolute; border-radius: 50%;
  filter: blur(110px);
  animation: gaFloat 22s ease-in-out infinite;
  opacity: 0.55;
  will-change: transform;
}
.ga-blob-1 {
  width: 680px; height: 680px;
  background: radial-gradient(circle, rgba(43,108,184,0.7), transparent 65%);
  top: -200px; left: -180px;
}
.ga-blob-2 {
  width: 780px; height: 780px;
  background: radial-gradient(circle, rgba(6,182,212,0.55), transparent 65%);
  top: 25%; right: -240px;
  animation-delay: -8s;
}
.ga-blob-3 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(123,184,255,0.55), transparent 65%);
  bottom: -200px; left: 35%;
  animation-delay: -14s;
}
.ga-grid {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px);
  background-size: 30px 30px;
  opacity: 0.6;
  mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
}
@keyframes gaFloat {
  0%, 100% { transform: translate(0,0) scale(1); }
  33% { transform: translate(70px,-50px) scale(1.12); }
  66% { transform: translate(-50px,50px) scale(0.92); }
}
@media (prefers-reduced-motion: reduce) {
  .ga-blob { animation: none; }
}
`;

export default GlobalAurora;
