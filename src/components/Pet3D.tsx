/*
 * src/components/Pet3D.tsx
 * A polished, professional 3D pet built with React Three Fiber.
 * Rigged from primitives: body, belly, head, ears, eyes, pupils, eyelids,
 * cheeks, mouth, arms, legs, tail. Driven by mood + micro-animations at 60fps.
 * SSR-safe: the <Canvas> only mounts after client hydration.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  Html,
  MeshTransmissionMaterial,
  Outlines,
} from "@react-three/drei";
import * as THREE from "three";
import { AnimatePresence, motion } from "motion/react";
import type { Mood, Reaction, Stage } from "@/lib/pet-store";
import type { PetPalette } from "@/lib/species";

interface Props {
  mood: Mood;
  stage: Stage;
  reaction: Reaction | null;
  hat: string | null;
  floaters: { id: number; icon: string; x: number }[];
  onTap: () => void;
  isDead?: boolean;
  isCritical?: boolean;
  palette?: PetPalette;
  evolving?: boolean;
}

const DEFAULT_PALETTE: PetPalette = {
  body: ["#ffd1e0", "#ffa8c5", "#ff88ae"],
  belly: ["#fff2f6", "#ffd3e0"],
  ear: ["#ffbcd2", "#ff8fb1"],
  stroke: "#e56a92",
  aura: "oklch(0.78 0.16 350)",
};

const REACTION_EMOJI: Record<Reaction, string> = {
  love: "💖", yum: "😋", sleepy: "💤", clean: "🫧", excited: "🤩",
  wow: "✨", sad: "😢", sick: "🤒", angry: "😡", scared: "😨",
  cold: "🥶", hot: "🥵", inlove: "😍", crying: "😭",
};

const HAT_EMOJI: Record<string, string> = {
  "hat-crown": "👑",
  "hat-cap": "🧢",
  "hat-party": "🎉",
};

/* ─────────────────────────────────────────────────────────── */
/*  Creature — rigged from primitives                          */
/* ─────────────────────────────────────────────────────────── */

interface CreatureProps {
  mood: Mood;
  stage: Stage;
  palette: PetPalette;
  onTap: () => void;
  isDead: boolean;
  isCritical: boolean;
  hat: string | null;
}

function Creature({ mood, stage, palette, onTap, isDead, isCritical, hat }: CreatureProps) {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const earL = useRef<THREE.Group>(null!);
  const earR = useRef<THREE.Group>(null!);
  const pupilL = useRef<THREE.Group>(null!);
  const pupilR = useRef<THREE.Group>(null!);
  const lidL = useRef<THREE.Mesh>(null!);
  const lidR = useRef<THREE.Mesh>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const tail = useRef<THREE.Group>(null!);
  const mouth = useRef<THREE.Mesh>(null!);
  const cheekL = useRef<THREE.Mesh>(null!);
  const cheekR = useRef<THREE.Mesh>(null!);

  // Randomized blink schedule
  const nextBlink = useRef(1 + Math.random() * 3);
  const blinking = useRef(0);
  const gaze = useRef({ x: 0, y: 0, tx: 0, ty: 0, t: 0 });
  const [pressed, setPressed] = useState(false);
  const pressT = useRef(0);

  // Scale by stage: baby smaller, adult bigger
  const scale = stage === "baby" ? 0.85 : stage === "child" ? 1.0 : 1.15;

  // Colors
  const bodyColor = palette.body[1];
  const bodyLight = palette.body[0];
  const bellyColor = palette.belly[0];
  const earColor = palette.ear[0];
  const strokeColor = palette.stroke;

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const clampedDt = Math.min(dt, 0.06);

    // Global mood transforms
    const moodBob = isDead ? 0 : (mood === "sleep" ? 0.02 : 0.05) * Math.sin(t * (mood === "excited" || mood === "play" ? 4.5 : 1.8));
    const breath = 1 + (isDead ? 0 : 0.035 * Math.sin(t * (mood === "sleep" ? 1.4 : 2.2)));
    const critShiver = isCritical ? Math.sin(t * 22) * 0.02 : 0;

    // Root idle bob + press squash
    pressT.current = THREE.MathUtils.damp(pressT.current, pressed ? 1 : 0, 12, clampedDt);
    if (root.current) {
      root.current.position.y = moodBob + critShiver;
      const jump = mood === "excited" || mood === "play"
        ? Math.max(0, Math.sin(t * 3.2)) * 0.15
        : 0;
      root.current.position.y += jump;
      root.current.rotation.z = mood === "sad" || mood === "crying"
        ? -0.05
        : mood === "inlove"
        ? Math.sin(t * 2.3) * 0.06
        : mood === "excited"
        ? Math.sin(t * 5) * 0.04
        : 0;
      // Dance / walk drift
      if (mood === "play" || mood === "happy") {
        root.current.position.x = Math.sin(t * 1.1) * 0.35;
        root.current.rotation.y = Math.sin(t * 1.1) * 0.25;
      } else {
        root.current.position.x = THREE.MathUtils.damp(root.current.position.x, 0, 4, clampedDt);
        root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, 0, 4, clampedDt);
      }
    }

    // Body: breathing + squash on press
    if (body.current) {
      const squash = pressT.current * 0.12;
      body.current.scale.set(breath + squash, breath - squash, breath + squash);
    }

    // Head bob + tilt by mood
    if (head.current) {
      const nod = Math.sin(t * 2.2) * 0.03;
      const tilt =
        mood === "sad" || mood === "crying" || mood === "sick" || mood === "tired"
          ? 0.25
          : mood === "sleep"
          ? 0.45
          : mood === "inlove"
          ? Math.sin(t * 1.6) * 0.12
          : mood === "happy" || mood === "excited"
          ? -0.06
          : 0;
      head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, tilt, 3, clampedDt);
      head.current.rotation.z = Math.sin(t * 1.3) * 0.04;
      head.current.position.y = 0.85 + nod * 0.5;
    }

    // Ears wiggle
    if (earL.current && earR.current) {
      const wiggle = mood === "scared" ? Math.sin(t * 14) * 0.25 : Math.sin(t * 1.7) * 0.09;
      earL.current.rotation.z = 0.35 + wiggle;
      earR.current.rotation.z = -0.35 - wiggle;
      const droop = mood === "sad" || mood === "sick" || mood === "crying" || mood === "sleep" ? 0.6 : 0;
      earL.current.rotation.x = droop;
      earR.current.rotation.x = droop;
    }

    // Eyes: gaze wander + blink
    gaze.current.t -= clampedDt;
    if (gaze.current.t <= 0) {
      gaze.current.tx = (Math.random() - 0.5) * 0.08;
      gaze.current.ty = (Math.random() - 0.5) * 0.05;
      gaze.current.t = 1.2 + Math.random() * 2.4;
    }
    gaze.current.x = THREE.MathUtils.damp(gaze.current.x, gaze.current.tx, 5, clampedDt);
    gaze.current.y = THREE.MathUtils.damp(gaze.current.y, gaze.current.ty, 5, clampedDt);
    if (pupilL.current && pupilR.current) {
      pupilL.current.position.x = -0.22 + gaze.current.x;
      pupilR.current.position.x = 0.22 + gaze.current.x;
      pupilL.current.position.y = 0.02 + gaze.current.y;
      pupilR.current.position.y = 0.02 + gaze.current.y;
    }

    nextBlink.current -= clampedDt;
    if (nextBlink.current <= 0 && blinking.current <= 0) {
      blinking.current = 0.16;
      nextBlink.current = 2 + Math.random() * 3.5;
    }
    if (blinking.current > 0) blinking.current -= clampedDt;
    const closedFromMood = mood === "sleep" || isDead ? 1 : mood === "tired" ? 0.35 : 0;
    const lidScale = Math.max(closedFromMood, blinking.current > 0 ? 1 : 0);
    if (lidL.current && lidR.current) {
      lidL.current.scale.y = THREE.MathUtils.damp(lidL.current.scale.y, lidScale, 18, clampedDt);
      lidR.current.scale.y = THREE.MathUtils.damp(lidR.current.scale.y, lidScale, 18, clampedDt);
    }

    // Cheeks glow (love/happy)
    if (cheekL.current && cheekR.current) {
      const glow = mood === "inlove" || mood === "happy" || mood === "excited" ? 1 : 0.35;
      const mat = cheekL.current.material as THREE.MeshStandardMaterial;
      const mat2 = cheekR.current.material as THREE.MeshStandardMaterial;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, glow, 4, clampedDt);
      mat2.opacity = mat.opacity;
    }

    // Mouth: rotate/scale by mood
    if (mouth.current) {
      const target =
        mood === "sad" || mood === "crying" ? Math.PI : mood === "sleep" || isDead ? Math.PI * 0.5 : 0;
      mouth.current.rotation.z = THREE.MathUtils.damp(mouth.current.rotation.z, target, 4, clampedDt);
      const wide = mood === "excited" || mood === "play" || mood === "happy" ? 1.4 : 1;
      mouth.current.scale.x = THREE.MathUtils.damp(mouth.current.scale.x, wide, 6, clampedDt);
    }

    // Arms swing
    if (armL.current && armR.current) {
      const s = mood === "excited" || mood === "play" ? 3.6 : mood === "sleep" ? 0 : 1.4;
      const amp = mood === "excited" ? 1.1 : mood === "play" ? 0.7 : 0.25;
      armL.current.rotation.z = 0.9 + Math.sin(t * s) * amp;
      armR.current.rotation.z = -0.9 - Math.sin(t * s + 0.3) * amp;
    }

    // Legs (light step motion when moving)
    if (legL.current && legR.current) {
      const active = mood === "play" || mood === "happy" || mood === "excited";
      const s = active ? 6 : 0;
      const amp = active ? 0.2 : 0;
      legL.current.rotation.x = Math.sin(t * s) * amp;
      legR.current.rotation.x = -Math.sin(t * s) * amp;
    }

    // Tail wag
    if (tail.current) {
      const wag = mood === "happy" || mood === "excited" || mood === "inlove" || mood === "play"
        ? Math.sin(t * 8) * 0.9
        : mood === "sad" || mood === "sick" || mood === "crying"
        ? -0.4
        : Math.sin(t * 1.8) * 0.25;
      tail.current.rotation.z = wag;
    }
  });

  // Materials — physical, silky
  const bodyMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: bodyColor,
        roughness: 0.45,
        clearcoat: 0.6,
        clearcoatRoughness: 0.3,
        sheen: 0.8,
        sheenRoughness: 0.4,
        sheenColor: new THREE.Color(bodyLight),
      }),
    [bodyColor, bodyLight]
  );
  const bellyMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: bellyColor,
        roughness: 0.5,
        clearcoat: 0.4,
      }),
    [bellyColor]
  );
  const earMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: earColor,
        roughness: 0.5,
        clearcoat: 0.5,
      }),
    [earColor]
  );

  return (
    <group
      ref={root}
      scale={scale}
      onPointerDown={(e) => {
        e.stopPropagation();
        setPressed(true);
        onTap();
      }}
      onPointerUp={() => setPressed(false)}
      onPointerOut={() => setPressed(false)}
    >
      {/* Legs */}
      <group ref={legL} position={[-0.35, -0.9, 0.05]}>
        <mesh position={[0, -0.15, 0]} material={bodyMat} castShadow>
          <capsuleGeometry args={[0.18, 0.15, 6, 12]} />
          <Outlines thickness={2.2} color={strokeColor} />
        </mesh>
      </group>
      <group ref={legR} position={[0.35, -0.9, 0.05]}>
        <mesh position={[0, -0.15, 0]} material={bodyMat} castShadow>
          <capsuleGeometry args={[0.18, 0.15, 6, 12]} />
          <Outlines thickness={2.2} color={strokeColor} />
        </mesh>
      </group>

      {/* Body */}
      <group ref={body} position={[0, 0, 0]}>
        <mesh material={bodyMat} castShadow receiveShadow>
          <sphereGeometry args={[0.85, 48, 48]} />
          <Outlines thickness={2.5} color={strokeColor} />
        </mesh>
        {/* Belly */}
        <mesh position={[0, -0.05, 0.55]} scale={[0.7, 0.85, 0.5]} material={bellyMat}>
          <sphereGeometry args={[0.6, 32, 32]} />
        </mesh>
        {/* Tail */}
        <group ref={tail} position={[0, -0.1, -0.75]}>
          <mesh position={[0, 0.15, -0.15]} material={bodyMat} castShadow>
            <sphereGeometry args={[0.22, 24, 24]} />
            <Outlines thickness={2} color={strokeColor} />
          </mesh>
        </group>
      </group>

      {/* Arms */}
      <group ref={armL} position={[-0.75, 0.1, 0.15]}>
        <mesh position={[-0.05, -0.25, 0]} material={bodyMat} castShadow>
          <capsuleGeometry args={[0.16, 0.35, 6, 12]} />
          <Outlines thickness={2} color={strokeColor} />
        </mesh>
      </group>
      <group ref={armR} position={[0.75, 0.1, 0.15]}>
        <mesh position={[0.05, -0.25, 0]} material={bodyMat} castShadow>
          <capsuleGeometry args={[0.16, 0.35, 6, 12]} />
          <Outlines thickness={2} color={strokeColor} />
        </mesh>
      </group>

      {/* Head */}
      <group ref={head} position={[0, 0.85, 0]}>
        <mesh material={bodyMat} castShadow>
          <sphereGeometry args={[0.75, 48, 48]} />
          <Outlines thickness={2.5} color={strokeColor} />
        </mesh>

        {/* Ears */}
        <group ref={earL} position={[-0.42, 0.55, 0]}>
          <mesh position={[0, 0.3, 0]} scale={[0.55, 1.4, 0.55]} material={earMat} castShadow>
            <sphereGeometry args={[0.22, 24, 24]} />
            <Outlines thickness={1.8} color={strokeColor} />
          </mesh>
          <mesh position={[0, 0.3, 0.06]} scale={[0.3, 1.1, 0.15]}>
            <sphereGeometry args={[0.18, 20, 20]} />
            <meshStandardMaterial color={palette.body[0]} roughness={0.6} />
          </mesh>
        </group>
        <group ref={earR} position={[0.42, 0.55, 0]}>
          <mesh position={[0, 0.3, 0]} scale={[0.55, 1.4, 0.55]} material={earMat} castShadow>
            <sphereGeometry args={[0.22, 24, 24]} />
            <Outlines thickness={1.8} color={strokeColor} />
          </mesh>
          <mesh position={[0, 0.3, 0.06]} scale={[0.3, 1.1, 0.15]}>
            <sphereGeometry args={[0.18, 20, 20]} />
            <meshStandardMaterial color={palette.body[0]} roughness={0.6} />
          </mesh>
        </group>

        {/* Eye whites */}
        <mesh position={[-0.22, 0.05, 0.62]}>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0.22, 0.05, 0.62]}>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>

        {/* Pupils */}
        <group ref={pupilL} position={[-0.22, 0.05, 0.75]}>
          <mesh>
            <sphereGeometry args={[0.075, 20, 20]} />
            <meshStandardMaterial color="#1a1230" roughness={0.2} />
          </mesh>
          {/* highlight */}
          <mesh position={[0.025, 0.025, 0.045]}>
            <sphereGeometry args={[0.022, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
        <group ref={pupilR} position={[0.22, 0.05, 0.75]}>
          <mesh>
            <sphereGeometry args={[0.075, 20, 20]} />
            <meshStandardMaterial color="#1a1230" roughness={0.2} />
          </mesh>
          <mesh position={[0.025, 0.025, 0.045]}>
            <sphereGeometry args={[0.022, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* Eyelids (top-down scale to close) */}
        <mesh ref={lidL} position={[-0.22, 0.1, 0.72]} scale={[1, 0, 1]}>
          <sphereGeometry args={[0.145, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={bodyColor} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={lidR} position={[0.22, 0.1, 0.72]} scale={[1, 0, 1]}>
          <sphereGeometry args={[0.145, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={bodyColor} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>

        {/* Cheeks */}
        <mesh ref={cheekL} position={[-0.36, -0.12, 0.55]}>
          <sphereGeometry args={[0.09, 20, 20]} />
          <meshStandardMaterial color="#ff6da5" transparent opacity={0.6} roughness={0.4} />
        </mesh>
        <mesh ref={cheekR} position={[0.36, -0.12, 0.55]}>
          <sphereGeometry args={[0.09, 20, 20]} />
          <meshStandardMaterial color="#ff6da5" transparent opacity={0.6} roughness={0.4} />
        </mesh>

        {/* Mouth (half-torus smile) */}
        <mesh ref={mouth} position={[0, -0.18, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.022, 12, 24, Math.PI]} />
          <meshStandardMaterial color={strokeColor} roughness={0.4} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.02, 0.76]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color={strokeColor} roughness={0.3} />
        </mesh>

        {/* Hat */}
        {hat && HAT_EMOJI[hat] && (
          <Html position={[0, 0.95, 0]} center transform occlude={false} distanceFactor={8}>
            <div style={{ fontSize: 48, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25))" }}>
              {HAT_EMOJI[hat]}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Scene wrapper                                              */
/* ─────────────────────────────────────────────────────────── */

function Scene(props: CreatureProps) {
  return (
    <>
      <color attach="background" args={["#00000000" as unknown as string]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 2, -3]} intensity={0.6} color="#b6d5ff" />
      <pointLight position={[0, -2, 3]} intensity={0.5} color={props.palette.aura} />

      <Suspense fallback={null}>
        <Environment preset="apartment" />
      </Suspense>

      <Float floatIntensity={0.4} rotationIntensity={0.15} speed={1.2}>
        <Creature {...props} />
      </Float>

      <ContactShadows
        position={[0, -1.15, 0]}
        opacity={0.45}
        scale={5}
        blur={2.6}
        far={3}
        color="#5a3a70"
      />
    </>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Public component                                           */
/* ─────────────────────────────────────────────────────────── */

export function Pet3D({
  mood,
  stage,
  reaction,
  hat,
  floaters,
  onTap,
  isDead = false,
  isCritical = false,
  palette = DEFAULT_PALETTE,
  evolving = false,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="relative w-full h-full max-w-[420px] mx-auto select-none">
      {/* Soft aura */}
      <div
        className="absolute inset-6 rounded-full blur-3xl opacity-70 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 55%, ${palette.aura}, transparent 65%)`,
        }}
      />

      {mounted ? (
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0.4, 4.2], fov: 32 }}
          gl={{ antialias: true, alpha: true }}
          style={{ touchAction: "manipulation" }}
        >
          <Scene
            mood={mood}
            stage={stage}
            palette={palette}
            onTap={onTap}
            isDead={isDead}
            isCritical={isCritical}
            hat={hat}
          />
        </Canvas>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-60">
          🐾
        </div>
      )}

      {/* Reaction bubble */}
      <AnimatePresence>
        {reaction && (
          <motion.div
            key={reaction}
            initial={{ opacity: 0, y: 10, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-4 text-4xl drop-shadow-lg"
          >
            {REACTION_EMOJI[reaction]}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating icons on interaction */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <AnimatePresence>
          {floaters.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 40, scale: 0.6 }}
              animate={{ opacity: 1, y: -120, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="absolute bottom-24 text-3xl"
              style={{ left: `${f.x}%` }}
            >
              {f.icon}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Evolution flash */}
      <AnimatePresence>
        {evolving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, times: [0, 0.15, 0.75, 1] }}
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background:
                "radial-gradient(circle at center, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
