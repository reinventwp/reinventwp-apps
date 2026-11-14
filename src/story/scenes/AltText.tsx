import { AMBER, GREEN, INK, Photo, Scene, Step, Tag, showIn } from "../parts";
import StoryFrame from "../StoryFrame";

const captions = ["Images with no alt text", "Alt text from the file name", "Camera names listed for you"] as const;

function FileName({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <text fill={INK} fontFamily="inherit" fontSize={6.4} textAnchor="middle" x={x} y={y}>
      {name}
    </text>
  );
}

/** Alt Text: a missing alt is written from a readable file name; camera names like IMG_2041 are listed instead. */
function AltTextScene() {
  return (
    <Scene>
      <Photo x={30} y={16} w={60} h={48} />
      <FileName x={60} y={74} name="red-bicycle.jpg" />
      <Photo x={110} y={16} w={60} h={48} />
      <FileName x={140} y={74} name="IMG_2041.jpg" />

      <Step variants={showIn(["p0"], 0.2)}>
        <Tag x={36} y={84} label="No alt text" color={AMBER} w={48} />
      </Step>
      <Step variants={showIn(["p1", "p2"], 0.4)}>
        <Tag x={28} y={84} label="alt: Red bicycle" color={GREEN} w={64} />
      </Step>

      <Step variants={showIn(["p0", "p1"], 0.2)}>
        <Tag x={116} y={84} label="No alt text" color={AMBER} w={48} />
      </Step>
      <Step variants={showIn(["p2"], 0.4)}>
        <Tag x={112} y={84} label="Listed to rename" color={AMBER} w={56} />
      </Step>
    </Scene>
  );
}

export default function AltTextStory() {
  return (
    <StoryFrame captions={captions}>
      <AltTextScene />
    </StoryFrame>
  );
}
