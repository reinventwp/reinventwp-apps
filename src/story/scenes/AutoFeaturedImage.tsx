import { motion, type Variants } from "framer-motion";
import { EASE, Lines, LINE, Photo, Scene, Step, Tag, Window, showIn, useMode, GREEN } from "../parts";
import StoryFrame from "../StoryFrame";

const captions = ["Posts with no featured image", "Its first image is used", "Old posts filled in one go"] as const;

/** The thumbnail flies from the post's first image (right) into the empty featured-image slot (left). */
const thumb: Variants = {
  p0: { opacity: 0, scale: 0.7, x: 104 },
  p1: (i: number) =>
    i === 0
      ? { opacity: 1, scale: 1, x: 0, transition: { delay: 0.3, duration: 0.8, ease: EASE } }
      : { opacity: 0, scale: 0.7, x: 104, transition: { duration: 0.2 } },
  p2: (i: number) => ({ opacity: 1, scale: 1, x: 0, transition: { delay: i === 0 ? 0 : 0.2 + (i - 1) * 0.35, duration: 0.7, ease: EASE } }),
};

/** Auto Featured Image: each post gets its first image as the featured image, old posts in one go. */
function AutoFeaturedScene() {
  const mode = useMode();
  return (
    <Scene>
      <Window x={22} y={8} w={156} h={112} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect fill="none" height={24} rx={3} stroke={LINE} strokeDasharray="3 2" width={30} x={30} y={24 + i * 30} />
          <rect fill="rgba(7, 21, 34, 0.32)" height={4} rx={2} width={50} x={68} y={28 + i * 30} />
          <Lines x={68} y={36 + i * 30} widths={[60, 44]} gap={6} />
          <Photo x={134} y={27 + i * 30} w={30} h={18} />
          <motion.g animate={mode} custom={i} initial={false} style={{ transformBox: "fill-box", transformOrigin: "center" }} variants={thumb}>
            <Photo x={30} y={24 + i * 30} w={30} h={24} />
          </motion.g>
        </g>
      ))}
      <Step variants={showIn(["p2"], 1)}>
        <Tag x={74} y={113} label="All posts done" color={GREEN} w={58} />
      </Step>
    </Scene>
  );
}

export default function AutoFeaturedImageStory() {
  return (
    <StoryFrame captions={captions}>
      <AutoFeaturedScene />
    </StoryFrame>
  );
}
