// Copied from reinventwp-next src/content/HomePage/sections/hero/three/FutureHome3D.tsx (the homepage hero); keep the two in step.
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'
import parts from './parts'

const { Block, Rod, Surface } = parts
const CYAN = '#5FF0FF'
const PINK = '#FF7AD9'
const TOWER = '#1B2060'

/** Skyline towers around the back of the deck, as [angle in degrees, distance, width, height]. */
const towers: [number, number, number, number][] = [
  [200, 3.1, 0.42, 2], [228, 3.2, 0.36, 2.8], [255, 3, 0.5, 1.5], [285, 3.2, 0.38, 2.4], [312, 3.1, 0.44, 1.8], [340, 3.2, 0.34, 3],
]

/** The website reinvented: a home that floats over a glowing landing pad, with flying cars around it. */
export default function FutureHome3D() {
  const pod = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const cars = useRef<THREE.Group>(null)
  const beacon = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    if (pod.current) pod.current.position.y = 1.9 + Math.sin(time * 1.3) * 0.12
    if (ring.current) ring.current.rotation.z = time * 0.6
    if (cars.current) cars.current.rotation.y = time * 0.7
    if (beacon.current) beacon.current.visible = time % 1.6 < 1.1
  })

  return (
    <group>
      {/* Skyline. */}
      {towers.map(([degrees, distance, width, height]) => {
        const angle = (degrees * Math.PI) / 180
        const x = Math.cos(angle) * distance
        const z = Math.sin(angle) * distance
        return (
          <group key={degrees} position={[x, 0, z]} rotation={[0, Math.PI / 2 - angle, 0]}>
            <Block at={[0, height / 2, 0]} color={TOWER} size={[width, height, width]} />
            <parts.Pyramid at={[0, height + 0.18, 0]} color={TOWER} height={0.36} radius={width * 0.7} />
            {Array.from({ length: Math.floor(height / 0.45) }, (_, row) => 0.3 + row * 0.45).map((y) => (
              <Block at={[0, y, width / 2 + 0.01]} color={CYAN} glow={CYAN} glowStrength={1.2} key={y} size={[width * 0.6, 0.05, 0.02]} />
            ))}
          </group>
        )
      })}

      {/* Landing pad and the light beam under the home. */}
      <mesh position={[0, 0.03, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.55, 0.035, 8, 48]} />
        <Surface color={CYAN} glow={CYAN} glowStrength={2} />
      </mesh>
      <mesh position={[0, 0.02, 0.2]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noShadow: true }}>
        <circleGeometry args={[1.1, 32]} />
        <meshBasicMaterial color={CYAN} depthWrite={false} opacity={0.18} transparent />
      </mesh>
      <mesh position={[0, 0.6, 0.2]} userData={{ noShadow: true }}>
        <cylinderGeometry args={[0.6, 1.15, 1.15, 24, 1, true]} />
        <meshBasicMaterial color={CYAN} depthWrite={false} opacity={0.14} side={2} transparent />
      </mesh>

      {/* The floating home. */}
      <group position={[0, 1.75, 0.2]} ref={pod} scale={1.2}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.62, 1.5, 6, 18]} />
          <Surface color="#EEF3FF" smooth />
        </mesh>
        <mesh position={[0, 0.06, 0.36]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.34, 1.15, 6, 16]} />
          <Surface color="#3D8BFF" glow={CYAN} glowStrength={1.1} smooth />
        </mesh>
        <mesh position={[0, 0.5, 0]} userData={{ noShadow: true }}>
          <sphereGeometry args={[0.5, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Surface color="#BFEFFF" opacity={0.45} smooth />
        </mesh>
        <Rod at={[0, 1.15, 0]} color="#DCE8FF" height={0.4} radius={0.02} />
        <mesh position={[0, 1.38, 0]} ref={beacon}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <Surface color={PINK} glow={PINK} glowStrength={3} />
        </mesh>
        <Rod at={[0, -0.64, 0]} color={CYAN} glow={CYAN} glowStrength={2.4} height={0.05} radius={0.55} sides={24} />
        <mesh position={[-1.5, 0, 0]} scale={[0.6, 1, 0.6]}>
          <sphereGeometry args={[0.3, 12, 10]} />
          <Surface color="#C7D6F5" smooth />
        </mesh>
        <mesh position={[1.5, 0, 0]} scale={[0.6, 1, 0.6]}>
          <sphereGeometry args={[0.3, 12, 10]} />
          <Surface color="#C7D6F5" smooth />
        </mesh>

        {/* Orbit ring. */}
        <group rotation={[Math.PI / 2 - 0.25, 0.15, 0]}>
          <mesh ref={ring} userData={{ noShadow: true }}>
            <torusGeometry args={[2.05, 0.022, 6, 72]} />
            <Surface color={PINK} glow={PINK} glowStrength={2.2} />
          </mesh>
        </group>

        <pointLight color={CYAN} decay={1.4} distance={6} intensity={9} position={[0, -1, 0]} />
        <pointLight color={PINK} decay={1.6} distance={5} intensity={4} position={[0, 1.6, 0.8]} />
      </group>

      {/* Flying cars, circling. */}
      <group ref={cars}>
        {[[3.3, 2.6, 0], [-3.1, 3.2, 0.6]].map(([x, y, z]) => (
          <group key={x} position={[x, y, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <capsuleGeometry args={[0.07, 0.3, 4, 8]} />
              <Surface color="#EAF2FF" smooth />
            </mesh>
            <Block at={[0, 0, x > 0 ? 0.42 : -0.42]} color={CYAN} glow={CYAN} glowStrength={2.5} opacity={0.7} size={[0.03, 0.03, 0.5]} />
          </group>
        ))}
      </group>
    </group>
  )
}
