import { motion, type Variants } from "framer-motion";
import { Cursor, EASE, Lines, Photo, Scene, Window, useMode, Step, showIn } from "../parts";
import StoryFrame from "../StoryFrame";

const captions = ["Click a photo", "It opens full screen", "Zoom, slide and share"] as const;

const overlay: Variants = {
  p0: { opacity: 0, transition: { duration: 0.3 } },
  p1: { opacity: 1, transition: { delay: 0.2, duration: 0.4 } },
  p2: { opacity: 1, transition: { duration: 0.2 } },
};

const grow: Variants = {
  p0: { scale: 0.32, x: 0, y: 0, opacity: 0, transition: { duration: 0.3 } },
  p1: { scale: 1, x: 0, y: 0, opacity: 1, transition: { delay: 0.25, duration: 0.6, ease: EASE } },
  p2: { scale: 1, x: 0, y: 0, opacity: 1, transition: { duration: 0.2 } },
};

const pointer: Variants = {
  p0: { opacity: 1, x: 0, y: 0, transition: { delay: 0.3, duration: 1, ease: EASE } },
  p1: { opacity: 0, transition: { duration: 0.2 } },
  p2: { opacity: 0, transition: { duration: 0.2 } },
};

/** Lightbox: a thumbnail opens into a full-screen viewer with slideshow, zoom and share. */
function LightboxScene() {
  const mode = useMode();
  return (
    <Scene>
      <Window x={30} y={8} w={140} h={112} />
      <Lines x={40} y={24} widths={[80, 66]} />
      {[0, 1, 2].map((i) => (
        <Photo h={30} key={i} w={38} x={40 + i * 42} y={44} />
      ))}
      <Lines x={40} y={84} widths={[110, 96, 70]} />
      <motion.g animate={mode} initial={{ x: 30, y: 30 }} variants={pointer}>
        <Cursor x={96} y={62} />
      </motion.g>
      <motion.g animate={mode} initial={false} variants={overlay}>
        <rect fill="rgba(7, 21, 34, 0.86)" height={112} rx={4} width={140} x={30} y={8} />
      </motion.g>
      <motion.g animate={mode} initial={false} style={{ transformBox: "fill-box", transformOrigin: "center" }} variants={grow}>
        <Photo x={56} y={22} w={88} h={70} />
      </motion.g>
      <Step variants={showIn(["p2"], 0.2)}>
        <path d="M44 57 l-5 5 5 5 M156 57 l5 5 -5 5" fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
        <g fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeWidth={1.4}>
          <circle cx={88} cy={106} r={3.6} />
          <path d="M90.6 108.6 l2.6 2.6" />
          <path d="M108 103 v7 h8 v-7 M112 102 v-4 M110 100 l2 -2 2 2" />
        </g>
      </Step>
    </Scene>
  );
}

export default function LightboxStory() {
  return (
    <StoryFrame captions={captions}>
      <LightboxScene />
    </StoryFrame>
  );
}
