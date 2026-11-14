// Copied from reinventwp-next src/content/HomePage/sections/hero/ModernHouseScene.tsx (the homepage story); keep the two in step.
import SceneSvg from './SceneSvg'

const TRIM = '#D5DEE8'
const SLAB = '#E9EFF5'

/** The same plot, rebuilt: a clean modern house on a clear day. */
export default function ModernHouseScene() {
  return (
    <SceneSvg>
      <defs>
        <linearGradient id="hh-mod-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#F1F8FF" />
          <stop offset="0.6" stopColor="#D3EAFF" />
          <stop offset="1" stopColor="#B9DDFF" />
        </linearGradient>
        <linearGradient id="hh-mod-glass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#CDEBFD" />
          <stop offset="0.5" stopColor="#8FCDF3" />
          <stop offset="1" stopColor="#6DB8F0" />
        </linearGradient>
      </defs>

      <rect fill="url(#hh-mod-sky)" height="800" width="1200" />

      <circle className="hh-pulse hh-c" cx="748" cy="478" fill="#FFE9A8" r="58" />
      <circle cx="748" cy="478" fill="#FFD466" r="32" />

      <g className="hh-drift" fill="#FFFFFF" opacity="0.95">
        <ellipse cx="300" cy="470" rx="62" ry="20" />
        <ellipse cx="270" cy="456" rx="34" ry="20" />
        <ellipse cx="326" cy="452" rx="40" ry="24" />
        <ellipse cx="950" cy="420" rx="70" ry="22" />
        <ellipse cx="920" cy="404" rx="38" ry="22" />
        <ellipse cx="982" cy="402" rx="44" ry="26" />
      </g>

      <path d="M0 700 C 180 650 340 668 520 696 S 860 656 1040 688 S 1160 670 1200 680 V800 H0Z" fill="#CDEBC4" />
      <path d="M0 742 C 200 732 400 746 600 740 S 1000 734 1200 744 V800 H0Z" fill="#9FD69A" />
      <path d="M0 774 C 300 764 700 780 1200 768 V800 H0Z" fill="#84C680" />
      <polygon fill="#E7ECF2" points="636,740 692,740 772,800 596,800" />

      {/* Tree and shrubs. */}
      <rect fill="#8A5A35" height="100" width="10" x="412" y="642" />
      <circle cx="392" cy="634" fill="#6CBF82" r="30" />
      <circle cx="444" cy="632" fill="#4FA368" r="30" />
      <circle cx="417" cy="608" fill="#5DB075" r="44" />
      <ellipse cx="470" cy="738" fill="#5DB075" rx="26" ry="12" />
      <ellipse cx="760" cy="738" fill="#6CBF82" rx="22" ry="10" />

      {/* Lower floor: white, with a wall of glass. */}
      <rect fill="#FFFFFF" height="88" stroke={TRIM} strokeWidth="2" width="236" x="486" y="652" />
      <rect fill="url(#hh-mod-glass)" height="64" width="120" x="502" y="668" />
      <path d="M542 668 V732 M582 668 V732" stroke="#FFFFFF" strokeWidth="3" />
      <rect fill="#B07A45" height="64" width="34" x="646" y="676" />
      <rect fill="#F4E3CF" height="14" rx="2" width="3" x="652" y="702" />

      {/* Roof terrace on the left. */}
      <rect fill="#BFE3FA" height="20" opacity="0.65" width="56" x="486" y="626" />
      <rect fill={SLAB} height="8" stroke={TRIM} width="72" x="476" y="645" />

      {/* Upper floor: a timber box that overhangs on the right. */}
      <rect fill="#C9955F" height="74" width="236" x="540" y="578" />
      {Array.from({ length: 19 }, (_, index) => 552 + index * 12).map((x) => (
        <line key={x} opacity="0.7" stroke="#B07F4A" strokeWidth="2" x1={x} x2={x} y1="578" y2="652" />
      ))}
      <rect fill="url(#hh-mod-glass)" height="38" width="150" x="560" y="596" />
      <path d="M610 596 V634 M660 596 V634" stroke="#FFFFFF" strokeWidth="3" />
      <rect fill="#9AA7B5" height="88" width="6" x="764" y="652" />
      <rect fill={SLAB} height="9" stroke={TRIM} width="256" x="530" y="570" />

      {/* Solar panels. */}
      <polygon fill="#1F4E8C" points="566,570 606,570 612,555 572,555" />
      <polygon fill="#1F4E8C" points="622,570 662,570 668,555 628,555" />
      <path d="M586 570 L592 555 M642 570 L648 555" stroke="#6FA3E0" strokeWidth="1.5" />

      {/* An electric car, charging. */}
      <path d="M822 722 q2 -18 22 -20 h30 q16 2 24 16 h10 q8 2 8 12 v6 h-96 v-8 q0 -6 2 -6 Z" fill="#3F8FDC" />
      <path d="M846 706 h26 q10 2 16 12 h-44 Z" fill="#CDEBFD" />
      <circle cx="840" cy="738" fill="#22313F" r="9" />
      <circle cx="898" cy="738" fill="#22313F" r="9" />
      <circle cx="840" cy="738" fill="#B8C4D0" r="3.5" />
      <circle cx="898" cy="738" fill="#B8C4D0" r="3.5" />
    </SceneSvg>
  )
}
