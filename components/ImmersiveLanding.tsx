/* ════════════════════════════════════════════════════════════════
   ImmersiveLanding — Any & All
   ════════════════════════════════════════════════════════════════
   One continuous scroll-driven 3D world, not stacked sections.

   ARCHITECTURE
   ────────────
   • Single fixed-position Canvas covering the viewport
   • drei ScrollControls owns scroll state (pages × viewport height)
   • useScroll() inside the Scene gives 0..1 progress every frame
   • All 3D objects + camera + materials read from that single scalar
     → everything is choreographed, nothing is independent
   • <Scroll html> renders stacked HTML pages aligned to scroll stations
   • HTML and 3D share the same scroll axis → DOM text + 3D world feel
     like one fabric

   STATIONS (camera flies through these in world-space)
   ────────────────────────────────────────────────────
   0.00 — ORIGIN      iridescent focal orb at z=0          (Bid. Win. Get it Live.)
   0.20 — FRAGMENT    orb fragments into orbiting shards   (Live commerce, rebuilt)
   0.40 — CATEGORIES  shards form a constellation grid     (From sneakers to sarees)
   0.60 — JOURNEY     3 luminous nodes connected by beam   (How it works)
   0.80 — SELLERS     phone slab + flowing particles       (Sell to all of India)
   1.00 — CLIMAX      focal returns, opens, reveals CTA    (Ready when you are)

   PERFORMANCE
   ───────────
   • AdaptiveDpr + AdaptiveEvents (auto-throttle on slow GPUs)
   • Single Canvas (no re-mount, no double scenes)
   • Particles capped at ~500 (curl-noise)
   • EffectComposer with 2 light effects only (bloom + vignette)
   • Geometry detail tuned: hero focal 24-subdiv, background shards 1-subdiv
   • Most animation reads from refs, not React state → zero re-renders/frame
   ════════════════════════════════════════════════════════════════ */

import React, { useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ScrollControls, useScroll, Scroll,
  AdaptiveDpr, AdaptiveEvents,
  Float, Environment, Lightformer, PerspectiveCamera,
  RoundedBox, Sparkles, Html,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { Header } from "./Header";

interface ImmersiveLandingProps {
  onLoginClick: () => void;
  onBecomeSellerClick: () => void;
  onNavigate: (page: string) => void;
  onNavigateToSellerHub: (page: "inventory" | "schedule_show" | "shows" | "home") => void;
  currentPage: string;
  onBack?: () => void;
}

const PAGES = 6;   // total scroll length = PAGES × viewport height

/* ────────────────────────────────────────────────────────────────
   IRIDESCENT FOCAL  (custom GLSL — simplex noise + fresnel palette)
   This is the "main character" of the journey. It transforms as the
   user scrolls — distortion grows, then fragments, then returns.
   ──────────────────────────────────────────────────────────────── */
const focalVS = /* glsl */`
  uniform float uTime;
  uniform float uDistort;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+2.0*C.xxx; vec3 x3=x0-1.0+3.0*C.xxx;
    i=mod(i,289.0);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))
            +i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=1.0/7.0; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
  void main(){
    vec3 pos = position;
    float t = uTime * 0.25;
    float n  = snoise(pos*1.2  + vec3( t,  t*0.6, -t*0.4));
    float n2 = snoise(pos*2.6  + vec3(-t*0.8, t*1.1, t*0.5));
    pos += normal * (n*0.6 + n2*0.18) * uDistort;
    vec4 wp = modelMatrix * vec4(pos,1.0);
    vNormal  = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const focalFS = /* glsl */`
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  vec3 iridescent(float t){
    vec3 a=vec3(0.50,0.42,0.55);
    vec3 b=vec3(0.50,0.40,0.45);
    vec3 c=vec3(0.95,1.00,0.95);
    vec3 d=vec3(0.05,0.25,0.55);
    return a + b * cos(6.2831*(c*t + d));
  }
  void main(){
    float fres = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.2);
    float band = sin(vNormal.y*6.0 + uTime*0.4)*0.5 + 0.5;
    vec3 col = iridescent(fres*0.6 + band*0.35);
    col += vec3(0.45,0.75,1.0) * pow(fres,4.0) * 1.6;
    gl_FragColor = vec4(col,1.0);
  }
`;

/* ────────────────────────────────────────────────────────────────
   FOCAL — central morphing element. Drives the narrative.
   distortion grows at fragment moment, returns at climax.
   ──────────────────────────────────────────────────────────────── */
const Focal: React.FC<{ scrollRef: React.MutableRefObject<number> }> = ({ scrollRef }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const uniforms = useMemo(() => ({
    uTime:    { value: 0 },
    uDistort: { value: 0.2 },
  }), []);

  useFrame((state, dt) => {
    const s = scrollRef.current;
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // distortion swells at fragment moment (0.2-0.4), eases off, returns at climax
      const swell = Math.sin(s * Math.PI) * 0.55 + 0.2;
      matRef.current.uniforms.uDistort.value = swell;
    }
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.10;
      groupRef.current.rotation.x += dt * 0.04;
      // shrink + drift back as user travels into later stations
      const targetScale = THREE.MathUtils.lerp(1.55, 0.45, Math.min(1, s * 1.4));
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), Math.min(1, dt * 2));
      // float upward subtly through journey
      groupRef.current.position.y = THREE.MathUtils.lerp(0, 1.2, s);
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={0.6} rotationIntensity={0.15} floatIntensity={0.4} floatingRange={[-0.08, 0.08]}>
        <mesh>
          <icosahedronGeometry args={[1.0, 24]} />
          <shaderMaterial
            ref={matRef}
            vertexShader={focalVS}
            fragmentShader={focalFS}
            uniforms={uniforms}
          />
        </mesh>
      </Float>
    </group>
  );
};

/* ────────────────────────────────────────────────────────────────
   SHARDS — small fragments that emerge from the focal, orbit,
   eventually form the category constellation grid, then disperse.
   Each shard's behavior is computed from scroll progress + index.
   ──────────────────────────────────────────────────────────────── */
const SHARD_COUNT = 18;
const Shards: React.FC<{ scrollRef: React.MutableRefObject<number> }> = ({ scrollRef }) => {
  const groupRef = useRef<THREE.Group>(null!);

  // base "grid" positions for the constellation moment
  const targets = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    const cols = 6, rows = 3;
    for (let i = 0; i < SHARD_COUNT; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      arr.push(new THREE.Vector3(
        (c - (cols - 1) / 2) * 2.4,
        (r - (rows - 1) / 2) * 1.8,
        -2,
      ));
    }
    return arr;
  }, []);

  const shardRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state, dt) => {
    const s = scrollRef.current;
    const t = state.clock.elapsedTime;
    // emerge phase: 0.18 → 0.42 (orbit)
    // form phase:   0.40 → 0.60 (grid)
    // disperse:     0.60 → 0.85 (drift to journey edges)
    const emerge  = THREE.MathUtils.smoothstep(s, 0.15, 0.40);
    const form    = THREE.MathUtils.smoothstep(s, 0.42, 0.58);
    const drift   = THREE.MathUtils.smoothstep(s, 0.62, 0.85);

    shardRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const angle = (i / SHARD_COUNT) * Math.PI * 2 + t * 0.18;
      const r = 2.4;

      // orbit position
      const orbX = Math.cos(angle) * r;
      const orbY = Math.sin(angle * 1.4) * 1.4;
      const orbZ = Math.sin(angle) * r * 0.6;

      const target = targets[i];
      const driftPos = new THREE.Vector3(
        target.x * 1.8,
        target.y * 1.5,
        -8 - i * 0.3,
      );

      // blend: hidden (0,0,0 inside focal) → orbit → grid → drift away
      const orbitPos = new THREE.Vector3(orbX, orbY, orbZ);
      const formedPos = target.clone();

      const p1 = new THREE.Vector3().lerpVectors(new THREE.Vector3(0,0,0), orbitPos, emerge);
      const p2 = new THREE.Vector3().lerpVectors(p1, formedPos, form);
      const p3 = new THREE.Vector3().lerpVectors(p2, driftPos, drift);

      mesh.position.lerp(p3, Math.min(1, dt * 4));
      mesh.rotation.x += dt * (0.3 + i * 0.02);
      mesh.rotation.y += dt * (0.4 + i * 0.015);

      // appearance scales with emerge phase
      const sc = emerge * 0.32;
      mesh.scale.setScalar(sc);
    });
  });

  return (
    <group ref={groupRef}>
      {targets.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) shardRefs.current[i] = el; }}
          scale={0}
        >
          <icosahedronGeometry args={[0.6, 1]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? "#7BB8FF" : i % 3 === 1 ? "#06B6D4" : "#A78BFA"}
            metalness={0.9}
            roughness={0.18}
            emissive={i % 2 === 0 ? "#06B6D4" : "#7BB8FF"}
            emissiveIntensity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
};

/* ────────────────────────────────────────────────────────────────
   JOURNEY NODES — 3 luminous orbs connected by glowing lines
   become prominent during station 4 (How It Works)
   ──────────────────────────────────────────────────────────────── */
const JourneyNodes: React.FC<{ scrollRef: React.MutableRefObject<number> }> = ({ scrollRef }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const nodesData = useMemo(() => ([
    { pos: new THREE.Vector3(-3.2, 0.6, 0), color: "#06B6D4" },
    { pos: new THREE.Vector3( 0,   0,   0), color: "#7BB8FF" },
    { pos: new THREE.Vector3( 3.2, 0.6, 0), color: "#22C55E" },
  ]), []);

  useFrame((_, dt) => {
    const s = scrollRef.current;
    const appear  = THREE.MathUtils.smoothstep(s, 0.50, 0.65);
    const disappear = 1 - THREE.MathUtils.smoothstep(s, 0.72, 0.82);
    const alpha = appear * disappear;
    if (groupRef.current) {
      groupRef.current.scale.setScalar(alpha);
      groupRef.current.rotation.y += dt * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, -15]} scale={0}>
      {nodesData.map((n, i) => (
        <group key={i} position={n.pos}>
          {/* glowing core */}
          <mesh>
            <sphereGeometry args={[0.32, 32, 32]} />
            <meshBasicMaterial color={n.color} toneMapped={false} />
          </mesh>
          {/* halo */}
          <mesh>
            <sphereGeometry args={[0.55, 24, 24]} />
            <meshBasicMaterial color={n.color} transparent opacity={0.18} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* connecting beams between nodes */}
      <Beam from={nodesData[0].pos} to={nodesData[1].pos} color="#7BB8FF" />
      <Beam from={nodesData[1].pos} to={nodesData[2].pos} color="#7BB8FF" />
    </group>
  );
};

const Beam: React.FC<{ from: THREE.Vector3; to: THREE.Vector3; color: string }> = ({ from, to, color }) => {
  const mid = useMemo(() => from.clone().add(to).multiplyScalar(0.5), [from, to]);
  const len = useMemo(() => from.distanceTo(to), [from, to]);
  const rot = useMemo(() => {
    const dir = to.clone().sub(from).normalize();
    return Math.atan2(dir.y, dir.x);
  }, [from, to]);
  return (
    <mesh position={mid} rotation={[0, 0, rot]}>
      <boxGeometry args={[len, 0.04, 0.04]} />
      <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.8} />
    </mesh>
  );
};

/* ────────────────────────────────────────────────────────────────
   SELLER PHONE — appears at station 5 (For Sellers)
   A 3D phone slab with a streaming UI texture, slowly rotating.
   ──────────────────────────────────────────────────────────────── */
const SellerPhone: React.FC<{ scrollRef: React.MutableRefObject<number> }> = ({ scrollRef }) => {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    const s = scrollRef.current;
    const enter = THREE.MathUtils.smoothstep(s, 0.70, 0.85);
    const exit  = 1 - THREE.MathUtils.smoothstep(s, 0.92, 1.0);
    if (ref.current) {
      ref.current.scale.setScalar(enter * exit * 1.0);
      ref.current.rotation.y += dt * 0.18;
    }
  });
  return (
    <group ref={ref} position={[2.4, 0, -22]} scale={0} rotation={[0, -0.4, 0]}>
      <Float speed={0.5} floatIntensity={0.3} rotationIntensity={0.1}>
        <RoundedBox args={[1.4, 2.8, 0.18]} radius={0.18} smoothness={6}>
          <meshStandardMaterial color="#0B1220" metalness={0.85} roughness={0.25} />
        </RoundedBox>
        <RoundedBox args={[1.46, 2.86, 0.16]} radius={0.20} smoothness={6}>
          <meshStandardMaterial color="#7BB8FF" metalness={1} roughness={0.15} emissive="#06B6D4" emissiveIntensity={0.4} />
        </RoundedBox>
        {/* screen */}
        <mesh position={[0, 0, 0.095]}>
          <planeGeometry args={[1.22, 2.6]} />
          <meshBasicMaterial color="#F43F5E" toneMapped={false} />
        </mesh>
      </Float>
    </group>
  );
};

/* ────────────────────────────────────────────────────────────────
   CAMERA RIG — moves through z-space, reads scroll
   The whole experience hinges on this — every other element
   appears to "be in the world", but really the camera is moving.
   ──────────────────────────────────────────────────────────────── */
const CameraRig: React.FC<{ scrollRef: React.MutableRefObject<number>; mouseRef: React.RefObject<{ x: number; y: number }> }> = ({ scrollRef, mouseRef }) => {
  const camRef = useRef<THREE.PerspectiveCamera>(null!);

  useFrame((_, dt) => {
    if (!camRef.current) return;
    const s = scrollRef.current;
    // path: travels deeper into negative z as scroll progresses
    const targetZ = THREE.MathUtils.lerp(8, -28, s);
    // small Y bob between stations to feel like flight
    const targetY = Math.sin(s * Math.PI * 3) * 0.6;
    // subtle X drift between stations
    const targetX = Math.sin(s * Math.PI * 2.2) * 0.8;
    // mouse parallax adds tiny extra
    const mx = mouseRef.current?.x ?? 0;
    const my = mouseRef.current?.y ?? 0;

    camRef.current.position.x += (targetX + mx * 0.3 - camRef.current.position.x) * Math.min(1, dt * 3);
    camRef.current.position.y += (targetY + my * 0.2 - camRef.current.position.y) * Math.min(1, dt * 3);
    camRef.current.position.z += (targetZ - camRef.current.position.z) * Math.min(1, dt * 3);

    // always look slightly ahead to give sense of motion
    camRef.current.lookAt(0, 0, targetZ - 5);
  });

  return <PerspectiveCamera ref={camRef} makeDefault position={[0, 0, 8]} fov={42} />;
};

/* ────────────────────────────────────────────────────────────────
   SCENE — assembles everything. Drives scroll progress into a ref
   so all child components can read it without React re-renders.
   ──────────────────────────────────────────────────────────────── */
const Scene: React.FC<{ mouseRef: React.RefObject<{ x: number; y: number }> }> = ({ mouseRef }) => {
  const scroll = useScroll();
  const scrollRef = useRef(0);

  useFrame(() => {
    // damped scroll value is the heart of the choreography
    scrollRef.current = scroll.offset;
  });

  return (
    <>
      <CameraRig scrollRef={scrollRef} mouseRef={mouseRef} />

      {/* atmospheric lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 5]} intensity={1.0} color="#FFFFFF" />
      <directionalLight position={[-4, -2, 2]} intensity={0.6} color="#06B6D4" />
      <pointLight position={[0, 0, 4]} intensity={1.4} color="#7BB8FF" distance={12} />

      <Environment preset="dawn" environmentIntensity={0.6}>
        <Lightformer form="rect" intensity={3} color="#7BB8FF" position={[3, 3, 2]} scale={[3, 3, 1]} />
        <Lightformer form="rect" intensity={2} color="#FFFFFF" position={[-3, 2, 1]} scale={[2, 4, 1]} />
        <Lightformer form="ring" intensity={1.4} color="#06B6D4" position={[0, -3, 0]} scale={[4, 4, 1]} />
      </Environment>

      {/* the 3D narrative */}
      <Focal scrollRef={scrollRef} />
      <Shards scrollRef={scrollRef} />
      <JourneyNodes scrollRef={scrollRef} />
      <SellerPhone scrollRef={scrollRef} />

      {/* ambient particles travel with the camera */}
      <Sparkles count={180} scale={[14, 8, 30]} size={1.8} speed={0.25} color="#7BB8FF" opacity={0.55} />
      <Sparkles count={80}  scale={[10, 6, 20]} size={2.6} speed={0.18} color="#06B6D4" opacity={0.5} />

      {/* refined postprocessing — restrained */}
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.55} luminanceThreshold={0.7} luminanceSmoothing={0.9} mipmapBlur radius={0.65} />
        <Vignette offset={0.42} darkness={0.42} eskil={false} />
      </EffectComposer>

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </>
  );
};

/* ────────────────────────────────────────────────────────────────
   HTML OVERLAY — text content positioned at each station
   Each "page" of <Scroll html> is one viewport height tall
   ──────────────────────────────────────────────────────────────── */
const Overlay: React.FC<{ onPrimary: () => void; onSecondary: () => void }> = ({ onPrimary, onSecondary }) => (
  <div className="imm-overlay">
    {/* STATION 1 — ORIGIN */}
    <section className="imm-station imm-station-1">
      <div className="imm-eyebrow"><span className="imm-dot" /> EARLY ACCESS — LAUNCHING IN INDIA</div>
      <h1 className="imm-h1">Bid.<br/>Win.<br/>Get it Live.</h1>
      <p className="imm-sub">India's first live-auction marketplace. Watch sellers stream live, bid in seconds, pay via UPI.</p>
      <div className="imm-scroll-hint">
        <span>SCROLL TO ENTER</span>
        <div className="imm-scroll-line" />
      </div>
    </section>

    {/* STATION 2 — FRAGMENT */}
    <section className="imm-station imm-station-2">
      <div className="imm-eyebrow">WHAT WE'RE BUILDING</div>
      <h2 className="imm-h2">Live commerce,<br/>rebuilt for <em>Bharat.</em></h2>
      <p className="imm-sub">Real auctions. Real sellers. Real items shipping to your door.</p>
    </section>

    {/* STATION 3 — CATEGORIES */}
    <section className="imm-station imm-station-3">
      <div className="imm-eyebrow">EVERY CATEGORY</div>
      <h2 className="imm-h2">From sneakers<br/>to sarees.</h2>
      <p className="imm-sub">Eighteen launching categories. From streetwear to vintage textiles to electronics — auctioned live by verified sellers.</p>
    </section>

    {/* STATION 4 — JOURNEY */}
    <section className="imm-station imm-station-4">
      <div className="imm-eyebrow">HOW IT WORKS</div>
      <h2 className="imm-h2">Three steps.<br/>Zero fine print.</h2>
      <div className="imm-steps">
        <div className="imm-step"><span>01</span><h4>Browse Live</h4><p>Find sellers streaming live in your category.</p></div>
        <div className="imm-step"><span>02</span><h4>Bid Real-Time</h4><p>One-tap bidding. UPI checkout when you win.</p></div>
        <div className="imm-step"><span>03</span><h4>Doorstep</h4><p>3-7 day delivery. Money released only after you confirm.</p></div>
      </div>
    </section>

    {/* STATION 5 — SELLERS */}
    <section className="imm-station imm-station-5">
      <div className="imm-eyebrow">FOR SELLERS</div>
      <h2 className="imm-h2 imm-h2-left">Sell live<br/>to all of <em>India.</em></h2>
      <p className="imm-sub imm-sub-left">Lowest commission in India. Instant UPI payouts. Pan-India audience without ad spend.</p>
      <button className="imm-cta imm-cta-left" onClick={onSecondary}>
        Become a Seller →
      </button>
    </section>

    {/* STATION 6 — CLIMAX */}
    <section className="imm-station imm-station-6">
      <h2 className="imm-climax">
        Ready<br/>when <em>you</em><br/>are.
      </h2>
      <p className="imm-sub">Be among the first to bid live. Join early access.</p>
      <div className="imm-cta-row">
        <button className="imm-cta" onClick={onPrimary}>Get Early Access</button>
        <button className="imm-cta imm-cta-ghost" onClick={onSecondary}>Sell on Any & All</button>
      </div>
      <div className="imm-footer">
        <span>BUILT ON</span>
        <span>Razorpay · 100ms · Google Cloud · Firebase</span>
      </div>
    </section>
  </div>
);

/* ════════════════════════════════════════════════════════════════
   ROOT COMPONENT
   ════════════════════════════════════════════════════════════════ */
const ImmersiveLanding: React.FC<ImmersiveLandingProps> = ({
  onLoginClick, onBecomeSellerClick, onNavigate, onNavigateToSellerHub, currentPage, onBack,
}) => {
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="imm-root">
      <style>{styles}</style>

      <Header
        onNavigate={onNavigate}
        isLoggedIn={false}
        onLoginClick={onLoginClick}
        onLogout={() => {}}
        onSellClick={onBecomeSellerClick}
        onNavigateToSellerHub={onNavigateToSellerHub}
        currentPage={currentPage}
        onBack={onBack}
        bgColor="transparent"
        darkMode
      />

      <div className="imm-canvas-wrap">
        <Canvas
          dpr={[1, 1.25]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
          }}
        >
          <color attach="background" args={["#050912"]} />
          <fog attach="fog" args={["#050912", 8, 45]} />
          <Suspense fallback={null}>
            <ScrollControls pages={PAGES} damping={0.28}>
              <Scene mouseRef={mouseRef} />
              <Scroll html style={{ width: "100%" }}>
                <Overlay onPrimary={onLoginClick} onSecondary={onBecomeSellerClick} />
              </Scroll>
            </ScrollControls>
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
   STYLES — minimal, brand-aligned, lots of breathing room
   Each station fills one viewport height; positions chosen so
   text aligns with where each 3D moment peaks.
   ──────────────────────────────────────────────────────────────── */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800;900&family=Rubik:wght@400;500;600&display=swap');

.imm-root {
  background: #050912; color: white;
  font-family: 'Rubik', system-ui, sans-serif;
  overflow-x: hidden;
}
.imm-canvas-wrap {
  position: fixed; inset: 0; z-index: 0;
}
.imm-overlay {
  width: 100vw;
  font-family: 'Rubik', system-ui, sans-serif;
  pointer-events: none;
}
.imm-overlay button { pointer-events: auto; }
.imm-overlay a { pointer-events: auto; }

.imm-station {
  position: relative;
  width: 100vw; height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 0 max(24px, 6vw);
  text-align: center;
}

/* STATION 1 — ORIGIN */
.imm-station-1 { text-align: center; }
.imm-eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 8px 16px; border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(14px);
  font-size: 11px; letter-spacing: 2px; font-weight: 700;
  color: rgba(255,255,255,0.85);
  margin-bottom: 28px;
}
.imm-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #22C55E; box-shadow: 0 0 12px #22C55E;
  animation: imm-pulse 1.5s infinite;
}
@keyframes imm-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.55;transform:scale(0.85);} }

.imm-h1 {
  font-family: 'Outfit', sans-serif; font-weight: 900;
  font-size: clamp(64px, 12vw, 180px);
  line-height: 0.92; letter-spacing: -0.05em;
  margin: 0 0 28px;
  background: linear-gradient(180deg, #FFFFFF 0%, #C9DCFF 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 80px rgba(123,184,255,0.25);
}

.imm-sub {
  font-size: clamp(15px, 1.4vw, 19px);
  line-height: 1.6; color: rgba(255,255,255,0.7);
  max-width: 540px; margin: 0 auto;
}
.imm-sub-left { margin: 0; max-width: 480px; }

.imm-scroll-hint {
  position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  font-size: 10px; letter-spacing: 4px; color: rgba(255,255,255,0.5);
  animation: imm-bob 2.4s ease-in-out infinite;
}
.imm-scroll-line {
  width: 1px; height: 48px;
  background: linear-gradient(180deg, rgba(255,255,255,0.6), transparent);
}
@keyframes imm-bob { 0%,100%{transform:translate(-50%,0);} 50%{transform:translate(-50%,6px);} }

/* STATION 2-6 */
.imm-h2 {
  font-family: 'Outfit', sans-serif; font-weight: 800;
  font-size: clamp(48px, 7vw, 110px);
  line-height: 0.95; letter-spacing: -0.035em;
  margin: 0 0 24px;
  color: white;
}
.imm-h2-left { text-align: left; margin-left: 0; }
.imm-h2 em, .imm-climax em {
  font-style: normal;
  background: linear-gradient(135deg, #7BB8FF 0%, #06B6D4 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}

.imm-station-5 {
  align-items: flex-start;
  justify-content: center;
  padding-left: max(40px, 8vw);
}

/* steps row at station 4 */
.imm-steps {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 22px; margin-top: 28px;
  max-width: 1080px;
}
.imm-step {
  text-align: left;
  padding: 22px 24px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  backdrop-filter: blur(14px);
  border-radius: 18px;
}
.imm-step span {
  font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 16px;
  background: linear-gradient(135deg, #7BB8FF, #06B6D4);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
}
.imm-step h4 {
  font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 17px;
  margin: 8px 0 6px; color: white;
}
.imm-step p {
  font-size: 13px; line-height: 1.55; color: rgba(255,255,255,0.65); margin: 0;
}

/* CTAs */
.imm-cta {
  background: #FFFFFF; color: #050912;
  border: none; padding: 16px 28px; border-radius: 14px;
  font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700;
  cursor: pointer; display: inline-flex; align-items: center; gap: 10px;
  box-shadow: 0 16px 50px rgba(123,184,255,0.35);
  transition: transform 220ms ease, box-shadow 220ms ease;
}
.imm-cta:hover { transform: translateY(-2px); box-shadow: 0 22px 60px rgba(123,184,255,0.55); }
.imm-cta-ghost {
  background: rgba(255,255,255,0.08); color: white;
  border: 1px solid rgba(255,255,255,0.18);
  backdrop-filter: blur(14px);
  box-shadow: none;
}
.imm-cta-ghost:hover { background: rgba(255,255,255,0.16); }
.imm-cta-left { margin-top: 28px; }
.imm-cta-row { display: flex; gap: 14px; margin-top: 32px; justify-content: center; flex-wrap: wrap; }

/* CLIMAX */
.imm-climax {
  font-family: 'Outfit', sans-serif; font-weight: 900;
  font-size: clamp(72px, 11vw, 180px);
  line-height: 0.9; letter-spacing: -0.045em;
  margin: 0 0 24px;
  color: white;
}
.imm-footer {
  position: absolute; bottom: 32px; left: 0; right: 0;
  display: flex; justify-content: center; gap: 14px;
  font-size: 11px; letter-spacing: 2px; color: rgba(255,255,255,0.4);
}

@media (max-width: 768px) {
  .imm-steps { grid-template-columns: 1fr; gap: 14px; }
  .imm-station-5 { padding-left: 24px; }
}
`;

export default ImmersiveLanding;
