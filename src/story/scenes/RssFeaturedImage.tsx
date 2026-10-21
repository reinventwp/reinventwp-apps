import { motion, type Variants } from "framer-motion";
import { EASE, Lines, Photo, Scene, Window, useMode, LINE } from "../parts";
import StoryFrame from "../StoryFrame";

const captions = ["Feed posts without pictures", "The featured image is added", "Every post shows a picture"] as const;

const thumb: Variants = {
  p0: { opacity: 0, x: -8 },
  p1: (i: number) => ({ opacity: 1, x: 0, transition: { delay: 0.2 + i * 0.35, duration: 0.45, ease: EASE } }),
  p2: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

const rss: Variants = {
  p0: { fill: LINE },
  p1: { fill: LINE },
  p2: { fill: "#f57c00", transition: { delay: 0.2, duration: 0.4 } },
};

/** RSS Featured Image: feed items gain their featured image, so readers see a picture with every post. */
function RssScene() {
  const mode = useMode();
  return (
    <Scene>
      <Window x={36} y={8} w={128} h={112} />
      <motion.g animate={mode} initial={false} variants={rss}>
        <rect height={10} rx={2} width={10} x={146} y={14} />
      </motion.g>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <motion.g animate={mode} custom={i} initial={false} variants={thumb}>
            <Photo x={46} y={26 + i * 30} w={30} h={24} />
          </motion.g>
          <rect fill="rgba(7, 21, 34, 0.32)" height={4} rx={2} width={58} x={84} y={30 + i * 30} />
          <Lines x={84} y={38 + i * 30} widths={[66, 48]} gap={6} />
        </g>
      ))}
    </Scene>
  );
}

export default function RssFeaturedImageStory() {
  return (
    <StoryFrame captions={captions}>
      <RssScene />
    </StoryFrame>
  );
}
