// Copied from reinventwp-next src/content/HomePage/sections/hero/SvgStory.tsx (the homepage hero); keep the two in step.
import { Box } from '@mui/material'
import { motion, type TargetAndTransition, type Transition } from 'framer-motion'
import type { ReactNode } from 'react'
import FutureHomeScene from './FutureHomeScene'
import HeroCopy from './HeroCopy'
import ModernHouseScene from './ModernHouseScene'
import OldHouseScene from './OldHouseScene'
import sceneCss from './sceneCss'
import story from './story'

const drawings = [OldHouseScene, ModernHouseScene, FutureHomeScene]

const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1]
const SHOWN = 'inset(0% 0% 0% 0%)'
const OFF_RIGHT = 'inset(0% 100% 0% 0%)'
const OFF_LEFT = 'inset(0% 0% 0% 100%)'
const wipe: Transition = { duration: story.timing.changeS, ease: EASE }
const instant: Transition = { duration: 0 }

/**
 * How a scene layer is clipped at each step. The old house is the bottom layer and is never clipped; the modern and
 * future layers sit above it and wipe in from the left. When the story starts over, the future layer wipes away and
 * the modern layer under it has already been hidden, so the old house shows through.
 */
function clipFor(layer: number, scene: number): { animate: TargetAndTransition; transition: Transition } {
  if (layer === scene) return { animate: { clipPath: [OFF_RIGHT, SHOWN] }, transition: wipe }
  if (layer < scene) return { animate: { clipPath: SHOWN }, transition: instant }
  if (layer === drawings.length - 1 && scene === 0) return { animate: { clipPath: [SHOWN, OFF_LEFT] }, transition: wipe }
  return { animate: { clipPath: scene === 0 ? OFF_LEFT : OFF_RIGHT }, transition: instant }
}

function SceneLayer({ layer, scene, children }: { layer: number; scene: number; children: ReactNode }) {
  const previous = (scene + drawings.length - 1) % drawings.length
  const sx = { inset: 0, position: 'absolute' } as const
  // Only the scene on show, and the one it is replacing, keep moving.
  const active = layer === scene || layer === previous

  if (layer === 0) {
    return <Box className="hh-scene" data-active={active} sx={sx}>{children}</Box>
  }

  const { animate, transition } = clipFor(layer, scene)
  return (
    <Box animate={animate} aria-hidden className="hh-scene" component={motion.div} data-active={active} initial={false} sx={sx} transition={transition}>
      {children}
    </Box>
  )
}

/** The story as flat illustrations, each wiped into the next by a scan line. Used on phones and until 3D is ready. */
export default function SvgStory({ scene, changes }: { scene: number; changes: number }) {
  return (
    <>
      <style>{sceneCss}</style>

      {story.scenes.map(({ label, title, text }, layer) => {
        const Drawing = drawings[layer]
        return (
          <SceneLayer key={label} layer={layer} scene={scene}>
            <Drawing />
            <HeroCopy real={layer === 0} text={text} title={title} />
          </SceneLayer>
        )
      })}

      {/* The scan line that rebuilds the house. */}
      {changes > 0 && (
        <Box
          animate={{ left: '100%', opacity: [0, 1, 1, 0] }}
          aria-hidden
          component={motion.span}
          initial={{ left: '0%', opacity: 0 }}
          key={changes}
          sx={{ bgcolor: '#FFFFFF', bottom: 0, boxShadow: '0 0 22px 6px rgba(95, 240, 255, 0.7)', pointerEvents: 'none', position: 'absolute', top: 0, width: 3 }}
          transition={{ ...wipe, opacity: { duration: story.timing.changeS, times: [0, 0.08, 0.92, 1] } }}
        />
      )}
    </>
  )
}
