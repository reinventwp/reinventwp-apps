import { motion, type Variants } from "framer-motion";
import { AMBER, Check, EASE, Photo, Scene, Step, Tag, showIn, useMode } from "../parts";
import StoryFrame from "../StoryFrame";

const captions = ["A library full of files", "Unused files are found", "Moved to the trash, safe to undo"] as const;
const TILES = [0, 1, 2, 3, 4, 5].map((i) => ({ i, x: 18 + (i % 3) * 38, y: 22 + Math.floor(i / 3) * 40 }));
const UNUSED = [1, 5];

const flag: Variants = {
  p0: { opacity: 0 },
  p1: (i: number) => ({ opacity: 1, transition: { delay: 0.3 + i * 0.25, duration: 0.3 } }),
  p2: { opacity: 0, transition: { duration: 0.2 } },
};

const toTrash = (x: number, y: number): Variants => ({
  p0: { x: 0, y: 0, scale: 1, opacity: 1, transition: { duration: 0.4 } },
  p1: { x: 0, y: 0, scale: 1, opacity: 1, transition: { duration: 0.2 } },
  p2: { x: 160 - x - 16, y: 70 - y - 16, scale: 0.25, opacity: 0, transition: { delay: 0.2, duration: 0.8, ease: EASE } },
});

/** Media Cleanup: unused files are flagged, then moved to the trash with a safety net. */
function MediaCleanupScene() {
  const mode = useMode();
  return (
    <Scene>
      {TILES.map(({ i, x, y }) => {
        const unused = UNUSED.includes(i);
        return (
          <motion.g animate={mode} initial={false} key={i} style={{ transformBox: "fill-box", transformOrigin: "center" }} variants={unused ? toTrash(x, y) : undefined}>
            <Photo x={x} y={y} w={32} h={32} />
            {unused && (
              <motion.rect animate={mode} custom={UNUSED.indexOf(i)} fill="none" height={34} initial={false} rx={4} stroke={AMBER} strokeWidth={1.6} variants={flag} width={34} x={x - 1} y={y - 1} />
            )}
          </motion.g>
        );
      })}
      <g transform="translate(150 60)">
        <rect fill="#FFFFFF" height={26} rx={3} stroke="rgba(7, 21, 34, 0.32)" strokeWidth={1.2} width={20} x={0} y={4} />
        <rect fill="rgba(7, 21, 34, 0.32)" height={3} rx={1.5} width={26} x={-3} y={0} />
        <path d="M6 10 v14 M10 10 v14 M14 10 v14" stroke="rgba(7, 21, 34, 0.2)" strokeWidth={1.2} />
      </g>
      <Step variants={showIn(["p2"], 1)}>
        <Check x={168} y={58} />
        <Tag x={128} y={96} label="Safety net on" color="#2e7d32" />
      </Step>
    </Scene>
  );
}

export default function MediaCleanupStory() {
  return (
    <StoryFrame captions={captions}>
      <MediaCleanupScene />
    </StoryFrame>
  );
}
