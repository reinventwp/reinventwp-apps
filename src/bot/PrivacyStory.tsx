import { keyframes } from "@emotion/react";
import { Box } from "@mui/material";

/**
 * The privacy dialog's story, in the hub's story style (src/story) but with CSS keyframes, so bot.js doesn't
 * carry framer-motion: your message goes to Reinvent WP, the answer comes back and nothing is kept there, and
 * (in wp-admin with AI Agent) the chat is saved in this site's own database. One 9-second loop; reduced motion
 * shows the last step.
 */

const BLUE = "#004984";
const GREEN = "#2e7d32";
const LINE = "rgba(7, 21, 34, 0.16)";
const EDGE = "rgba(7, 21, 34, 0.2)";
const LOOP = "9s";

// Each step is a third of the loop.
const send = keyframes`
  0%, 3% { opacity: 0; transform: translateX(0); }
  7% { opacity: 1; transform: translateX(0); }
  27% { opacity: 1; transform: translateX(46px); }
  31%, 100% { opacity: 0; transform: translateX(46px); }
`;
const answer = keyframes`
  0%, 35% { opacity: 0; transform: translateX(0); }
  39% { opacity: 1; transform: translateX(0); }
  59% { opacity: 1; transform: translateX(-46px); }
  63%, 100% { opacity: 0; transform: translateX(-46px); }
`;
const nothingKept = keyframes`
  0%, 44% { opacity: 0; transform: translateY(4px); }
  50%, 94% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(0); }
`;
const save = keyframes`
  0%, 67% { opacity: 0; transform: translateY(0); }
  71% { opacity: 1; transform: translateY(0); }
  84% { opacity: 1; transform: translateY(30px); }
  88%, 100% { opacity: 0; transform: translateY(30px); }
`;
const savedTag = keyframes`
  0%, 80% { opacity: 0; transform: translateY(4px); }
  86%, 96% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(0); }
`;
const caption = (from: number, to: number) => keyframes`
  0%, ${Math.max(from - 1, 0)}% { opacity: 0; transform: translateY(4px); }
  ${from + 2}%, ${to - 2}% { opacity: 1; transform: translateY(0); }
  ${to}%, 100% { opacity: 0; transform: translateY(-4px); }
`;
const CAPTIONS = [caption(0, 33), caption(34, 66), caption(67, 100)] as const;

/** Moves and fades with the loop; with reduced motion it shows its final look (`still`). */
const anim = (name: ReturnType<typeof keyframes>, still: number) => ({
  animation: `${name} ${LOOP} ease-in-out infinite`,
  transformBox: "fill-box" as const,
  "@media (prefers-reduced-motion: reduce)": { animation: "none", opacity: still },
});

function Tag({ x, y, label, color = BLUE, w }: { x: number; y: number; label: string; color?: string; w: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect fill="#FFFFFF" height={11} rx={5.5} stroke={color} strokeWidth={0.8} width={w} />
      <text fill={color} fontFamily="inherit" fontSize={6.2} fontWeight={600} textAnchor="middle" x={w / 2} y={7.6}>
        {label}
      </text>
    </g>
  );
}

/** A small chat bubble with two text lines. */
function Bubble({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect fill={fill} height={11} rx={4} width={20} />
      <rect fill="#FFFFFF" fillOpacity={0.85} height={1.6} rx={0.8} width={12} x={4} y={3.2} />
      <rect fill="#FFFFFF" fillOpacity={0.85} height={1.6} rx={0.8} width={8} x={4} y={6.4} />
    </g>
  );
}

interface PrivacyStoryProps {
  /** Chats are saved in this WordPress site (wp-admin with AI Agent). */
  saved: boolean;
}

export default function PrivacyStory({ saved }: PrivacyStoryProps) {
  const captions = ["Your message goes to Reinvent WP", "The answer comes back, nothing is kept", saved ? "Your chats stay in your WordPress" : "Nothing is saved anywhere"];
  return (
    <Box aria-hidden="true" sx={{ mb: 1.5 }}>
      <Box component="svg" viewBox="0 0 200 112" sx={{ display: "block", width: "100%", maxWidth: 300, height: "auto", mx: "auto" }}>
        {/* Your site */}
        <g transform="translate(10 12)">
          <rect fill="#FFFFFF" height={44} rx={4} stroke={EDGE} width={62} />
          <path d="M0 4 a4 4 0 0 1 4 -4 h54 a4 4 0 0 1 4 4 v7 h-62 Z" fill="rgba(7, 21, 34, 0.05)" />
          {[6, 12, 18].map((cx) => (
            <circle cx={cx} cy={5.5} fill="rgba(7, 21, 34, 0.2)" key={cx} r={1.6} />
          ))}
          <rect fill={LINE} height={3} rx={1.5} width={40} x={8} y={18} />
          <rect fill={LINE} height={3} rx={1.5} width={30} x={8} y={25} />
          <rect fill={LINE} height={3} rx={1.5} width={36} x={8} y={32} />
        </g>
        <text fill="rgba(7, 21, 34, 0.55)" fontFamily="inherit" fontSize={6.4} fontWeight={600} textAnchor="middle" x={41} y={64}>
          Your site
        </text>

        {/* Reinvent WP */}
        <path
          d="M138 50 h44 a10 10 0 0 0 1 -20 a14 14 0 0 0 -26 -6 a11 11 0 0 0 -19 7 a9.5 9.5 0 0 0 0 19 Z"
          fill="#EAF3FC"
          stroke="rgba(0, 73, 132, 0.35)"
        />
        <text fill={BLUE} fontFamily="inherit" fontSize={8} fontWeight={700} textAnchor="middle" x={160} y={42}>
          R
        </text>
        <text fill="rgba(7, 21, 34, 0.55)" fontFamily="inherit" fontSize={6.4} fontWeight={600} textAnchor="middle" x={160} y={64}>
          Reinvent WP
        </text>

        {/* The way between them */}
        <path d="M78 34 H124" stroke={LINE} strokeDasharray="2 3" strokeLinecap="round" />

        <Box component="g" sx={anim(send, 0)}>
          <Bubble x={76} y={22} fill={BLUE} />
        </Box>
        <Box component="g" sx={anim(answer, 0)}>
          <Bubble x={106} y={36} fill="#6CB4F0" />
        </Box>
        <Box component="g" sx={anim(nothingKept, 1)}>
          <Tag x={134} y={72} label="Nothing kept" w={52} color={GREEN} />
        </Box>

        {saved && (
          <>
            {/* This site's database */}
            <ellipse cx={41} cy={84} fill="#FFFFFF" rx={16} ry={3.5} stroke={EDGE} />
            <path d="M25 84 V104 a16 3.5 0 0 0 32 0 V84" fill="#FFFFFF" stroke={EDGE} />
            <Box component="g" sx={anim(save, 0)}>
              <rect fill={BLUE} fillOpacity={0.55} height={3} rx={1.5} width={20} x={31} y={60} />
            </Box>
            <Box component="g" sx={anim(savedTag, 1)}>
              <Tag x={62} y={88} label="Saved here" w={46} color={GREEN} />
            </Box>
          </>
        )}
      </Box>
      <Box sx={{ position: "relative", height: 22 }}>
        {captions.map((text, index) => (
          <Box
            key={text}
            sx={{
              position: "absolute",
              inset: 0,
              textAlign: "center",
              color: "text.secondary",
              fontSize: 12.5,
              fontWeight: 650,
              lineHeight: "22px",
              animation: `${CAPTIONS[index]} ${LOOP} ease-in-out infinite`,
              opacity: 0,
              "@media (prefers-reduced-motion: reduce)": { animation: "none", opacity: index === 2 ? 1 : 0 },
            }}
          >
            {text}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
