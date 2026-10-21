import { motion, type Variants } from "framer-motion";
import { BLUE, Lines, Scene, Step, Tag, Window, showIn, useMode } from "../parts";
import StoryFrame from "../StoryFrame";

const captions = ["Ask your site a question", "The agent picks a tool", "Answered, keys stay on your server"] as const;
const TOOLS = ["Posts", "Media", "Search"];

const tool: Variants = {
  p0: { opacity: 0, y: 4 },
  p1: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.25, duration: 0.35 } }),
  p2: { opacity: 0.35, y: 0, transition: { duration: 0.3 } },
};

/** AI Agent: a question, a tool call, an answer, with the API key kept on the site. */
function AiAgentScene() {
  const mode = useMode();
  return (
    <Scene>
      <Window x={30} y={8} w={140} h={112} />
      <Step variants={showIn(["p0", "p1", "p2"], 0.2)}>
        <rect fill={BLUE} height={14} rx={7} width={70} x={90} y={24} />
        <rect fill="#FFFFFF" fillOpacity={0.8} height={3} rx={1.5} width={50} x={100} y={29.5} />
      </Step>
      {TOOLS.map((label, i) => (
        <motion.g animate={mode} custom={i} initial={false} key={label} variants={tool}>
          <Tag x={40 + i * 40} y={46} label={label} w={36} />
        </motion.g>
      ))}
      <Step variants={showIn(["p2"], 0.4)}>
        <rect fill="rgba(7, 21, 34, 0.05)" height={30} rx={6} width={96} x={40} y={64} />
        <Lines x={48} y={71} widths={[78, 70, 50]} gap={6.5} />
        <g transform="translate(140 98)">
          <rect fill="#FFFFFF" height={14} rx={3} stroke="#2e7d32" width={24} x={0} y={0} />
          <rect fill="none" height={6} rx={3} stroke="#2e7d32" strokeWidth={1.4} width={8} x={8} y={-4} />
          <circle cx={12} cy={7} fill="#2e7d32" r={1.8} />
        </g>
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
