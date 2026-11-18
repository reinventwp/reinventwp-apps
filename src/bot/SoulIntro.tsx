import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Box, Link, Typography } from "@mui/material";
import { useEffect, useRef, type ReactNode } from "react";
import { LINK_SX } from "./linkStyle";
import useTypewriter from "./useTypewriter";

const BLUE = "#2F80ED";
const VIOLET = "#8B5CF6";
const CYAN = "#22C3E6";

/** The AI Agent tone: blue to violet, used for the word "soul" and the panel title. */
export const AGENT_BLUE = BLUE;

/**
 * Text drawn in the AI Agent tone: a blue, violet and cyan gradient that slowly moves through the
 * letters (still for people who prefer reduced motion). Used for "soul" and the panel title.
 */
export const AGENT_SHIMMER = {
  backgroundImage: `linear-gradient(90deg, ${BLUE}, ${VIOLET}, ${CYAN}, ${BLUE})`,
  backgroundSize: "300% 100%",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  "@keyframes soulShimmer": { from: { backgroundPosition: "0% 50%" }, to: { backgroundPosition: "300% 50%" } },
  animation: "soulShimmer 8s linear infinite",
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
} as const;

/** The chat's padding, which the scene reaches across to touch the panel's edges. */
const BLEED = 16;

/** Room kept at the top for the panel's header icons, which float over the scene on the welcome. */
const HEADER = 30;

const still = { "@media (prefers-reduced-motion: reduce)": { animation: "none", opacity: 1, transform: "none" } } as const;

/** Fades the left and right ends away, so the helix has no visible start or end. */
const FADE_SIDES = "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)";

/** Fades the scene out at the bottom, so the lights melt into the chat above the composer. */
const FADE_BOTTOM = "linear-gradient(to bottom, #000 78%, transparent)";

/** Fades in, rising a little; `delay` staggers the pieces of the welcome. */
const rise = (delay: number) =>
  ({
    "@keyframes soulRise": { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "none" } },
    animation: "soulRise 0.9s ease-out both",
    animationDelay: `${delay}s`,
    ...still,
  }) as const;

interface HelixProps {
  top: number;
  height: number;
  rungs: number;
  dot: number;
  rotate: number;
  /** Seconds for one full turn. */
  turn: number;
  opacity?: number;
  blur?: number;
  /** How many px it shifts with the pointer; nearer things move more. */
  depth: number;
}

/**
 * A glowing DNA double helix (like the AI Agent banner on WordPress.org). Each rung flips over and
 * back with a small delay after the one before it, so the two strands seem to twist in 3D.
 */
function Helix({ top, height, rungs, dot, rotate, turn, opacity = 1, blur = 0, depth }: HelixProps) {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        left: -BLEED,
        right: -BLEED,
        top,
        height,
        px: 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "stretch",
        opacity,
        transform: `rotate(${rotate}deg)`,
        // Shifts a little with the pointer (set by usePointerDrift), the front helix more than the back one.
        translate: `calc(var(--soul-px, 0) * ${depth}px) calc(var(--soul-py, 0) * ${depth * 0.6}px)`,
        filter: `${blur ? `blur(${blur}px) ` : ""}drop-shadow(0 0 6px rgba(47, 128, 237, 0.4))`,
        maskImage: FADE_SIDES,
        WebkitMaskImage: FADE_SIDES,
      }}
    >
      {Array.from({ length: rungs }, (_item, index) => (
        <Box
          key={index}
          sx={{
            position: "relative",
            width: dot,
            "@keyframes dnaTwist": { "0%, 100%": { transform: "scaleY(1)" }, "50%": { transform: "scaleY(-1)" } },
            animation: `dnaTwist ${turn}s ease-in-out infinite`,
            animationDelay: `${(-index * turn) / 23}s`,
            ...still,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              top: dot,
              bottom: dot,
              width: "1.5px",
              ml: "-0.75px",
              background: `linear-gradient(${BLUE}, ${VIOLET})`,
              opacity: 0.35,
            }}
          />
          <Box sx={{ position: "absolute", left: 0, top: 0, width: dot, height: dot, borderRadius: "50%", bgcolor: BLUE }} />
          <Box sx={{ position: "absolute", left: 0, bottom: 0, width: dot, height: dot, borderRadius: "50%", bgcolor: VIOLET }} />
        </Box>
      ))}
    </Box>
  );
}

/** How far the nearest light travels, in px, when the pointer is at the edge of the panel. */
const DRIFT = 46;

/**
 * Soft blurred lights behind everything, like an aurora. Each light is its own layer that slides
 * towards the pointer (set by usePointerDrift), the near ones more than the far ones, the way the
 * silk waves on reinventwp.com/suite do, so the gradient shifts as the mouse moves. They also
 * drift slowly on their own.
 */
function Aurora() {
  const orbs = [
    { color: "rgba(47, 128, 237, 0.30)", size: 260, left: "-18%", top: "-6%", drift: "40px, 30px", time: 13, depth: 1 },
    { color: "rgba(139, 92, 246, 0.28)", size: 240, left: "52%", top: "8%", drift: "-36px, 44px", time: 16, depth: -0.7 },
    { color: "rgba(34, 195, 230, 0.22)", size: 220, left: "14%", top: "52%", drift: "44px, -34px", time: 19, depth: 0.55 },
    { color: "rgba(139, 92, 246, 0.18)", size: 200, left: "60%", top: "66%", drift: "-30px, -28px", time: 15, depth: -0.4 },
  ];
  return (
    <>
      {orbs.map((orb, index) => (
        <Box
          key={index}
          aria-hidden
          sx={{
            position: "absolute",
            left: orb.left,
            top: orb.top,
            willChange: "transform",
            transform: `translate(calc(var(--soul-px, 0) * ${DRIFT * orb.depth}px), calc(var(--soul-py, 0) * ${DRIFT * orb.depth}px))`,
          }}
        >
          <Box
            sx={{
              width: orb.size,
              height: orb.size,
              borderRadius: "50%",
              background: orb.color,
              filter: "blur(48px)",
              [`@keyframes soulDrift${index}`]: { from: { transform: "translate(0, 0)" }, to: { transform: `translate(${orb.drift})` } },
              animation: `soulDrift${index} ${orb.time}s ease-in-out infinite alternate`,
              ...still,
            }}
          />
        </Box>
      ))}
    </>
  );
}

/** Small sparks that rise and fade, spread over the whole welcome. */
function Sparks() {
  const sparks = Array.from({ length: 16 }, (_item, index) => ({
    left: (index * 37 + 11) % 100,
    top: 30 + ((index * 53) % 65),
    size: 2 + (index % 3),
    time: 6 + (index % 5) * 1.3,
    delay: -(index * 0.9),
    color: [BLUE, VIOLET, CYAN][index % 3],
  }));
  return (
    <>
      {sparks.map((spark, index) => (
        <Box
          key={index}
          aria-hidden
          sx={{
            position: "absolute",
            left: `${spark.left}%`,
            top: `${spark.top}%`,
            width: spark.size,
            height: spark.size,
            borderRadius: "50%",
            bgcolor: spark.color,
            boxShadow: `0 0 6px ${spark.color}`,
            opacity: 0,
            "@keyframes soulSpark": {
              "0%": { opacity: 0, transform: "translateY(0) scale(0.6)" },
              "20%": { opacity: 0.8 },
              "100%": { opacity: 0, transform: "translateY(-120px) scale(1)" },
            },
            animation: `soulSpark ${spark.time}s ease-in infinite`,
            animationDelay: `${spark.delay}s`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none", opacity: 0.35 },
          }}
        />
      ))}
    </>
  );
}

/**
 * Follows the pointer over the whole panel and writes it to CSS variables on the welcome, from -1
 * to 1 on each axis and eased like a spring, so the lights and the helices slide without
 * re-rendering React. Back to 0 when the pointer leaves. Off for reduced motion and touch screens.
 */
function usePointerDrift() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    const area = root?.closest("aside") ?? root;
    if (!root || !area) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;

    const target = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    let frame = 0;
    const step = () => {
      now.x += (target.x - now.x) * 0.07;
      now.y += (target.y - now.y) * 0.07;
      root.style.setProperty("--soul-px", now.x.toFixed(4));
      root.style.setProperty("--soul-py", now.y.toFixed(4));
      const settled = Math.abs(target.x - now.x) < 0.001 && Math.abs(target.y - now.y) < 0.001;
      frame = settled ? 0 : requestAnimationFrame(step);
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };
    const move = (event: Event) => {
      const pointer = event as PointerEvent;
      const rect = area.getBoundingClientRect();
      target.x = ((pointer.clientX - rect.left) / rect.width) * 2 - 1;
      target.y = ((pointer.clientY - rect.top) / rect.height) * 2 - 1;
      start();
    };
    const leave = () => {
      target.x = 0;
      target.y = 0;
      start();
    };
    area.addEventListener("pointermove", move);
    area.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      area.removeEventListener("pointermove", move);
      area.removeEventListener("pointerleave", leave);
    };
  }, []);

  return ref;
}

interface SoulIntroProps {
  /** The start of the headline, like "From now on, your WordPress". */
  title: string;
  /** The endings typed after it in moving colour, one after another, like "has a soul." */
  phrases: string[];
  /** One line over the example questions: what to ask. */
  intro: string;
  linkLabel: string;
  href: string;
  external: boolean;
  /** Small label over the example questions. */
  tryLabel: string;
  /** The example questions, kept at the bottom, just above the composer. */
  children: ReactNode;
}

/**
 * The welcome of an empty chat, filling the whole chat area and drawn into it (no card): drifting
 * lights and rising sparks behind, two DNA helices at the top (a sharp one in front of a soft one),
 * the headline in the middle, and the example questions at the bottom.
 */
export default function SoulIntro({ title, phrases, intro, linkLabel, href, external, tryLabel, children }: SoulIntroProps) {
  const typed = useTypewriter(phrases, true);
  const ref = usePointerDrift();
  return (
    <Box ref={ref} className="rwpbot-full-width" sx={{ position: "relative", flex: "1 0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      {/* The scene: reaches the panel's edges (a Stack resets its children's margins, so the layer reaches out instead). */}
      <Box aria-hidden sx={{ position: "absolute", top: -BLEED, left: -BLEED, right: -BLEED, bottom: -BLEED, overflow: "hidden", pointerEvents: "none", maskImage: FADE_BOTTOM, WebkitMaskImage: FADE_BOTTOM }}>
        <Aurora />
        <Sparks />
      </Box>
      <Helix top={HEADER + 30} height={96} rungs={20} dot={9} rotate={7} turn={10} opacity={0.28} blur={2} depth={-5} />
      <Helix top={HEADER + 2} height={84} rungs={26} dot={7} rotate={-6} turn={6.5} depth={9} />

      <Box sx={{ flex: `0 0 ${HEADER + 120}px` }} />
      <Box sx={{ flex: "1 1 8px" }} />

      <Typography
        component="p"
        aria-label={`${title} ${phrases[0] ?? ""}`}
        sx={{
          position: "relative",
          fontWeight: 800,
          fontSize: "1.75rem",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          maxWidth: 340,
          ...rise(0.15),
        }}
      >
        <Box component="span" aria-hidden sx={{ display: "block" }}>
          {title}
        </Box>
        {/* The ending is typed, held, erased and replaced by the next one; the line keeps its height while empty. */}
        <Box component="span" aria-hidden sx={{ display: "block", minHeight: "1.15em" }}>
          <Box component="span" sx={AGENT_SHIMMER}>
            {typed.text}
          </Box>
          {typed.animated && (
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: "3px",
                height: "0.9em",
                ml: "3px",
                verticalAlign: "-0.08em",
                borderRadius: "2px",
                bgcolor: BLUE,
                "@keyframes soulCaret": { "50%": { opacity: 0 } },
                animation: "soulCaret 1s steps(2) infinite",
              }}
            />
          )}
        </Box>
      </Typography>
      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener" : undefined}
        variant="body2"
        underline="always"
        sx={{ ...LINK_SX, position: "relative", mt: 1.25, display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: "0.9rem", ...rise(0.45) }}
      >
        {linkLabel}
        <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
      </Link>

      <Box sx={{ flex: "1 1 20px" }} />

      <Box sx={{ position: "relative", width: "100%", ...rise(0.75) }}>
        <Typography variant="body2" color="text.secondary" sx={{ mx: "auto", mb: 1.5, maxWidth: 320, fontSize: "0.95rem" }}>
          {intro}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          component="p"
          sx={{ mb: 1, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.7rem" }}
        >
          {tryLabel}
        </Typography>
        {children}
      </Box>
    </Box>
  );
}
