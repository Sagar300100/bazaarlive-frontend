import React, { useEffect, useRef } from "react";

/* ══════════════════════════════════════════════
   Snake cursor — DOM-based LERP chain
   • Arrow head LERPs toward mouse, rotates with motion
   • 22 trail segments LERP toward the segment ahead
     of them, each with a slightly slower speed
   • Sine-wave wobble per segment for snake motion
   • Mounted once at the root so it appears site-wide
══════════════════════════════════════════════ */
const SnakeCursor: React.FC = () => {
  const layerRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip on touch-only devices — no pointer to follow
    if (window.matchMedia?.("(pointer: coarse)").matches) return;

    const layer = layerRef.current;
    const arrow = arrowRef.current;
    if (!layer || !arrow) return;

    // Hide native cursor globally while mounted
    const styleTag = document.createElement("style");
    styleTag.setAttribute("data-snake-cursor", "1");
    styleTag.textContent = `*, *::before, *::after { cursor: none !important; }`;
    document.head.appendChild(styleTag);

    const SEGMENT_COUNT = 22;
    const mouse     = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const prevMouse = { x: mouse.x, y: mouse.y };
    const arrowPos  = { x: mouse.x, y: mouse.y };
    let   arrowAngle = 90;

    const segments: {
      element: HTMLDivElement;
      x: number;
      y: number;
      speed: number;
    }[] = [];

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const el = document.createElement("div");
      const size    = Math.max(4, 18 - i * 0.65);
      const opacity = Math.max(0.12, 0.78 - i * 0.03);
      Object.assign(el.style, {
        position:      "fixed",
        left:          "0",
        top:           "0",
        width:         `${size}px`,
        height:        `${size}px`,
        borderRadius:  "999px",
        background:    "rgba(125,211,252,0.92)",
        boxShadow:     "0 0 18px rgba(6,182,212,0.85), 0 0 42px rgba(80,140,230,0.45)",
        transform:     "translate(-9999px,-9999px)",
        opacity:       String(opacity),
        pointerEvents: "none",
        willChange:    "transform",
      });
      layer.appendChild(el);
      segments.push({ element: el, x: mouse.x, y: mouse.y, speed: 0.25 - i * 0.006 });
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove);

    let rafId = 0;
    const animate = () => {
      const dx = mouse.x - prevMouse.x;
      const dy = mouse.y - prevMouse.y;
      const moveSpeed = Math.hypot(dx, dy);

      if (moveSpeed > 0.2) {
        const targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        arrowAngle = lerp(arrowAngle, targetAngle, 0.22);
      }

      arrowPos.x = lerp(arrowPos.x, mouse.x, 0.34);
      arrowPos.y = lerp(arrowPos.y, mouse.y, 0.34);

      arrow.style.transform =
        `translate(${arrowPos.x}px, ${arrowPos.y}px) translate(-50%, -50%) rotate(${arrowAngle}deg)`;

      let leadX = arrowPos.x;
      let leadY = arrowPos.y;
      const now = Date.now();

      segments.forEach((seg, i) => {
        seg.x = lerp(seg.x, leadX, seg.speed);
        seg.y = lerp(seg.y, leadY, seg.speed);
        const wave = Math.sin(now * 0.006 + i * 0.7) * 3;
        seg.element.style.transform =
          `translate(${seg.x + wave}px, ${seg.y - wave}px) translate(-50%, -50%)`;
        leadX = seg.x;
        leadY = seg.y;
      });

      prevMouse.x = mouse.x;
      prevMouse.y = mouse.y;

      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMove);
      segments.forEach(s => s.element.remove());
      const tag = document.querySelector('style[data-snake-cursor="1"]');
      tag?.parentNode?.removeChild(tag);
    };
  }, []);

  return (
    <div
      ref={layerRef}
      style={{
        position: "fixed", inset: 0,
        zIndex: 9999, pointerEvents: "none",
      }}
    >
      <div
        ref={arrowRef}
        style={{
          position: "fixed", left: 0, top: 0,
          width: 34, height: 34,
          display: "grid", placeItems: "center",
          transform: "translate(-9999px,-9999px)",
          willChange: "transform",
          pointerEvents: "none",
        }}
      >
        <svg
          viewBox="0 0 32 32" fill="none"
          width={34} height={34}
          style={{
            filter:
              "drop-shadow(0 0 10px rgba(255,255,255,0.85)) " +
              "drop-shadow(0 0 24px rgba(6,182,212,0.8))",
          }}
        >
          <path d="M16 4V26" stroke="white" strokeWidth={3.2} strokeLinecap="round" />
          <path
            d="M8.5 18.5L16 26L23.5 18.5"
            stroke="white" strokeWidth={3.2}
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

export default SnakeCursor;
