import React, { useRef, Suspense, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Float, Environment, ContactShadows, RoundedBox, useTexture,
  Sparkles, MeshTransmissionMaterial, PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";

/* ──────────────────────────────────────────────
   3D PHONE  — main floating phone with screen
────────────────────────────────────────────── */
const PhoneBody: React.FC<{ screenImg: string; mouse: React.RefObject<{ x: number; y: number }> }> = ({ screenImg, mouse }) => {
  const group = useRef<THREE.Group>(null!);
  const texture = useTexture(screenImg);
  // Image colour-space fix for r3f
  useEffect(() => { texture.colorSpace = THREE.SRGBColorSpace; }, [texture]);

  useFrame((_, dt) => {
    if (!group.current || !mouse.current) return;
    // Smoothly rotate phone toward mouse position
    const targetX = mouse.current.y * 0.35;
    const targetY = mouse.current.x * 0.5;
    group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, dt * 4);
    group.current.rotation.y += (targetY - group.current.rotation.y) * Math.min(1, dt * 4);
  });

  return (
    <group ref={group}>
      {/* phone body */}
      <RoundedBox args={[1.7, 3.4, 0.18]} radius={0.18} smoothness={6}>
        <meshStandardMaterial color="#0B1220" metalness={0.85} roughness={0.25} />
      </RoundedBox>

      {/* metallic edge ring */}
      <RoundedBox args={[1.78, 3.48, 0.16]} radius={0.20} smoothness={6}>
        <meshStandardMaterial color="#2B6CB8" metalness={1} roughness={0.15} />
      </RoundedBox>

      {/* screen (recessed) */}
      <mesh position={[0, 0, 0.095]}>
        <planeGeometry args={[1.5, 3.15]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      {/* screen glass overlay — subtle gloss */}
      <mesh position={[0, 0, 0.097]}>
        <planeGeometry args={[1.5, 3.15]} />
        <meshPhysicalMaterial
          color="white"
          transparent
          opacity={0.04}
          roughness={0.15}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* speaker / notch */}
      <mesh position={[0, 1.5, 0.1]}>
        <boxGeometry args={[0.45, 0.05, 0.02]} />
        <meshStandardMaterial color="#000" />
      </mesh>

      {/* camera dot */}
      <mesh position={[0.3, 1.5, 0.1]}>
        <circleGeometry args={[0.025, 24]} />
        <meshStandardMaterial color="#2B6CB8" emissive="#2B6CB8" emissiveIntensity={1} />
      </mesh>
    </group>
  );
};

/* ──────────────────────────────────────────────
   FLOATING GLASSY CARDS  (Active-Theory style)
────────────────────────────────────────────── */
const FloatingCard: React.FC<{ position: [number, number, number]; color: string; speed?: number; rotation?: [number, number, number] }> = ({ position, color, speed = 1.2, rotation = [0, 0, 0] }) => (
  <Float speed={speed} rotationIntensity={0.4} floatIntensity={0.8} floatingRange={[-0.15, 0.15]}>
    <mesh position={position} rotation={rotation}>
      <RoundedBox args={[0.9, 1.3, 0.04]} radius={0.08} smoothness={4}>
        <MeshTransmissionMaterial
          color={color}
          thickness={0.2}
          roughness={0.18}
          transmission={1}
          ior={1.45}
          chromaticAberration={0.05}
          anisotropy={0.5}
          distortion={0.2}
          distortionScale={0.3}
          temporalDistortion={0.1}
          backside={false}
        />
      </RoundedBox>
    </mesh>
  </Float>
);

/* ──────────────────────────────────────────────
   SCENE  (wraps lights, env, content)
────────────────────────────────────────────── */
const Scene: React.FC<{ screenImg: string; mouse: React.RefObject<{ x: number; y: number }> }> = ({ screenImg, mouse }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={32} />

      {/* lights */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} color="#7BB8FF" />
      <directionalLight position={[-3, -2, 2]} intensity={0.6} color="#06B6D4" />
      <pointLight position={[0, 0, 3]} intensity={1.4} color="#2B6CB8" distance={6} />

      {/* HDR env for nice reflections */}
      <Environment preset="city" />

      {/* main floating phone */}
      <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6} floatingRange={[-0.1, 0.1]}>
        <PhoneBody screenImg={screenImg} mouse={mouse} />
      </Float>

      {/* floating glassy cards beside the phone */}
      <FloatingCard position={[-2.0, 0.8,  -0.6]} color="#7BB8FF" speed={1.1} rotation={[0.1, 0.4, 0.05]} />
      <FloatingCard position={[ 2.0, 0.4,  -0.6]} color="#06B6D4" speed={1.5} rotation={[-0.1, -0.4, -0.05]} />
      <FloatingCard position={[-1.7,-1.0,  -1.0]} color="#8B5CF6" speed={1.3} rotation={[-0.2, 0.5, 0.12]} />
      <FloatingCard position={[ 1.8,-0.9,  -1.0]} color="#F59E0B" speed={1.0} rotation={[0.2, -0.5, -0.1]} />

      {/* magical sparkles */}
      <Sparkles count={80} scale={[7, 4, 3]} size={2.4} speed={0.4} color="#7BB8FF" opacity={0.6} />
      <Sparkles count={40} scale={[5, 3, 2]} size={1.4} speed={0.3} color="#FFFFFF" opacity={0.5} />

      {/* soft contact shadow below */}
      <ContactShadows position={[0, -2.0, 0]} opacity={0.4} scale={6} blur={2.5} far={3} />
    </>
  );
};

/* ──────────────────────────────────────────────
   PHONE3D  (main export)
────────────────────────────────────────────── */
const Phone3D: React.FC<{ screenImg: string }> = ({ screenImg }) => {
  const mouse = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      mouse.current.y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    };
    const onLeave = () => { mouse.current.x = 0; mouse.current.y = 0; };
    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 6], fov: 32 }}
      >
        <Suspense fallback={null}>
          <Scene screenImg={screenImg} mouse={mouse} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Phone3D;
