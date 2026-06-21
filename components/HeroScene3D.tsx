import React, { useRef, Suspense, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float, Environment, RoundedBox, Sparkles, Stars,
  PerspectiveCamera, Lightformer, useTexture, Text,
} from "@react-three/drei";
import {
  EffectComposer, Bloom, ChromaticAberration, Vignette, Noise,
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
   CENTRAL GLOWING ORB  — "the auction nucleus"
   ══════════════════════════════════════════════ */
const AuctionOrb: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.4;
      ref.current.rotation.x += dt * 0.15;
    }
  });
  return (
    <Float speed={1.6} rotationIntensity={0.3} floatIntensity={0.4} floatingRange={[-0.1, 0.1]}>
      <group>
        {/* core */}
        <mesh ref={ref}>
          <icosahedronGeometry args={[0.32, 1]} />
          <meshStandardMaterial
            color="#7BB8FF"
            emissive="#06B6D4"
            emissiveIntensity={4.5}
            metalness={0.6}
            roughness={0.15}
            toneMapped={false}
          />
        </mesh>
        {/* outer wireframe shell — bright for bloom */}
        <mesh>
          <icosahedronGeometry args={[0.55, 1]} />
          <meshBasicMaterial color="#7BB8FF" wireframe transparent opacity={0.7} toneMapped={false} />
        </mesh>
        {/* extra glow plane behind orb */}
        <mesh position={[0, 0, -0.3]}>
          <planeGeometry args={[2.4, 2.4]} />
          <meshBasicMaterial color="#06B6D4" transparent opacity={0.35} toneMapped={false} />
        </mesh>
      </group>
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
        <AuctionOrb />

        {/* product cards arranged in a constellation around the orb */}
        <ProductCard data={PRODUCTS[0]} position={[ 0,    1.6, -0.2]} rotation={[0,  0.0, 0]}   scale={1.0} speed={1.4} />
        <ProductCard data={PRODUCTS[1]} position={[-2.6,  0.7, -0.8]} rotation={[0,  0.45, 0]}  scale={0.78} speed={1.2} />
        <ProductCard data={PRODUCTS[2]} position={[ 2.6,  0.6, -0.8]} rotation={[0, -0.45, 0]}  scale={0.78} speed={1.5} />
        <ProductCard data={PRODUCTS[3]} position={[-2.2, -1.2, -1.4]} rotation={[0,  0.55, 0]}  scale={0.65} speed={1.1} />
        <ProductCard data={PRODUCTS[4]} position={[ 2.2, -1.3, -1.4]} rotation={[0, -0.55, 0]}  scale={0.65} speed={1.6} />
      </group>

      {/* curl-noise particle field — replaces static sparkles */}
      <FlowParticles count={1200} />

      {/* twinkle accents */}
      <Sparkles count={260} scale={[14, 8, 6]} size={2.2} speed={0.35} color="#FFFFFF" opacity={0.6} />
      <Sparkles count={140} scale={[10, 6, 5]} size={3.0} speed={0.2}  color="#06B6D4" opacity={0.55} />
      <Stars radius={32} depth={60} count={1800} factor={3.0} saturation={0} fade speed={0.5} />

      {/* ─── POST-PROCESSING PIPELINE ─── */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.1}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.85}
          mipmapBlur
          radius={0.78}
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.0014, 0.0014)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette
          offset={0.32}
          darkness={0.72}
          eskil={false}
          blendFunction={BlendFunction.NORMAL}
        />
        <Noise
          opacity={0.04}
          premultiply
          blendFunction={BlendFunction.SOFT_LIGHT}
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
        dpr={[1, 1.7]}
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
