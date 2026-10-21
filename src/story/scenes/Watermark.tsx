import { motion, type Variants } from "framer-motion";
import { BLUE, EASE, GREEN, Photo, Scene, Step, Tag, showIn, useMode } from "../parts";
import StoryFrame from "../StoryFrame";

const captions = ["Your photo", "Your logo goes on", "The original is always kept"] as const;

const stamp: Variants = {
  p0: { opacity: 0, scale: 1.6 },
  p1: { opacity: 0.85, scale: 1, transition: { delay: 0.3, duration: 0.5, ease: EASE } },
  p2: { opacity: 0.85, scale: 1, transition: { duration: 0.2 } },
};

const original: Variants = {
  p0: { x: 0, opacity: 0 },
  p1: { x: 0, opacity: 0 },
  p2: { x: 62, opacity: 1, transition: { delay: 0.2, duration: 0.7, ease: EASE } },
};

/** Watermark: a logo goes on the photo, and the untouched original is kept beside it. */
function WatermarkScene() {
  const mode = useMode();
  return (
    <Scene>
      <motion.g animate={mode} initial={false} variants={original}>
        <Photo x={40} y={24} w={84} h={70} />
        <Tag x={58} y={100} label="Original" color={GREEN} w={48} />
      </motion.g>
      <g>
        <rect fill="#FFFFFF" height={76} rx={4} width={90} x={37} y={21} />
        <Photo x={40} y={24} w={84} h={70} />
        <motion.g animate={mode} initial={false} style={{ transformBox: "fill-box", transformOrigin: "center" }} variants={stamp}>
          <circle cx={108} cy={80} fill="#FFFFFF" r={9} />
          <text fill={BLUE} fontFamily="Inter, inherit" fontSize={13} fontWeight={500} textAnchor="middle" x={108} y={84.5}>
            R
          </text>
        </motion.g>
      </g>
      <Step variants={showIn(["p1", "p2"], 0.8)}>
        <Tag x={50} y={100} label="Watermarked" w={60} />
      </Step>
    </Scene>
  );
}

export default function WatermarkStory() {
  return (
    <StoryFrame captions={captions}>
      <WatermarkScene />
    </StoryFrame>
  );
}
