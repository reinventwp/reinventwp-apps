// Copied from reinventwp-next src/content/HomePage/sections/hero/three/eras.ts (the homepage hero); keep the two in step.
import * as THREE from 'three'

/** Light and land colours for one scene of the story; the diorama blends from one to the next. */
interface Era {
  sun: THREE.Color
  sunStrength: number
  sunPosition: THREE.Vector3
  sky: THREE.Color
  bounce: THREE.Color
  skyStrength: number
  land: THREE.Color
  rock: THREE.Color
}

const era = (sun: string, sunStrength: number, sunPosition: [number, number, number], sky: string, bounce: string, skyStrength: number, land: string, rock: string): Era => ({
  sun: new THREE.Color(sun),
  sunStrength,
  sunPosition: new THREE.Vector3(...sunPosition),
  sky: new THREE.Color(sky),
  bounce: new THREE.Color(bounce),
  skyStrength,
  land: new THREE.Color(land),
  rock: new THREE.Color(rock),
})

/** Old: a low orange sunset. Modern: a bright clear day. Future: cool moonlight over a dark deck. */
const eras: Era[] = [
  era('#FFC27A', 2.6, [7, 3.2, -1.5], '#F3DDB8', '#7A4A22', 0.85, '#6E4B2C', '#4A3020'),
  era('#FFFFFF', 2.8, [5, 9, 6], '#DCEEFF', '#9FD69A', 1.15, '#8ECF88', '#B08A62'),
  era('#A9BFFF', 1.3, [-5, 8, 5], '#6A55C8', '#1A1550', 1.1, '#151B4C', '#0B0F30'),
]

export default eras
