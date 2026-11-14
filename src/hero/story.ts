// Copied from reinventwp-next src/content/HomePage/sections/hero/story.ts (the homepage story); keep the two in step.
import { useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * The hero's story: the same plot of land as an old house (the boring website), rebuilt as a modern house, then as
 * a floating home from the future. `title` and `text` are the copy colours over each scene's sky.
 */
const scenes = [
  { label: 'Old', title: '#3D2A14', text: '#5E4326' },
  { label: 'Modern', title: '#004984', text: '#41566B' },
  { label: 'Future', title: '#FFFFFF', text: '#C9D6FF' },
] as const

/** How long the first scene stays, how long the others stay, and how long a change takes. */
const timing = { firstHoldMs: 2200, holdMs: 3400, changeS: 1.25 }

/** The scene on show and how many changes have run; stays on the last scene with reduced motion. */
function useStory(): { scene: number; changes: number } {
  const reduce = useReducedMotion()
  const [changes, setChanges] = useState(0)

  useEffect(() => {
    if (reduce) return undefined
    const wait = changes === 0 ? timing.firstHoldMs : timing.holdMs + timing.changeS * 1000
    const timer = window.setTimeout(() => setChanges((count) => count + 1), wait)
    return () => window.clearTimeout(timer)
  }, [reduce, changes])

  return reduce ? { scene: scenes.length - 1, changes: 0 } : { scene: changes % scenes.length, changes }
}

const story = { scenes, timing, useStory }

export default story
