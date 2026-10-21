import { Check, Photo, Scene, Step, Window, Lines, showIn, BLUE, GREEN } from "../parts";
import StoryFrame from "../StoryFrame";

const captions = ["IMG_4821.jpg says nothing", "Renamed for search", "Every link still works"] as const;

function FileName({ label, color }: { label: string; color: string }) {
  return (
    <text fill={color} fontFamily="inherit" fontSize={7} fontWeight={600} textAnchor="middle" x={50} y={98}>
      {label}
    </text>
  );
}

/** Rename & Replace Media: a camera file name becomes a descriptive one, and links keep working. */
function RenameScene() {
  return (
    <Scene>
      <Photo x={18} y={22} w={64} h={64} />
      <Step variants={showIn(["p0"], 0)}>
        <FileName label="IMG_4821.jpg" color="rgba(7, 21, 34, 0.55)" />
      </Step>
      <Step variants={showIn(["p1", "p2"], 0.3)}>
        <FileName label="red-bike-paris.jpg" color={BLUE} />
      </Step>
      <Step variants={showIn(["p2"], 0.2)}>
        <Window x={120} y={22} w={64} h={74} />
        <Lines x={128} y={40} widths={[40, 46, 34]} />
        <rect fill="#DCEBFB" height={18} rx={2} width={46} x={128} y={64} />
        <path d="M118 74 C106 74 96 64 86 56" fill="none" stroke={GREEN} strokeDasharray="3 2" strokeWidth={1.4} />
        <Check x={152} y={102} />
      </Step>
    </Scene>
  );
}

export default function RenameReplaceStory() {
  return (
    <StoryFrame captions={captions}>
      <RenameScene />
    </StoryFrame>
  );
}
