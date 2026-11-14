// Copied from reinventwp-next src/content/HomePage/sections/hero/SceneSvg.tsx (the homepage story); keep the two in step.
import type { ReactNode } from 'react'

/**
 * One scene of the home hero, drawn on a 1200×800 canvas that covers its panel. It is anchored to the bottom centre,
 * so the house and the ground stay in view at any shape; a tall phone panel sees the middle 380 units or so.
 */
export default function SceneSvg({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMax slice"
      style={{ display: 'block', height: '100%', inset: 0, position: 'absolute', width: '100%' }}
      viewBox="0 0 1200 800"
    >
      {children}
    </svg>
  )
}
