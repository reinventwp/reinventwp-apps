// Copied from reinventwp-next src/content/HomePage/sections/hero/sceneCss.ts (the homepage story); keep the two in step.
/**
 * Small looping motions inside the hero scenes (smoke, clouds, the hovering home). A scene that isn't on screen is
 * paused, and everything stays still with reduced motion.
 */
const sceneCss = `
.hh-c { transform-box: fill-box; transform-origin: center; }
.hh-flicker { animation: hh-flicker 3.2s steps(1, end) infinite; }
.hh-smoke { animation: hh-smoke 5s ease-out infinite; opacity: 0; }
.hh-crows { animation: hh-crows 16s linear infinite; }
.hh-drift { animation: hh-drift 14s ease-in-out infinite alternate; }
.hh-pulse { animation: hh-pulse 4s ease-in-out infinite; }
.hh-hover { animation: hh-hover 5s ease-in-out infinite; }
.hh-twinkle { animation: hh-twinkle 3s ease-in-out infinite; }
.hh-dash { animation: hh-dash 9s linear infinite; }
.hh-fly { animation: hh-fly 9s linear infinite; }
.hh-fly-back { animation: hh-fly-back 13s linear infinite; }
.hh-blink { animation: hh-blink 2.2s linear infinite; }
.hh-scene[data-active="false"] * { animation-play-state: paused; }
@keyframes hh-flicker { 0%, 100% { opacity: 1; } 42% { opacity: 0.78; } 46% { opacity: 1; } 71% { opacity: 0.6; } 74% { opacity: 0.95; } }
@keyframes hh-smoke { 0% { transform: translate(0, 0) scale(0.6); opacity: 0; } 15% { opacity: 0.5; } 100% { transform: translate(30px, -96px) scale(1.9); opacity: 0; } }
@keyframes hh-crows { 0% { transform: translate(160px, 20px); opacity: 0; } 10%, 85% { opacity: 1; } 100% { transform: translate(-420px, -50px); opacity: 0; } }
@keyframes hh-drift { from { transform: translateX(-36px); } to { transform: translateX(36px); } }
@keyframes hh-pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.07); } }
@keyframes hh-hover { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
@keyframes hh-twinkle { 0%, 100% { opacity: 0.95; } 50% { opacity: 0.25; } }
@keyframes hh-dash { to { stroke-dashoffset: -240; } }
@keyframes hh-fly { from { transform: translateX(-180px); } to { transform: translateX(1380px); } }
@keyframes hh-fly-back { from { transform: translateX(1380px); } to { transform: translateX(-180px); } }
@keyframes hh-blink { 0%, 60%, 100% { opacity: 1; } 70%, 90% { opacity: 0.15; } }
@media (prefers-reduced-motion: reduce) { .hh-scene * { animation: none !important; } .hh-smoke { opacity: 0.35; } }
`

export default sceneCss
