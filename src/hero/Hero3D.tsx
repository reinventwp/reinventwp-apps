// Copied from reinventwp-next src/content/HomePage/sections/hero/Hero3D.tsx (the homepage hero); keep the two in step.
import { Box } from '@mui/material'
import { lazy, type PointerEvent, Suspense, useEffect, useRef, useState } from 'react'
import HeroCopy from './HeroCopy'
import story from './story'

// The website loads it with next/dynamic; React.lazy does the same here (three.js only loads when 3D is used).
const Diorama = lazy(() => import(/* webpackChunkName: "hub-3d" */ './three/Diorama'))

/** Painted skies behind the 3D land, one per scene: sunset, clear day, and a starry night with a glowing horizon. */
const skies = [
  'radial-gradient(circle at 66% 74%, #FFF3D6 0 7%, rgba(255, 244, 218, 0.55) 7.4%, rgba(255, 244, 218, 0) 24%), radial-gradient(ellipse at 50% 60%, rgba(42, 22, 8, 0) 50%, rgba(42, 22, 8, 0.42) 100%), linear-gradient(180deg, #F6EBD6 0%, #EBCB98 60%, #CF8F50 100%)',
  'radial-gradient(circle at 74% 50%, #FFD466 0 2.6%, rgba(255, 233, 168, 0.75) 2.8% 4.8%, rgba(255, 233, 168, 0) 5.2%), linear-gradient(180deg, #F1F8FF 0%, #D3EAFF 60%, #B9DDFF 100%)',
  `${[[8, 30], [16, 52], [24, 22], [31, 64], [38, 36], [47, 70], [55, 28], [63, 58], [71, 34], [79, 62], [86, 26], [93, 48], [12, 76], [89, 78]]
    .map(([x, y]) => `radial-gradient(1.6px 1.6px at ${x}% ${y}%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0))`)
    .join(', ')}, radial-gradient(ellipse 70% 45% at 50% 100%, rgba(255, 122, 217, 0.5), rgba(255, 122, 217, 0)), linear-gradient(180deg, #080C2A 0%, #1E1856 55%, #56308C 100%)`,
]

/**
 * A sky layer's opacity and whether it fades. The first sky is always there; the others sit on top and fade in. When
 * the story starts over the last sky fades out, and the middle one under it has already been switched off.
 */
function skyState(layer: number, scene: number): { opacity: number; fades: boolean } {
  if (layer === 0) return { opacity: 1, fades: false }
  if (layer === skies.length - 1) return { opacity: scene === layer ? 1 : 0, fades: scene !== 1 }
  return { opacity: scene >= layer ? 1 : 0, fades: scene === layer }
}

interface Hero3DProps {
  scene: number
  /** Told true once the 3D hero fully covers what is under it, and false when it goes away. */
  onCovered: (covered: boolean) => void
}

/** The story as a 3D diorama over painted skies, with one copy whose colours follow the scene. Desktop only. */
export default function Hero3D({ scene, onCovered }: Hero3DProps) {
  const [ready, setReady] = useState(false)
  const [covered, setCovered] = useState(false)
  const pointer = useRef({ x: 0, y: 0 })
  const { title, text } = story.scenes[scene]

  useEffect(() => () => onCovered(false), [onCovered])

  const followPointer = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    pointer.current = { x: ((event.clientX - box.left) / box.width) * 2 - 1, y: ((event.clientY - box.top) / box.height) * 2 - 1 }
  }

  const finishCover = () => {
    if (!ready || covered) return
    setCovered(true)
    onCovered(true)
  }

  return (
    <Box
      onPointerLeave={() => { pointer.current = { x: 0, y: 0 } }}
      onPointerMove={followPointer}
      onTransitionEnd={(event) => event.target === event.currentTarget && finishCover()}
      sx={{ inset: 0, opacity: ready ? 1 : 0, position: 'absolute', transition: 'opacity 600ms ease' }}
    >
      {skies.map((background, layer) => {
        const { opacity, fades } = skyState(layer, scene)
        return <Box aria-hidden key={background} sx={{ background, inset: 0, opacity, position: 'absolute', transition: fades ? `opacity ${story.timing.changeS}s ease` : 'none' }} />
      })}

      <Suspense fallback={null}>
        <Diorama changeS={story.timing.changeS + 0.25} onReady={() => setReady(true)} pointer={pointer} scene={scene} />
      </Suspense>

      {/* Until this hero covers the page, the heading under it is the real one. */}
      <Box aria-hidden={!covered} sx={{ pointerEvents: 'none', position: 'relative' }}>
        <HeroCopy fade real={covered} text={text} title={title} />
      </Box>
    </Box>
  )
}
