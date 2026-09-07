import React, { useRef, useMemo, Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Sparkles } from "@react-three/drei";
import * as THREE from "three";

interface HeroCanvasProps {
  dragProgress: number; // 0 to 1
  isWarping: boolean;
  onWarpComplete: () => void;
}

// Undulating 3D Topographical & Flood Bathymetry Wireframe
function UndulatingTerrain({ isWarping }: { isWarping: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geomRef = useRef<THREE.PlaneGeometry>(null);

  useFrame(({ clock }) => {
    if (!geomRef.current) return;
    const pos = geomRef.current.attributes.position;
    const time = clock.elapsedTime * (isWarping ? 5.0 : 1.2);

    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getY(i);
      // Dual-harmonic sine/cosine wave for realistic fluid bathymetry
      const elevation =
        Math.sin(u * 0.32 + time) * Math.cos(v * 0.32 + time * 0.8) * 0.45 +
        Math.sin((u + v) * 0.18 + time * 1.4) * 0.22;
      pos.setZ(i, elevation);
    }
    pos.needsUpdate = true;
  });

  return (
    <group position={[0, -1.8, -1]} rotation={[-Math.PI / 2.3, 0, 0]}>
      {/* Underlying deep dark ocean floor */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[34, 24, 16, 16]} />
        <meshStandardMaterial color="#020612" roughness={0.9} />
      </mesh>

      {/* Undulating wireframe elevation grid */}
      <mesh ref={meshRef}>
        <planeGeometry ref={geomRef} args={[34, 24, 54, 40]} />
        <meshStandardMaterial
          wireframe
          color="#00f2fe"
          emissive="#00f2fe"
          emissiveIntensity={isWarping ? 1.0 : 0.5}
          transparent
          opacity={isWarping ? 0.8 : 0.45}
        />
      </mesh>
    </group>
  );
}

// 3D Extruded Metallic/Glass Title & Edge Glow
function Title3D({
  dragProgress,
  isWarping,
}: {
  dragProgress: number;
  isWarping: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Gentle breathing levitation
    const t = clock.elapsedTime;
    if (!isWarping) {
      groupRef.current.position.y = 0.35 + Math.sin(t * 1.5) * 0.05;
    }
  });

  // Expand letter-spacing as user drags slider
  const letterSpacing = 0.18 + dragProgress * 0.16;
  const glowIntensity = 0.35 + dragProgress * 0.6 + (isWarping ? 1.8 : 0);

  return (
    <group ref={groupRef} position={[0, 0.35, 0]}>
      {/* Main 3D Title (Zero network dependency: uses default embedded typeface) */}
      <Text
        fontSize={0.92}
        letterSpacing={letterSpacing}
        position={[0, 0, 0]}
        anchorX="center"
        anchorY="middle"
      >
        HYDROGRAPH
        <meshPhysicalMaterial
          color="#ffffff"
          emissive="#00f2fe"
          emissiveIntensity={glowIntensity}
          roughness={0.12}
          metalness={0.92}
          reflectivity={0.9}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Text>

      {/* Tactical Sub-Headline in 3D Space */}
      <Text
        fontSize={0.11}
        letterSpacing={0.32}
        position={[0, -0.68, 0.05]}
        anchorX="center"
        anchorY="middle"
      >
        DISASTER COMMAND &amp; FLOOD NOWCASTING PLATFORM
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.6}
        />
      </Text>

      {/* Floating 3D HUD Reticle Framing Corner Brackets */}
      <group position={[0, -0.05, 0]}>
        {/* Top-Left Bracket */}
        <lineSegments position={[-3.6, 0.6, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 0.4, 0, 0, 0, 0, 0, 0, -0.4, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00f2fe" transparent opacity={0.6} />
        </lineSegments>

        {/* Top-Right Bracket */}
        <lineSegments position={[3.6, 0.6, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, -0.4, 0, 0, 0, 0, 0, 0, -0.4, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00f2fe" transparent opacity={0.6} />
        </lineSegments>

        {/* Bottom-Left Bracket */}
        <lineSegments position={[-3.6, -0.85, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 0.4, 0, 0, 0, 0, 0, 0, 0.4, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00f2fe" transparent opacity={0.6} />
        </lineSegments>

        {/* Bottom-Right Bracket */}
        <lineSegments position={[3.6, -0.85, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, -0.4, 0, 0, 0, 0, 0, 0, 0.4, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00f2fe" transparent opacity={0.6} />
        </lineSegments>
      </group>
    </group>
  );
}

// Camera Rig: Mouse Parallax & Cinematic Dolly-In Warp Jump
function CameraRig({
  isWarping,
  onWarpComplete,
}: {
  isWarping: boolean;
  onWarpComplete: () => void;
}) {
  const { camera } = useThree();
  const warpStartRef = useRef<number | null>(null);
  const completedRef = useRef<boolean>(false);

  // Safety timer fallback to guarantee transition completes
  useEffect(() => {
    if (isWarping) {
      const timer = setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          onWarpComplete();
        }
      }, 950);
      return () => clearTimeout(timer);
    }
  }, [isWarping, onWarpComplete]);

  useFrame(({ clock, pointer }) => {
    if (!isWarping) {
      // Smooth mouse parallax lerping
      const targetX = pointer.x * 0.65;
      const targetY = pointer.y * 0.35 + 0.35;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 5.2, 0.05);
      camera.lookAt(0, 0.1, 0);
    } else {
      // Warp jump sequence: burst forward through text
      if (warpStartRef.current === null) {
        warpStartRef.current = clock.elapsedTime;
      }
      const elapsed = clock.elapsedTime - warpStartRef.current;
      const duration = 0.85; // 850ms warp
      const progress = Math.min(1, elapsed / duration);

      // Ease in-out cubic acceleration
      const easeProgress = progress * progress * progress;

      // Dolly from z=5.2 straight through z=-3.5
      camera.position.z = THREE.MathUtils.lerp(5.2, -3.5, easeProgress);
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.1);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.35, 0.1);

      // Expand camera FOV for extreme speed sensation
      if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        const persCam = camera as THREE.PerspectiveCamera;
        persCam.fov = THREE.MathUtils.lerp(48, 88, easeProgress);
        persCam.updateProjectionMatrix();
      }

      if (progress >= 1 && !completedRef.current) {
        completedRef.current = true;
        onWarpComplete();
      }
    }
  });

  return null;
}

// Orbiting Rim Light for glinting metallic edges
function MovingRimLight({ isWarping }: { isWarping: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const t = clock.elapsedTime * (isWarping ? 3 : 0.8);
    lightRef.current.position.x = Math.sin(t) * 4.5;
    lightRef.current.position.y = Math.cos(t * 0.8) * 2 + 1;
    lightRef.current.position.z = 2.5;
  });

  return (
    <pointLight
      ref={lightRef}
      color="#00f2fe"
      intensity={isWarping ? 8 : 4.5}
      distance={14}
    />
  );
}

export default function HeroCanvas({
  dragProgress,
  isWarping,
  onWarpComplete,
}: HeroCanvasProps) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto select-none bg-[#030712] overflow-hidden">
      <Canvas
        camera={{ position: [0, 0.4, 5.2], fov: 48 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          {/* Background & Volumetric Fog */}
          <color attach="background" args={["#030712"]} />
          <fog attach="fog" args={["#030712", 4.5, 16]} />

          {/* Ambient & Directional Lighting */}
          <ambientLight intensity={0.45} color="#082f49" />
          <directionalLight position={[0, 6, 4]} intensity={1.3} color="#bae6fd" />
          <MovingRimLight isWarping={isWarping} />

          {/* Dynamic Bathymetric Wireframe Terrain */}
          <UndulatingTerrain isWarping={isWarping} />

          {/* Floating Digital Dust & Underwater Caustic Particles */}
          <Sparkles
            count={90}
            scale={[14, 8, 9]}
            size={2.8}
            speed={0.45}
            opacity={isWarping ? 0.9 : 0.55}
            color="#38bdf8"
          />

          {/* 3D Title Typography & HUD */}
          <Title3D dragProgress={dragProgress} isWarping={isWarping} />

          {/* Camera Rig with Parallax & Warp Jump */}
          <CameraRig isWarping={isWarping} onWarpComplete={onWarpComplete} />
        </Suspense>
      </Canvas>
    </div>
  );
}
