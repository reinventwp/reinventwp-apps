import { motion, type Variants } from "framer-motion";
import { BLUE, Check, Cursor, GREEN, LINE, Scene, Step, Tag, Window, showIn, useMode } from "../parts";
import StoryFrame from "../StoryFrame";

/** What it does for the admin: ask in plain words, it does the work after an OK, and the job is done. */
const captions = ["Tell it what you need", "It does the work, you approve", "Done for you, time saved"] as const;

/** The jobs it ticks off, one after the other. */
const JOBS = [60, 48, 54];

const job: Variants = {
  p0: { opacity: 0, x: -4, transition: { duration: 0.2 } },
  p1: (i: number) => ({ opacity: 1, x: 0, transition: { delay: 0.3 + i * 0.35, duration: 0.3 } }),
  p2: { opacity: 1, x: 0 },
};

/** AI Agent: the admin asks, the assistant does the steps and asks for an OK, then it's done. */
function AiAgentScene() {
  const mode = useMode();
  return (
    <Scene>
      <Window x={30} y={8} w={140} h={112} />
      {/* The admin's request, in plain words. */}
      <Step variants={showIn(["p0", "p1", "p2"], 0.2)}>
        <rect fill={BLUE} height={14} rx={7} width={78} x={82} y={22} />
        <rect fill="#FFFFFF" fillOpacity={0.85} height={3} rx={1.5} width={56} x={93} y={27.5} />
      </Step>
      {/* The work, ticked off. */}
      {JOBS.map((width, i) => (
        <motion.g animate={mode} custom={i} initial={false} key={width} variants={job}>
          <Check x={46} y={50 + i * 12} r={4} />
          <rect fill={LINE} height={3.5} rx={1.75} width={width} x={54} y={48.25 + i * 12} />
        </motion.g>
      ))}
      {/* The admin's OK. */}
      <Step variants={showIn(["p1"], 1.3)}>
        <rect fill={BLUE} height={12} rx={6} width={40} x={42} y={90} />
        <rect fill="#FFFFFF" fillOpacity={0.85} height={2.5} rx={1.25} width={22} x={51} y={94.75} />
        <Cursor x={74} y={96} />
      </Step>
      {/* Done. */}
      <Step variants={showIn(["p2"], 0.3)}>
        <Tag x={42} y={90} label="Done for you" color={GREEN} w={56} />
      </Step>
    </Scene>
  );
}

export default function AiAgentStory() {
  return (
    <StoryFrame captions={captions}>
      <AiAgentScene />
    </StoryFrame>
  );
}
