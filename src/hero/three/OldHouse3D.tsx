// Copied from reinventwp-next src/content/HomePage/sections/hero/three/OldHouse3D.tsx (the homepage hero); keep the two in step.
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'
import parts from './parts'

const { Block, Pyramid, Rod } = parts
const INK = '#2E1D13'
const WOOD = '#5A3E2B'
const WOOD_DARK = '#4A3222'
const LAMP = '#FFC766'

/** Fence post positions along the front, with a few missing. */
const posts = [-2.7, -2.25, -1.8, -0.9, -0.45, 1.35, 1.8, 2.7]

/** The website as it is: a tired, leaning house with one lamp still on. */
export default function OldHouse3D() {
  const lamp = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (!lamp.current) return
    const time = clock.elapsedTime
    // An unsteady old bulb.
    lamp.current.intensity = 5 + Math.sin(time * 11) * 0.6 + (Math.sin(time * 2.3) > 0.92 ? -2.5 : 0)
  })

  return (
    <group>
      <group rotation={[0, 0, 0.03]}>
        {/* Main house. */}
        <Block at={[0.3, 0.75, 0]} color={WOOD} size={[2, 1.5, 1.6]} />
        <Pyramid at={[0.3, 2.05, 0]} color={INK} height={1.1} radius={1.6} />
        <Block at={[0.95, 2.05, -0.25]} color="#3A261A" size={[0.26, 1, 0.26]} />

        {/* Tower. */}
        <Block at={[-1.05, 1.25, 0.3]} color={WOOD_DARK} size={[0.75, 2.5, 0.75]} />
        <Pyramid at={[-1.05, 3.1, 0.3]} color={INK} height={1.2} radius={0.66} />
        <Rod at={[-1.05, 3.85, 0.3]} color={INK} height={0.35} radius={0.02} />

        {/* Windows and door: two lit, one dark with a shutter hanging loose. */}
        <Block at={[-0.05, 0.9, 0.81]} color={LAMP} glow={LAMP} size={[0.36, 0.52, 0.05]} />
        <Block at={[-1.05, 1.75, 0.69]} color={LAMP} glow={LAMP} size={[0.26, 0.42, 0.05]} />
        <Block at={[0.85, 0.9, 0.81]} color="#24150C" size={[0.36, 0.52, 0.05]} />
        <Block at={[1.1, 0.9, 0.84]} color={INK} rotation={[0, 0, -0.25]} size={[0.1, 0.54, 0.04]} />
        <Block at={[-0.3, 0.9, 0.84]} color={INK} size={[0.1, 0.54, 0.04]} />
        <Block at={[0.4, 0.36, 0.81]} color={INK} size={[0.34, 0.72, 0.05]} />

        {/* Porch. */}
        <Block at={[1.75, 0.98, 0.35]} color={INK} rotation={[0, 0, -0.14]} size={[1, 0.07, 0.8]} />
        <Rod at={[2.15, 0.45, 0.65]} color={WOOD_DARK} height={0.9} radius={0.035} />
        <Rod at={[2.15, 0.45, 0.05]} color={WOOD_DARK} height={0.9} radius={0.035} />
        <Block at={[1.75, 0.05, 0.35]} color={WOOD_DARK} size={[1, 0.1, 0.8]} />
      </group>

      {/* Bare tree. */}
      <Rod at={[-2.5, 0.9, 0.5]} color={INK} height={1.8} radius={0.13} radiusTop={0.06} />
      <Rod at={[-2.82, 1.75, 0.5]} color={INK} height={0.95} radius={0.05} radiusTop={0.02} rotation={[0, 0, 0.75]} />
      <Rod at={[-2.2, 1.9, 0.5]} color={INK} height={0.9} radius={0.045} radiusTop={0.02} rotation={[0, 0, -0.7]} />
      <Rod at={[-2.5, 2.1, 0.72]} color={INK} height={0.75} radius={0.04} radiusTop={0.015} rotation={[0.6, 0, 0]} />

      {/* Picket fence. */}
      {posts.map((x) => <Block at={[x, 0.2, 2.15]} color="#6B4A32" key={x} size={[0.09, 0.4, 0.05]} />)}
      <Block at={[-1.8, 0.24, 2.15]} color="#6B4A32" size={[2, 0.05, 0.04]} />
      <Block at={[2.05, 0.24, 2.15]} color="#6B4A32" size={[1.5, 0.05, 0.04]} />

      <pointLight color={LAMP} decay={1.6} distance={5} position={[-0.05, 0.9, 1.5]} ref={lamp} />
    </group>
  )
}
