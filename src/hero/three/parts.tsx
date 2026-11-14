// Copied from reinventwp-next src/content/HomePage/sections/hero/three/parts.tsx (the homepage hero); keep the two in step.
import type { ReactNode } from 'react'

type Vec3 = [number, number, number]

interface PartProps {
  at: Vec3
  color: string
  rotation?: Vec3
  /** Glow colour and strength, for lamps, windows and neon. */
  glow?: string
  glowStrength?: number
  opacity?: number
  /** Smooth, slightly shiny surface instead of the flat low-poly look. */
  smooth?: boolean
}

function Surface({ color, glow, glowStrength = 1.4, opacity, smooth }: Pick<PartProps, 'color' | 'glow' | 'glowStrength' | 'opacity' | 'smooth'>) {
  return (
    <meshStandardMaterial
      color={color}
      depthWrite={opacity === undefined}
      emissive={glow ?? '#000000'}
      emissiveIntensity={glow ? glowStrength : 0}
      flatShading={!smooth}
      metalness={smooth ? 0.25 : 0}
      opacity={opacity ?? 1}
      roughness={smooth ? 0.35 : 0.85}
      transparent={opacity !== undefined}
    />
  )
}

function Part({ at, rotation, children, ...surface }: PartProps & { children: ReactNode }) {
  return (
    <mesh position={at} rotation={rotation}>
      {children}
      <Surface {...surface} />
    </mesh>
  )
}

/** A box: `size` is [width, height, depth]. */
function Block({ size, ...part }: PartProps & { size: Vec3 }) {
  return <Part {...part}><boxGeometry args={size} /></Part>
}

/** A four-sided pyramid, for roofs. `radius` is from the centre to a corner. */
function Pyramid({ radius, height, at, ...part }: PartProps & { radius: number; height: number }) {
  return <Part {...part} at={at} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[radius, height, 4]} /></Part>
}

/** A low-poly cylinder; give `radiusTop` for a taper. */
function Rod({ radius, radiusTop, height, sides = 7, ...part }: PartProps & { radius: number; radiusTop?: number; height: number; sides?: number }) {
  return <Part {...part}><cylinderGeometry args={[radiusTop ?? radius, radius, height, sides]} /></Part>
}

/** A faceted ball, for tree tops and shrubs. */
function Blob({ radius, ...part }: PartProps & { radius: number }) {
  return <Part {...part}><icosahedronGeometry args={[radius, 0]} /></Part>
}

const parts = { Block, Blob, Pyramid, Rod, Surface }

export default parts
export type { Vec3 }
