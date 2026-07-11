/*
 * AnimatedBackground — fullscreen aurora + orbs + floating particles.
 * Purely presentational, pointer-events: none, sits behind the app.
 */
import { motion } from "motion/react";
import { useMemo } from "react";

interface Props {
  auraColor?: string;
}

export function AnimatedBackground({ auraColor = "oklch(0.78 0.16 350)" }: Props) {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        x: (i * 137.508) % 100,
        y: (i * 71.3) % 100,
        size: 4 + ((i * 13) % 10),
        dur: 14 + ((i * 7) % 14),
        delay: (i * 0.9) % 8,
        drift: 40 + ((i * 17) % 90),
      })),
    []
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: (i * 53.7) % 100,
        y: (i * 29.1) % 100,
        size: 1 + ((i * 3) % 3),
        dur: 2 + ((i * 5) % 5),
        delay: (i * 0.4) % 4,
      })),
    []
  );

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.97 0.03 320) 0%, oklch(0.96 0.04 260) 50%, oklch(0.94 0.05 220) 100%)",
      }}
    >
      {/* Aurora conic layer */}
      <motion.div
        className="absolute -inset-[20%] opacity-70"
        style={{
          background: `conic-gradient(from 90deg at 50% 50%,
            ${auraColor} 0deg,
            transparent 60deg,
            oklch(0.85 0.14 220) 140deg,
            transparent 200deg,
            oklch(0.88 0.14 300) 280deg,
            ${auraColor} 360deg)`,
          filter: "blur(90px)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* Soft orbs */}
      <motion.div
        className="absolute h-[520px] w-[520px] rounded-full"
        style={{
          top: "-10%",
          left: "-15%",
          background: `radial-gradient(circle, ${auraColor}, transparent 70%)`,
          filter: "blur(60px)",
          opacity: 0.55,
        }}
        animate={{ x: [0, 80, -40, 0], y: [0, 60, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-[480px] w-[480px] rounded-full"
        style={{
          bottom: "-15%",
          right: "-10%",
          background:
            "radial-gradient(circle, oklch(0.82 0.16 220), transparent 70%)",
          filter: "blur(70px)",
          opacity: 0.5,
        }}
        animate={{ x: [0, -60, 30, 0], y: [0, -40, -20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-[380px] w-[380px] rounded-full"
        style={{
          top: "35%",
          left: "40%",
          background:
            "radial-gradient(circle, oklch(0.85 0.14 90), transparent 70%)",
          filter: "blur(60px)",
          opacity: 0.35,
        }}
        animate={{ scale: [1, 1.15, 1], x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Twinkling stars */}
      {stars.map((s) => (
        <motion.span
          key={`s${s.id}`}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            boxShadow: `0 0 ${s.size * 3}px rgba(255,255,255,0.8)`,
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.6, 1.1, 0.6] }}
          transition={{
            duration: s.dur,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Floating pastel particles */}
      {particles.map((p) => (
        <motion.span
          key={`p${p.id}`}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background:
              p.id % 3 === 0
                ? "oklch(0.85 0.14 340)"
                : p.id % 3 === 1
                  ? "oklch(0.82 0.14 220)"
                  : "oklch(0.85 0.14 90)",
            filter: "blur(1px)",
            opacity: 0.5,
          }}
          animate={{
            y: [-10, -p.drift, -10],
            x: [0, p.id % 2 === 0 ? 20 : -20, 0],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Vignette + noise */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(20,10,40,0.18) 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}
