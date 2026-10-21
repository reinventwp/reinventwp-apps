import type { Variants } from "framer-motion";
import { Lines, MARK, Scene, Step, PlayerChip, LINE, Window, showIn, useMode } from "../parts";
import StoryFrame from "../StoryFrame";
import { motion } from "framer-motion";

const captions = ["A long article to read", "Press play", "Words light up as they're read"] as const;
const WIDTHS = [96, 88, 100, 76, 92] as const;

const highlight: Variants = {
  p0: { fill: LINE, transition: { duration: 0.3 } },
  p1: { fill: LINE, transition: { duration: 0.3 } },
  p2: (i: number) => ({ fill: MARK, transition: { delay: 0.2 + i * 0.45, duration: 0.35 } }),
};

/** Text to Speech: the article reads itself, highlighting each line. */
function TextToSpeechScene() {
  const mode = useMode();
  return (
    <Scene>
      <Window x={40} y={8} w={120} h={112} />
      <rect fill="rgba(7, 21, 34, 0.32)" height={5} rx={2} width={56} x={50} y={24} />
      {WIDTHS.map((w, i) => (
        <motion.rect animate={mode} custom={i} fill={LINE} height={3.5} initial={false} key={i} rx={1.75} variants={highlight} width={w} x={50} y={36 + i * 8} />
      ))}
      <Lines x={50} y={76} widths={[60]} />
      <Step variants={showIn(["p1", "p2"])}>
        <PlayerChip x={50} y={94} w={70} />
      </Step>
    </Scene>
  );
}

export default function TextToSpeechStory() {
  return (
    <StoryFrame captions={captions}>
      <TextToSpeechScene />
    </StoryFrame>
  );
}
