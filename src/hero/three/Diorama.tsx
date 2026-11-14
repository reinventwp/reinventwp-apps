// Copied from reinventwp-next src/content/HomePage/sections/hero/three/Diorama.tsx (the homepage hero); keep the two in step.
import { Canvas, useFrame } from '@react-three/fiber'
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import eras from './eras'
import FutureHome3D from './FutureHome3D'
import ModernHouse3D from './ModernHouse3D'
import OldHouse3D from './OldHouse3D'

export interface DioramaProps {
  /** Which scene of the story to show: 0 old, 1 modern, 2 future. */
  scene: number
  /** Seconds a change of scene takes. */
  changeS: number
  /** The pointer over the hero, from -1 to 1 on each axis. */
  pointer: RefObject<{ x: number; y: number }>
  /** Called once the first frame is drawn. */
  onReady: () => void
}

const TAU = Math.PI * 2
/** Three-quarter view of the house. */
const BASE_TURN = -0.45
const FOV = 30
/** Where the camera starts; every frame it is placed again to fit the panel (see `fitCamera`). */
const CAMERA: [number, number, number] = [0, 7, 22]
/** The diorama's height, from under the rock to the top of the tallest roof, and its width, in scene units. */
const MODEL = { height: 6.6, width: 8, below: 2.7 }
/** Room the headline and company line take at the top of the panel, in pixels. */
const COPY_PX = 290

/**
 * How far back the camera sits, and the height it looks at, so the diorama fills the room under the copy without
 * touching it, sits just above the bottom edge, and never grows wider than about half the panel.
 */
function fitCamera(width: number, height: number): { distance: number; lookY: number } {
  const room = Math.max(160, height - COPY_PX)
  const pxPerUnit = Math.min((room * 0.92) / MODEL.height, (width * 0.5) / MODEL.width)
  const visible = height / pxPerUnit
  return { distance: visible / (2 * Math.tan((FOV * Math.PI) / 360)), lookY: visible / 2 - MODEL.below - (room * 0.04) / pxPerUnit }
}

/** Slow start, slow stop. */
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

function Stage({ scene, changeS, pointer, onReady }: DioramaProps) {
  const world = useRef<THREE.Group>(null)
  const old = useRef<THREE.Group>(null)
  const modern = useRef<THREE.Group>(null)
  const future = useRef<THREE.Group>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const sky = useRef<THREE.HemisphereLight>(null)
  const land = useRef<THREE.MeshStandardMaterial>(null)
  const rock = useRef<THREE.MeshStandardMaterial>(null)
  /** The change in progress: from one scene to another, `progress` 0 to 1. */
  const change = useRef({ from: scene, to: scene, progress: 1 })
  const eased = useRef({ x: 0, y: 0 })
  const drawn = useRef(false)
  const look = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    if (scene !== change.current.to) change.current = { from: change.current.to, to: scene, progress: 0 }
  }, [scene])

  useEffect(() => {
    world.current?.traverse((object) => {
      if (!(object as THREE.Mesh).isMesh || object.userData.noShadow) return
      Object.assign(object, { castShadow: true, receiveShadow: true })
    })
  }, [])

  useFrame(({ camera, clock, size }, delta) => {
    const step = change.current
    step.progress = Math.min(1, step.progress + delta / changeS)
    const blend = easeInOut(step.progress)
    const from = eras[step.from]
    const to = eras[step.to]

    // The island makes one full turn per change; the old home shrinks away in the first half, the new one grows in the second.
    const { smoothstep } = THREE.MathUtils
    ;[old, modern, future].forEach((home, index) => {
      if (!home.current) return
      let presence = 0
      if (index === step.to) presence = smoothstep(step.progress, 0.45, 1)
      else if (index === step.from) presence = 1 - smoothstep(step.progress, 0, 0.55)
      home.current.visible = presence > 0.001
      home.current.scale.setScalar(Math.max(presence, 0.001))
    })

    eased.current.x += ((pointer.current?.x ?? 0) - eased.current.x) * Math.min(1, delta * 3)
    eased.current.y += ((pointer.current?.y ?? 0) - eased.current.y) * Math.min(1, delta * 3)
    if (world.current) world.current.rotation.y = BASE_TURN + blend * TAU + Math.sin(clock.elapsedTime * 0.3) * 0.22 + eased.current.x * 0.45

    sun.current?.color.lerpColors(from.sun, to.sun, blend)
    sun.current?.position.lerpVectors(from.sunPosition, to.sunPosition, blend)
    if (sun.current) sun.current.intensity = THREE.MathUtils.lerp(from.sunStrength, to.sunStrength, blend)
    sky.current?.color.lerpColors(from.sky, to.sky, blend)
    sky.current?.groundColor.lerpColors(from.bounce, to.bounce, blend)
    if (sky.current) sky.current.intensity = THREE.MathUtils.lerp(from.skyStrength, to.skyStrength, blend)
    land.current?.color.lerpColors(from.land, to.land, blend)
    rock.current?.color.lerpColors(from.rock, to.rock, blend)

    const { distance, lookY } = fitCamera(size.width, size.height)
    camera.position.set(eased.current.x * 1.2, lookY + distance * 0.17 - eased.current.y * 0.9, distance)
    camera.lookAt(look.set(0, lookY, 0))

    if (!drawn.current) {
      drawn.current = true
      onReady()
    }
  })

  return (
    <>
      <hemisphereLight ref={sky} />
      <directionalLight castShadow ref={sun} shadow-bias={-0.0004} shadow-mapSize={[1024, 1024]}>
        <orthographicCamera args={[-7, 7, 7, -7, 0.5, 40]} attach="shadow-camera" />
      </directionalLight>

      <group ref={world}>
        {/* A floating plot of land. */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[4, 3.7, 0.4, 14]} />
          <meshStandardMaterial flatShading ref={land} roughness={0.9} />
        </mesh>
        <mesh position={[0, -1.2, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[3.7, 1.6, 9]} />
          <meshStandardMaterial flatShading ref={rock} roughness={1} />
        </mesh>

        <group ref={old}><OldHouse3D /></group>
        <group ref={modern}><ModernHouse3D /></group>
        <group ref={future}><FutureHome3D /></group>
      </group>
    </>
  )
}

/** The story in 3D: a floating plot of land whose home is rebuilt as the scene changes. Stops drawing off screen. */
export default function Diorama(props: DioramaProps) {
  const frame = useRef<HTMLDivElement>(null)
  const [onScreen, setOnScreen] = useState(true)

  useEffect(() => {
    if (!frame.current) return undefined
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    observer.observe(frame.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div aria-hidden ref={frame} style={{ inset: 0, position: 'absolute' }}>
      <Canvas
        camera={{ far: 120, fov: FOV, near: 0.5, position: CAMERA }}
        dpr={[1, 1.75]}
        frameloop={onScreen ? 'always' : 'never'}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        shadows
      >
        <Stage {...props} />
      </Canvas>
    </div>
  )
}
