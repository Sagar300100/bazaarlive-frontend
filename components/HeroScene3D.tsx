import React, { useRef, Suspense, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float, Environment, RoundedBox, Sparkles, Stars,
  PerspectiveCamera, Lightformer, useTexture, Text,
  AdaptiveDpr, AdaptiveEvents,
} from "@react-three/drei";
import {
  EffectComposer, Bloom, ChromaticAberration, Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

/* ══════════════════════════════════════════════
   PRODUCT CARDS  — floating in 3D space, each shows
   a real product photo as the front-face texture.
   Tells the story: "live auctions for real items"
   ══════════════════════════════════════════════ */

interface ProductData {
  img: string;
  name: string;
  price: string;
  badgeColor: string;
}

const PRODUCTS: ProductData[] = [
  { img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80&auto=format&fit=crop", name: "Jordan 1 × Travis Scott", price: "₹24,999",   badgeColor: "#F43F5E" },
  { img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80&auto=format&fit=crop", name: "Rolex Datejust 41",     price: "₹8,50,000", badgeColor: "#F59E0B" },
  { img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80&auto=format&fit=crop", name: "Vintage Saree Lot",    price: "₹12,500",   badgeColor: "#8B5CF6" },
  { img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80&auto=format&fit=crop", name: "MacBook Pro M3",       price: "₹1,15,000", badgeColor: "#06B6D4" },
  { img: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&q=80&auto=format&fit=crop", name: "Vintage Comic Bundle", price: "₹18,000",   badgeColor: "#22C55E" },
];

/* ──────────────────────────────────────────────
   Individual product card — image texture front,
   colored glass-blue edges, LIVE badge floating.
   ────────────────────────────────────────────── */
const ProductCard: React.FC<{
  data: ProductData;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  speed: number;
}> = ({ data, position, rotation, scale, speed }) => {
  const texture = useTexture(data.img);
  useEffect(() => { texture.colorSpace = THREE.SRGBColorSpace; }, [texture]);

  return (
    <Float speed={speed} rotationIntensity={0.25} floatIntensity={0.55} floatingRange={[-0.18, 0.18]}>
      <group position={position} rotation={rotation} scale={scale}>
        {/* glow halo behind card  (boosted intensity for bloom) */}
        <mesh position={[0, 0, -0.06]}>
          <planeGeometry args={[1.85, 2.35]} />
          <meshBasicMaterial color={data.badgeColor} transparent opacity={0.55} toneMapped={false} />
        </mesh>

        {/* card body (dark base) */}
        <RoundedBox args={[1.4, 1.9, 0.08]} radius={0.10} smoothness={4}>
          <meshStandardMaterial color="#0B1220" metalness={0.6} roughness={0.35} />
        </RoundedBox>

        {/* metallic ring/edge */}
        <RoundedBox args={[1.43, 1.93, 0.07]} radius={0.11} smoothness={4}>
          <meshStandardMaterial color="#2B6CB8" metalness={1} roughness={0.18} />
        </RoundedBox>

        {/* product image (front face) */}
        <mesh position={[0, 0.18, 0.045]}>
          <planeGeometry args={[1.28, 1.28]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>

        {/* gloss overlay on screen */}
        <mesh position={[0, 0.18, 0.046]}>
          <planeGeometry args={[1.28, 1.28]} />
          <meshPhysicalMaterial
            color="white" transparent opacity={0.05}
            roughness={0.2} metalness={0.1} clearcoat={1}
          />
        </mesh>

        {/* LIVE badge (top-left) — bright for bloom */}
        <mesh position={[-0.42, 0.74, 0.05]}>
          <planeGeometry args={[0.38, 0.13]} />
          <meshBasicMaterial color={data.badgeColor} toneMapped={false} />
        </mesh>
        <mesh position={[-0.42, 0.74, 0.045]}>
          <planeGeometry args={[0.55, 0.25]} />
          <meshBasicMaterial color={data.badgeColor} transparent opacity={0.6} toneMapped={false} />
        </mesh>
        <Text
          position={[-0.42, 0.74, 0.055]}
          fontSize={0.07}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          ● LIVE
        </Text>

        {/* price text (bottom) */}
        <Text
          position={[0, -0.66, 0.05]}
          fontSize={0.13}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.3}
          fontWeight="bold"
        >
          {data.price}
        </Text>

        {/* product name (above price) */}
        <Text
          position={[0, -0.84, 0.05]}
          fontSize={0.07}
          color="#94A3B8"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.3}
        >
          {data.name}
        </Text>
      </group>
    </Float>
  );
};

/* ══════════════════════════════════════════════
   GLSL SHADER BACKGROUND  — domain-warped FBM noise
   ══════════════════════════════════════════════ */
const fluidVS = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fluidFS = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uMouse;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= 1.5;
    vec2 m  = uMouse * 0.6;
    float t = uTime * 0.06;

    vec2 q = vec2(fbm(uv + t + m), fbm(uv + vec2(1.7, 9.2) + t));
    vec2 r = vec2(fbm(uv + 4.0 * q + vec2(1.7, 9.2) + t), fbm(uv + 4.0 * q + vec2(8.3, 2.8) + t));
    float n = fbm(uv + 4.0 * r);

    vec3 c1 = vec3(0.030, 0.080, 0.180);
    vec3 c2 = vec3(0.090, 0.260, 0.560);
    vec3 c3 = vec3(0.024, 0.714, 0.831);
    vec3 c4 = vec3(0.482, 0.722, 1.000);

    vec3 col = mix(c1, c2, smoothstep(0.05, 0.55, n));
    col = mix(col, c3, smoothstep(0.45, 0.75, n) * (1.0 - r.x * 0.8));
    col = mix(col, c4, smoothstep(0.65, 0.95, n) * q.y);
    float vig = 1.0 - length(uv) * 0.32;
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
  }
`;
const GlslBackground: React.FC<{ mouse: React.RefObject<{ x: number; y: number }> }> = ({ mouse }) => {
  const ref = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(() => ({
    uTime:  { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
  }), []);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.uniforms.uTime.value = state.clock.elapsedTime;
    if (mouse.current) ref.current.uniforms.uMouse.value.set(mouse.current.x, -mouse.current.y);
  });
  return (
    <mesh position={[0, 0, -10]} renderOrder={-1}>
      <planeGeometry args={[40, 26]} />
      <shaderMaterial
        ref={ref}
        vertexShader={fluidVS}
        fragmentShader={fluidFS}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

/* ══════════════════════════════════════════════
   CURL-NOISE PARTICLE FIELD
   ══════════════════════════════════════════════ */
const FlowParticles: React.FC<{ count?: number }> = ({ count = 1200 }) => {
  const pointsRef = useRef<THREE.Points>(null!);

  const { positions, originals } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const originals = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 6;
      positions[i*3] = x; positions[i*3+1] = y; positions[i*3+2] = z;
      originals[i*3] = x; originals[i*3+1] = y; originals[i*3+2] = z;
    }
    return { positions, originals };
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.elapsedTime;
    const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr  = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const x0 = originals[i*3];
      const y0 = originals[i*3+1];
      const z0 = originals[i*3+2];
      const dx = Math.sin(y0 * 0.35 + t * 0.22) * Math.cos(z0 * 0.25 + t * 0.13) * 0.55;
      const dy = Math.cos(x0 * 0.42 + t * 0.28) * Math.sin(z0 * 0.18 + t * 0.10) * 0.50;
      const dz = Math.sin(x0 * 0.30 + t * 0.17) * Math.cos(y0 * 0.22 + t * 0.09) * 0.45;
      arr[i*3]   = x0 + dx;
      arr[i*3+1] = y0 + dy;
      arr[i*3+2] = z0 + dz;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#7BB8FF"
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
};

/* ══════════════════════════════════════════════
   CENTRAL FOCAL OBJECT  — refined Lusion-ish piece
   A morphing, iridescent icosahedron with custom
   vertex displacement shader. Single focal point,
   slow + deliberate motion, lots of breathing room.
   ══════════════════════════════════════════════ */
const focalVS = /* glsl */`
  uniform float uTime;
  uniform float uDistort;
  uniform vec2  uMouse;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec3 vViewDir;

  // 3D simplex noise — small inline impl, good enough for vertex displacement
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);
    const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vec3 pos = position;
    float t = uTime * 0.25;
    // Subtle organic morph — keep mostly recognisable as an icosahedron
    float n = snoise(pos * 1.2 + vec3(t, t * 0.6, -t * 0.4));
    float n2 = snoise(pos * 2.6 + vec3(-t * 0.8, t * 1.1, t * 0.5));
    float disp = (n * 0.6 + n2 * 0.18) * uDistort;
    pos += normal * disp;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorld   = worldPos.xyz;
    vNormal  = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;
const focalFS = /* glsl */`
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  vec3 iridescent(float t) {
    // smooth rainbow ramp shifted into cyan/violet brand range
    vec3 a = vec3(0.50, 0.42, 0.55);
    vec3 b = vec3(0.50, 0.40, 0.45);
    vec3 c = vec3(0.95, 1.00, 0.95);
    vec3 d = vec3(0.05, 0.25, 0.55);
    return a + b * cos(6.2831 * (c * t + d));
  }

  void main() {
    float fres = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.2);
    float band = sin(vNormal.y * 6.0 + uTime * 0.4) * 0.5 + 0.5;
    vec3 col = iridescent(fres * 0.6 + band * 0.35);
    // brighten edges (fresnel rim)
    col += vec3(0.45, 0.75, 1.0) * pow(fres, 4.0) * 1.6;
    gl_FragColor = vec4(col, 1.0);
  }
`;
const FocalObject: React.FC = () => {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);

  const uniforms = useMemo(() => ({
    uTime:    { value: 0 },
    uDistort: { value: 0.20 },
    uMouse:   { value: new THREE.Vector2(0, 0) },
  }), []);

  useFrame((state, dt) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * 0.10;
      meshRef.current.rotation.x += dt * 0.04;
    }
  });

  return (
    <Float speed={0.7} rotationIntensity={0.15} floatIntensity={0.45} floatingRange={[-0.08, 0.08]}>
      {/* main iridescent body */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.55, 24]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={focalVS}
          fragmentShader={focalFS}
          uniforms={uniforms}
        />
      </mesh>
      {/* faint wireframe ghost behind for depth */}
      <mesh scale={1.18}>
        <icosahedronGeometry args={[1.55, 2]} />
        <meshBasicMaterial color="#7BB8FF" wireframe transparent opacity={0.06} toneMapped={false} />
      </mesh>
    </Float>
  );
};

/* ──────────────────────────────────────────────
   SCENE
   ────────────────────────────────────────────── */
const Scene: React.FC<{ mouse: React.RefObject<{ x: number; y: number }>; stateRef: React.MutableRefObject<{ scale: number; rotY: number; opacity: number }> }> = ({ mouse, stateRef }) => {
  const root = useRef<THREE.Group>(null!);

  useFrame((_, dt) => {
    if (!root.current) return;

    // scroll-driven state
    const s = stateRef.current.scale;
    root.current.scale.x += (s - root.current.scale.x) * Math.min(1, dt * 5);
    root.current.scale.y = root.current.scale.x;
    root.current.scale.z = root.current.scale.x;

    // mouse parallax — gentle, doesn't override scroll rotation
    if (mouse.current) {
      const ty = stateRef.current.rotY + mouse.current.x * 0.22;
      const tx = -mouse.current.y * 0.14;
      root.current.rotation.y += (ty - root.current.rotation.y) * Math.min(1, dt * 3);
      root.current.rotation.x += (tx - root.current.rotation.x) * Math.min(1, dt * 3);
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.4, 7.5]} fov={38} />

      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 5, 5]} intensity={1.2} color="#FFFFFF" />
      <directionalLight position={[-4, -2, 2]} intensity={0.7} color="#06B6D4" />
      <pointLight position={[0, 0, 4]} intensity={1.6} color="#7BB8FF" distance={10} />

      <Environment preset="warehouse" environmentIntensity={0.7}>
        <Lightformer form="rect" intensity={4} color="#7BB8FF" position={[3, 3, 2]} scale={[3, 3, 1]} />
        <Lightformer form="rect" intensity={3} color="#FFFFFF" position={[-3, 2, 1]} scale={[2, 4, 1]} />
      </Environment>

      {/* fluid GLSL noise gradient — flows in the deep background */}
      <GlslBackground mouse={mouse} />

      <group ref={root}>
        {/* SINGLE focal element — Lusion-style: one breathing iridescent shape, all the negative space around it */}
        <FocalObject />
      </group>

      {/* curl-noise particle field — replaces static sparkles */}
      <FlowParticles count={500} />

      {/* twinkle accents — toned down from prior overkill */}
      <Sparkles count={120} scale={[14, 8, 6]} size={1.8} speed={0.3} color="#FFFFFF" opacity={0.5} />
      <Sparkles count={60}  scale={[10, 6, 5]} size={2.4} speed={0.18} color="#06B6D4" opacity={0.45} />
      <Stars radius={32} depth={60} count={900} factor={2.4} saturation={0} fade speed={0.4} />

      {/* auto-scale DPR + throttle events when FPS drops on weaker devices */}
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      {/* ─── POST-PROCESSING — refined, not maxed out ──
         - Bloom much subtler (1.1 → 0.45) so glows don't wash out detail
         - ChromaticAberration cut by 6x (0.0014 → 0.00025) — was making the
           product photos look glitched (rainbow fringes)
         - Vignette softer (0.72 → 0.45) — less letterboxed
         - Removed grain on this scene (CinematicOverlay still adds it globally) */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.45}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.62}
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.00025, 0.00025)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette
          offset={0.42}
          darkness={0.45}
          eskil={false}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  );
};

/* ══════════════════════════════════════════════
   HERO SCENE 3D  (exposes setState for GSAP)
   ══════════════════════════════════════════════ */
export interface HeroSceneHandle {
  setScale:   (s: number) => void;
  setRotY:    (r: number) => void;
  setOpacity: (o: number) => void;
}

const HeroScene3D = React.forwardRef<HeroSceneHandle, {}>((_, forwardedRef) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse        = useRef({ x: 0, y: 0 });
  const stateRef     = useRef({ scale: 1, rotY: 0, opacity: 1 });

  React.useImperativeHandle(forwardedRef, () => ({
    setScale:   (s: number) => { stateRef.current.scale   = s; },
    setRotY:    (r: number) => { stateRef.current.rotY    = r; },
    setOpacity: (o: number) => {
      stateRef.current.opacity = o;
      if (containerRef.current) containerRef.current.style.opacity = String(o);
    },
  }));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative", transition: "opacity 200ms ease" }}>
      <Canvas
        dpr={[1, 1.25]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        camera={{ position: [0, 0.4, 7.5], fov: 38 }}
      >
        <Suspense fallback={null}>
          <Scene mouse={mouse} stateRef={stateRef} />
        </Suspense>
      </Canvas>
    </div>
  );
});

HeroScene3D.displayName = "HeroScene3D";

export default HeroScene3D;
