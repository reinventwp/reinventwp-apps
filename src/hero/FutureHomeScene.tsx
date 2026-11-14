// Copied from reinventwp-next src/content/HomePage/sections/hero/FutureHomeScene.tsx (the homepage story); keep the two in step.
import SceneSvg from './SceneSvg'

const CYAN = '#5FF0FF'
const PINK = '#FF7AD9'

/** Stars as [x, y, radius]; every third one twinkles. */
const stars: [number, number, number][] = [
  [60, 210, 1.6], [130, 330, 1.2], [190, 250, 2], [250, 420, 1.3], [310, 200, 1.5], [360, 340, 1.1], [420, 470, 1.6], [470, 230, 1.2],
  [540, 500, 1.4], [610, 190, 1.8], [660, 470, 1.2], [720, 240, 1.4], [770, 400, 1.7], [840, 210, 1.2], [900, 470, 1.5], [960, 240, 1.2],
  [1010, 430, 1.8], [1090, 200, 1.3], [1150, 380, 1.5], [450, 400, 1], [580, 420, 1.1], [700, 520, 1.3], [500, 540, 1.1], [330, 500, 1.4],
]

/** Skyline towers as [x, width, height]; they stand on the horizon at y 742. */
const towers: [number, number, number][] = [
  [120, 34, 190], [166, 26, 250], [204, 40, 150], [256, 22, 300], [290, 36, 210], [338, 28, 130],
  [842, 30, 150], [884, 24, 280], [920, 40, 200], [972, 26, 330], [1010, 36, 180], [1058, 30, 240],
]

/** A flying car with its light trail, pointing right at the origin. */
function FlyingCar({ y, back = false }: { y: number; back?: boolean }) {
  return (
    <g className={back ? 'hh-fly-back' : 'hh-fly'}>
      <g transform={back ? `translate(0 ${y}) scale(-1 1)` : `translate(0 ${y})`}>
        <rect fill="url(#hh-fut-trail)" height="3" width="90" x="-90" y="3.5" />
        <rect fill="#EAF2FF" height="10" rx="5" width="34" x="0" y="0" />
        <circle cx="30" cy="5" fill={CYAN} r="2.5" />
      </g>
    </g>
  )
}

/** The website reinvented: a home that floats, under a sky from the future. */
export default function FutureHomeScene() {
  return (
    <SceneSvg>
      <defs>
        <linearGradient id="hh-fut-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#080C2A" />
          <stop offset="0.55" stopColor="#1E1856" />
          <stop offset="1" stopColor="#56308C" />
        </linearGradient>
        <radialGradient id="hh-fut-horizon">
          <stop offset="0" stopColor="#FF7AD9" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FF7AD9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hh-fut-planet" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#FFC4DD" />
          <stop offset="1" stopColor="#7C55D0" />
        </linearGradient>
        <linearGradient id="hh-fut-body" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#A4BAE8" />
        </linearGradient>
        <linearGradient id="hh-fut-glass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#9BF8FF" />
          <stop offset="1" stopColor="#3D8BFF" />
        </linearGradient>
        <linearGradient id="hh-fut-beam" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={CYAN} stopOpacity="0.45" />
          <stop offset="1" stopColor={CYAN} stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="hh-fut-trail" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={CYAN} stopOpacity="0" />
          <stop offset="1" stopColor={CYAN} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <rect fill="url(#hh-fut-sky)" height="800" width="1200" />
      <ellipse cx="600" cy="750" fill="url(#hh-fut-horizon)" rx="760" ry="250" />

      {stars.map(([x, y, radius], index) => (
        <circle
          className={index % 3 === 0 ? 'hh-twinkle' : undefined}
          cx={x}
          cy={y}
          fill="#FFFFFF"
          key={`${x}-${y}`}
          opacity="0.9"
          r={radius}
          style={index % 3 === 0 ? { animationDelay: `${(index % 5) * 0.5}s` } : undefined}
        />
      ))}

      {/* A ringed planet, far right. */}
      <g transform="rotate(-18 1104 432)">
        <ellipse cx="1104" cy="432" fill="none" opacity="0.8" rx="78" ry="14" stroke="#FFD9F0" strokeWidth="4" />
        <circle cx="1104" cy="432" fill="url(#hh-fut-planet)" r="42" />
        <path d="M 1026 432 A 78 14 0 0 0 1182 432" fill="none" opacity="0.9" stroke="#FFD9F0" strokeWidth="4" />
      </g>

      {/* Skyline. */}
      <g>
        {towers.map(([x, width, height]) => (
          <g key={x}>
            <polygon fill="#161A4A" points={`${x},${742 - height} ${x + width / 2},${742 - height - 26} ${x + width},${742 - height}`} />
            <rect fill="#161A4A" height={height} width={width} x={x} y={742 - height} />
            {Array.from({ length: Math.floor(height / 34) }, (_, row) => 742 - height + 16 + row * 34).map((y) => (
              <rect fill={CYAN} height="3" key={y} opacity="0.55" width={width - 14} x={x + 7} y={y} />
            ))}
          </g>
        ))}
      </g>

      <FlyingCar y={506} />
      <FlyingCar back y={452} />

      {/* Ground: a dark deck with a glowing grid and a landing pad. */}
      <rect fill="#0C1136" height="58" width="1200" y="742" />
      <g opacity="0.3" stroke={CYAN} strokeWidth="1.5">
        <line x1="0" x2="1200" y1="752" y2="752" />
        <line x1="0" x2="1200" y1="766" y2="766" />
        <line x1="0" x2="1200" y1="786" y2="786" />
        {[-360, -200, -40, 120, 280, 440, 600, 760, 920, 1080, 1240, 1400, 1560].map((x) => (
          <line key={x} x1="600" x2={x} y1="742" y2="800" />
        ))}
      </g>
      <polygon fill="url(#hh-fut-beam)" points="566,690 634,690 708,746 492,746" />
      <ellipse cx="600" cy="746" fill={CYAN} opacity="0.16" rx="104" ry="9" />
      <ellipse className="hh-pulse hh-c" cx="600" cy="746" fill="none" rx="150" ry="13" stroke={CYAN} strokeWidth="2" />

      {/* The floating home. */}
      <g className="hh-hover">
        <g transform="rotate(-8 600 640)">
          <ellipse className="hh-dash" cx="600" cy="640" fill="none" opacity="0.75" rx="165" ry="26" stroke={PINK} strokeDasharray="10 14" strokeWidth="2" />
        </g>

        <ellipse cx="484" cy="642" fill="#C7D6F5" rx="12" ry="20" />
        <ellipse cx="716" cy="642" fill="#C7D6F5" rx="12" ry="20" />
        <line stroke="#DCE8FF" strokeWidth="3" x1="600" x2="600" y1="566" y2="536" />
        <circle className="hh-blink" cx="600" cy="532" fill="#FF5FD2" r="5" />
        <path d="M556 602 C 560 556 640 556 644 602 Z" fill="#BFEFFF" opacity="0.55" stroke="#E8FBFF" strokeWidth="2" />

        <rect fill="url(#hh-fut-body)" height="84" rx="42" width="224" x="488" y="600" />
        <rect fill="#6FE9FF" height="46" opacity="0.28" rx="23" width="180" x="510" y="614" />
        <rect fill="url(#hh-fut-glass)" height="34" rx="17" width="168" x="516" y="620" />
        <path d="M572 620 V654 M628 620 V654" opacity="0.6" stroke="#EAF6FF" strokeWidth="2" />
        <ellipse cx="600" cy="686" fill={CYAN} opacity="0.9" rx="64" ry="7" />

        {/* The front half of the orbit ring, over the body. */}
        <g transform="rotate(-8 600 640)">
          <path className="hh-dash" d="M 435 640 A 165 26 0 0 0 765 640" fill="none" stroke={PINK} strokeDasharray="10 14" strokeWidth="2" />
        </g>
      </g>
    </SceneSvg>
  )
}
