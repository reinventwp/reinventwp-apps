import { motion, type Variants } from "framer-motion";
import { useId } from "react";
import { Photo, Scene, Step, Tag, showIn, useMode, GREEN } from "../parts";
import StoryFrame from "../StoryFrame";

const captions = ["Blurry on sharp screens", "Retina sizes are made", "Crisp at 2x"] as const;

const blurry: Variants = {
  p0: { opacity: 1, transition: { duration: 0.3 } },
  p1: { opacity: 1, transition: { duration: 0.3 } },
  p2: { opacity: 0, transition: { delay: 0.2, duration: 0.7 } },
};

const size: Variants = {
  p0: { opacity: 0, x: 0 },
  p1: (i: number) => ({ opacity: 1, x: 0, transition: { delay: 0.3 + i * 0.35, duration: 0.4 } }),
  p2: { opacity: 0, transition: { duration: 0.3 } },
};

/** Retina Images: a blurry image gets its retina sizes and turns sharp. */
function RetinaScene() {
  const mode = useMode();
  const filterId = `rwp-blur-${useId().replace(/:/g, "")}`;
  return (
    <Scene>
      <defs>
        <filter id={filterId}>
          <feGaussianBlur stdDeviation={2.6} />
        </filter>
      </defs>
      <Photo x={36} y={14} w={96} h={96} />
      <motion.g animate={mode} initial={false} variants={blurry}>
        <rect fill="#FFFFFF" height={96} width={96} x={36} y={14} />
        <Photo x={36} y={14} w={96} h={96} filter={`url(#${filterId})`} />
      </motion.g>
      {["1x", "2x"].map((label, i) => (
        <motion.g animate={mode} custom={i} initial={false} key={label} variants={size}>
          <rect fill="#FFFFFF" height={26 + i * 10} rx={3} stroke="rgba(7, 21, 34, 0.2)" width={26 + i * 10} x={142} y={20 + i * 34} />
          <text fill="#004984" fontFamily="inherit" fontSize={8} fontWeight={700} textAnchor="middle" x={155 + i * 5} y={36 + i * 39}>
            {label}
          </text>
        </motion.g>
      ))}
      <Step variants={showIn(["p2"], 0.8)}>
        <Tag x={140} y={58} label="Sharp" color={GREEN} w={34} />
      </Step>
    </Scene>
  );
}

export default function RetinaImagesStory() {
  return (
    <StoryFrame captions={captions}>
      <RetinaScene />
    </StoryFrame>
  );
}
