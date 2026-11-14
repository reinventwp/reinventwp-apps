// Copied from reinventwp-next src/content/HomePage/sections/hero/OldHouseScene.tsx (the homepage story); keep the two in step.
import SceneSvg from './SceneSvg'

const INK = '#2E1D13'
const WOOD = '#5A3E2B'
const WOOD_DARK = '#4A3222'
const LAMP = '#FFC766'

/** X positions of fence pickets from `from` to `to`, 18 apart. */
const pickets = (from: number, to: number): number[] => Array.from({ length: Math.floor((to - from) / 18) + 1 }, (_, index) => from + index * 18)

/** The website as it is: a tired old house at sunset, one lamp still on. */
export default function OldHouseScene() {
  return (
    <SceneSvg>
      <defs>
        <linearGradient id="hh-old-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#F6EBD6" />
          <stop offset="0.6" stopColor="#EBCB98" />
          <stop offset="1" stopColor="#CF8F50" />
        </linearGradient>
        <radialGradient id="hh-old-halo">
          <stop offset="0.5" stopColor="#FFF4DA" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFF4DA" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hh-old-lamp">
          <stop offset="0" stopColor={LAMP} stopOpacity="0.6" />
          <stop offset="1" stopColor={LAMP} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hh-old-mist">
          <stop offset="0" stopColor="#FFF1D6" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FFF1D6" stopOpacity="0" />
        </radialGradient>
        <radialGradient cx="0.5" cy="0.62" id="hh-old-vignette" r="0.8">
          <stop offset="0.5" stopColor="#2A1608" stopOpacity="0" />
          <stop offset="1" stopColor="#2A1608" stopOpacity="0.5" />
        </radialGradient>
      </defs>

      <rect fill="url(#hh-old-sky)" height="800" width="1200" />

      {/* A low sun behind the house, so the roofs read as a silhouette. */}
      <circle cx="700" cy="590" fill="url(#hh-old-halo)" r="190" />
      <circle cx="700" cy="590" fill="#FFF3D6" r="104" />

      <path d="M0 696 C 150 648 300 664 450 694 S 800 654 1000 684 S 1150 664 1200 674 V800 H0Z" fill="#B77F45" opacity="0.75" />

      <g className="hh-crows" fill="none" stroke={INK} strokeLinecap="round" strokeWidth="3">
        <path d="M800 492 q8 -8 16 0 q8 -8 16 0" />
        <path d="M846 512 q6 -6 12 0 q6 -6 12 0" />
        <path d="M828 470 q5 -5 10 0 q5 -5 10 0" />
      </g>

      {/* Bare tree. */}
      <g fill="none" stroke={INK} strokeLinecap="round">
        <path d="M400 742 C 402 690 396 650 404 600" strokeWidth="14" />
        <path d="M402 660 C 380 640 366 620 356 590" strokeWidth="7" />
        <path d="M404 630 C 424 612 436 596 440 566" strokeWidth="6" />
        <path d="M368 618 C 352 612 342 600 334 590" strokeWidth="4" />
        <path d="M402 604 C 398 584 406 566 400 546" strokeWidth="5" />
        <path d="M436 590 C 448 584 456 576 462 564" strokeWidth="3.5" />
      </g>

      {/* The house leans a little. */}
      <g transform="rotate(-1.5 600 740)">
        <rect fill={INK} height="52" width="20" x="650" y="518" />
        {[0, 1.6, 3.2].map((delay) => (
          <circle className="hh-smoke hh-c" cx="660" cy="510" fill="#F3E4CC" key={delay} r="12" style={{ animationDelay: `${delay}s` }} />
        ))}

        {/* Tower. */}
        <rect fill={WOOD_DARK} height="192" width="62" x="468" y="548" />
        <polygon fill={INK} points="458,550 499,462 540,550" />
        <line stroke={INK} strokeWidth="3" x1="499" x2="499" y1="464" y2="444" />
        <circle cx="499" cy="442" fill={INK} r="4" />
        <circle cx="499" cy="606" fill="url(#hh-old-lamp)" r="46" />
        <path className="hh-flicker" d="M488 626 V600 a11 11 0 0 1 22 0 V626 Z" fill={LAMP} />
        <path d="M499 590 V626 M488 608 H510" stroke={WOOD_DARK} strokeWidth="2" />

        {/* Main house. */}
        <rect fill={WOOD} height="144" width="160" x="526" y="596" />
        {[612, 628, 644, 660, 676, 692, 708, 724].map((y) => (
          <line key={y} opacity="0.55" stroke={WOOD_DARK} strokeWidth="2" x1="526" x2="686" y1={y} y2={y} />
        ))}
        <polygon fill={INK} points="508,602 606,506 704,602" />
        <circle cx="606" cy="562" fill="#8A6A3C" r="12" />
        <path d="M606 550 V574 M594 562 H618" stroke={INK} strokeWidth="2" />

        <circle cx="561" cy="648" fill="url(#hh-old-lamp)" r="52" />
        <rect className="hh-flicker" fill={LAMP} height="44" width="30" x="546" y="626" />
        <path d="M561 626 V670 M546 648 H576" stroke={WOOD_DARK} strokeWidth="2" />
        <rect fill={INK} height="46" width="9" x="535" y="625" />
        <rect fill={INK} height="46" transform="rotate(9 580 625)" width="9" x="578" y="625" />

        {/* A dark window with a shutter hanging loose. */}
        <rect fill="#24150C" height="44" width="30" x="636" y="626" />
        <path d="M651 626 V670 M636 648 H666" stroke={WOOD_DARK} strokeWidth="2" />
        <rect fill={INK} height="46" transform="rotate(-14 668 625)" width="9" x="668" y="625" />

        <rect fill={INK} height="56" width="26" x="594" y="684" />
        <circle cx="614" cy="714" fill="#8A6A3C" r="2" />

        {/* Porch. */}
        <polygon fill={INK} points="686,652 772,668 772,676 686,664" />
        <rect fill={WOOD_DARK} height="70" width="5" x="724" y="670" />
        <rect fill={WOOD_DARK} height="64" width="5" x="764" y="676" />
        <rect fill={WOOD_DARK} height="8" width="92" x="686" y="732" />
      </g>

      {/* Picket fence with a few pickets missing. */}
      <g fill="#6B4A32">
        <rect height="4" width="172" x="286" y="724" />
        <rect height="4" width="154" x="784" y="724" />
        {pickets(290, 452).filter((x) => x !== 344 && x !== 416).map((x) => <rect height="30" key={x} width="8" x={x} y="712" />)}
        {pickets(788, 932).filter((x) => x !== 860).map((x) => <rect height="30" key={x} width="8" x={x} y="712" />)}
      </g>

      <path d="M0 742 C 200 730 400 748 600 740 S 1000 732 1200 744 V800 H0Z" fill="#5E3F26" />
      <path d="M0 772 C 300 760 700 778 1200 766 V800 H0Z" fill="#4A3020" />

      {/* Ground mist. */}
      <ellipse className="hh-drift" cx="600" cy="740" fill="url(#hh-old-mist)" rx="560" ry="34" />

      <rect fill="url(#hh-old-vignette)" height="800" width="1200" />
    </SceneSvg>
  )
}
