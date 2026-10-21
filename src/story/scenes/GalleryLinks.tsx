import { motion, type Variants } from "framer-motion";
import { BLUE, Cursor, EASE, Lines, Photo, Scene, Step, Window, showIn, useMode } from "../parts";
import StoryFrame from "../StoryFrame";

const captions = ["A plain gallery", "Link each image to a page", "A click opens that page"] as const;
const TILES = [0, 1, 2, 3].map((i) => ({ i, x: 18 + (i % 2) * 40, y: 22 + Math.floor(i / 2) * 40 }));

const link: Variants = {
  p0: { opacity: 0, scale: 0.6 },
  p1: (i: number) => ({ opacity: 1, scale: 1, transition: { delay: 0.2 + i * 0.25, duration: 0.3, ease: EASE } }),
  p2: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
};

const pointer: Variants = {
  p0: { opacity: 0, x: 40, y: 30 },
  p1: { opacity: 0, x: 40, y: 30 },
  p2: { opacity: 1, x: 0, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/** Gallery Custom Links: each gallery image gets its own link, and a click opens that page. */
function GalleryScene() {
  const mode = useMode();
  return (
    <Scene>
      {TILES.map(({ i, x, y }) => (
        <g key={i}>
          <Photo x={x} y={y} w={34} h={34} />
          <motion.g animate={mode} custom={i} initial={false} style={{ transformBox: "fill-box", transformOrigin: "center" }} variants={link}>
            <circle cx={x + 28} cy={y + 6} fill={BLUE} r={5} />
            <path d={`M${x + 26} ${y + 8} l4 -4 M${x + 25.5} ${y + 5.5} a1.6 1.6 0 0 1 2 -2 M${x + 30.5} ${y + 6.5} a1.6 1.6 0 0 1 -2 2`} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeWidth={1.1} />
          </motion.g>
        </g>
      ))}
      <motion.g animate={mode} initial={false} variants={pointer}>
        <Cursor x={74} y={40} />
      </motion.g>
      <Step variants={showIn(["p2"], 0.8)}>
        <Window x={112} y={22} w={72} h={74} />
        <rect fill="#DCEBFB" height={22} rx={2} width={56} x={120} y={38} />
        <Lines x={120} y={66} widths={[52, 44, 50]} />
      </Step>
    </Scene>
  );
}

export default function GalleryLinksStory() {
  return (
    <StoryFrame captions={captions}>
      <GalleryScene />
    </StoryFrame>
  );
}
