import { Box } from "@mui/material";
import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useStory } from "./StoryFrame";

/** Shared pieces for the app stories (the Wave, Person and PlayerChip come from reinventwp-next's story.tsx). */

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const BLUE = "#004984";
export const INK = "rgba(7, 21, 34, 0.32)";
export const LINE = "rgba(7, 21, 34, 0.16)";
export const DIVIDER = "rgba(7, 21, 34, 0.12)";
export const MARK = "rgba(0, 73, 132, 0.45)";
export const SKY = "#DCEBFB";
export const HILL = "#6CB4F0";
export const GREEN = "#2e7d32";
export const AMBER = "#b26a00";

export type Mode = "p0" | "p1" | "p2";

/** The current step as a variant name ("p0", "p1", "p2"). */
export const useMode = (): Mode => `p${useStory().phase}` as Mode;

/** The SVG canvas every scene draws on. */
export function Scene({ children }: { children: ReactNode }) {
  return (
    <Box component="svg" sx={{ display: "block", height: "100%", maxWidth: "100%", mx: "auto", width: "auto" }} viewBox="0 0 200 128">
      {children}
    </Box>
  );
}

/** Shows its children with the given variants for the current step. */
export function Step({ variants, children, custom }: { variants: Variants; children: ReactNode; custom?: number }) {
  const mode = useMode();
  return (
    <motion.g animate={mode} custom={custom} initial={false} variants={variants}>
      {children}
    </motion.g>
  );
}

/** Variants that show something only in the listed steps. */
export const showIn = (steps: Mode[], delay = 0.2): Variants => ({
  p0: steps.includes("p0") ? { opacity: 1, y: 0, transition: { delay, duration: 0.45, ease: EASE } } : { opacity: 0, y: 6, transition: { duration: 0.25 } },
  p1: steps.includes("p1") ? { opacity: 1, y: 0, transition: { delay, duration: 0.45, ease: EASE } } : { opacity: 0, y: 6, transition: { duration: 0.25 } },
  p2: steps.includes("p2") ? { opacity: 1, y: 0, transition: { delay, duration: 0.45, ease: EASE } } : { opacity: 0, y: 6, transition: { duration: 0.25 } },
});

/** A browser-like window with a title bar. */
export function Window({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect fill="#FFFFFF" height={h} rx={4} stroke={DIVIDER} width={w} />
      <path d={`M0 4 a4 4 0 0 1 4 -4 h${w - 8} a4 4 0 0 1 4 4 v7 h-${w} Z`} fill="rgba(7, 21, 34, 0.05)" />
      {[6, 12, 18].map((cx) => (
        <circle cx={cx} cy={5.5} fill="rgba(7, 21, 34, 0.2)" key={cx} r={1.6} />
      ))}
    </g>
  );
}

/** A photo placeholder: sky, sun and two hills. */
export function Photo({ x, y, w, h, filter }: { x: number; y: number; w: number; h: number; filter?: string }) {
  return (
    <g filter={filter} transform={`translate(${x} ${y})`}>
      <rect fill={SKY} height={h} rx={3} width={w} />
      <circle cx={w * 0.72} cy={h * 0.3} fill="#FFFFFF" r={Math.min(w, h) * 0.12} />
      <path d={`M0 ${h * 0.78} L${w * 0.32} ${h * 0.45} L${w * 0.58} ${h * 0.72} L${w * 0.75} ${h * 0.56} L${w} ${h * 0.8} V${h - 3} a3 3 0 0 1 -3 3 H3 a3 3 0 0 1 -3 -3 Z`} fill={HILL} />
    </g>
  );
}

/** A small rounded label. */
export function Tag({ x, y, label, color = BLUE, w }: { x: number; y: number; label: string; color?: string; w?: number }) {
  const width = w ?? label.length * 3.6 + 10;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect fill="#FFFFFF" height={11} rx={5.5} stroke={color} strokeWidth={0.8} width={width} />
      <text fill={color} fontFamily="inherit" fontSize={6.2} fontWeight={600} textAnchor="middle" x={width / 2} y={7.6}>
        {label}
      </text>
    </g>
  );
}

/** A green check in a circle. */
export function Check({ x, y, r = 6 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle fill={GREEN} r={r} />
      <path d={`M${-r * 0.45} 0 l${r * 0.3} ${r * 0.3} l${r * 0.6} ${-r * 0.6}`} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth={r * 0.28} />
    </g>
  );
}

/** A mouse pointer. */
export function Cursor({ x, y }: { x: number; y: number }) {
  return (
    <path d={`M${x} ${y} l0 11 l3 -3 l2.4 5 l2 -1 l-2.4 -5 l4 0 Z`} fill="#071522" stroke="#FFFFFF" strokeLinejoin="round" strokeWidth={0.8} />
  );
}

/** Grey text lines. */
export function Lines({ x, y, widths, gap = 7, fill = LINE }: { x: number; y: number; widths: readonly number[]; gap?: number; fill?: string }) {
  return (
    <g>
      {widths.map((w, i) => (
        <rect fill={fill} height={3.5} key={i} rx={1.75} width={w} x={x} y={y + i * gap} />
      ))}
    </g>
  );
}

const waveHeights = [4, 7, 10, 6, 9, 5, 8];

/** The audio wave of the Text to Speech player. */
export function Wave({ x, y, color = BLUE }: { x: number; y: number; color?: string }) {
  const { playing } = useStory();
  return (
    <g transform={`translate(${x} ${y})`}>
      {waveHeights.map((h, i) => (
        <motion.rect
          animate={playing ? { scaleY: [0.4, 1, 0.55, 0.9, 0.4] } : { scaleY: 0.7 }}
          fill={color}
          height={h}
          key={i}
          rx={1.2}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          transition={playing ? { delay: i * 0.11, duration: 1.6, ease: "easeInOut", repeat: Infinity } : { duration: 0.2 }}
          width={2.4}
          x={i * 4.6}
          y={-h / 2}
        />
      ))}
    </g>
  );
}

/** The Text to Speech player chip. */
export function PlayerChip({ x, y, w = 62 }: { x: number; y: number; w?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect fill="#FFFFFF" height={13} rx={6.5} stroke={DIVIDER} strokeWidth={0.8} width={w} />
      <circle cx={8} cy={6.5} fill={BLUE} r={4.4} />
      <path d="M6.6 4.3 11 6.5 6.6 8.7 Z" fill="#FFFFFF" />
      <Wave x={16} y={6.5} />
    </g>
  );
}

/** A visitor. */
export function Person({ x, y, fill = "currentColor" }: { x: number; y: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={0} cy={-5} fill={fill} r={3.6} />
      <rect fill={fill} height={9} rx={4.5} width={11} x={-5.5} y={-0.5} />
    </g>
  );
}
