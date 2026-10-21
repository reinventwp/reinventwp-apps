import { motion, type Variants } from "framer-motion";
import { AMBER, EASE, GREEN, Scene, Step, Tag, showIn, useMode, LINE } from "../parts";
import StoryFrame from "../StoryFrame";

const captions = ["Leftovers slow the database", "Back up, then clean", "Lighter, and you can undo"] as const;
const ROWS = [false, true, false, true, true, false] as const;

const leftover: Variants = {
  p0: { opacity: 1, scaleX: 1, transition: { duration: 0.3 } },
  p1: { opacity: 1, scaleX: 1, transition: { duration: 0.2 } },
  p2: (i: number) => ({ opacity: 0, scaleX: 0, transition: { delay: 0.2 + i * 0.2, duration: 0.5, ease: EASE } }),
};

/** Database Cleaner: leftover rows are backed up, then cleaned away. */
function DatabaseScene() {
  const mode = useMode();
  return (
    <Scene>
      <ellipse cx={74} cy={18} fill="#FFFFFF" rx={50} ry={8} stroke="rgba(7, 21, 34, 0.2)" />
      <path d="M24 18 V106 a50 8 0 0 0 100 0 V18" fill="#FFFFFF" stroke="rgba(7, 21, 34, 0.2)" />
      {ROWS.map((isLeftover, i) =>
        isLeftover ? (
          <motion.rect animate={mode} custom={i} fill={AMBER} fillOpacity={0.35} height={8} initial={false} key={i} rx={2} style={{ transformBox: "fill-box", transformOrigin: "left center" }} variants={leftover} width={76} x={36} y={30 + i * 12} />
        ) : (
          <rect fill={LINE} height={8} key={i} rx={2} width={76} x={36} y={30 + i * 12} />
        ),
      )}
      <Step variants={showIn(["p1", "p2"], 0.3)}>
        <Tag x={136} y={30} label="Backed up" color={GREEN} w={48} />
      </Step>
      <Step variants={showIn(["p2"], 1)}>
        <Tag x={136} y={50} label="Undo" w={48} />
      </Step>
    </Scene>
  );
}

export default function DatabaseCleanerStory() {
  return (
    <StoryFrame captions={captions}>
      <DatabaseScene />
    </StoryFrame>
  );
}
