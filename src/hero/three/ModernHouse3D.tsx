// Copied from reinventwp-next src/content/HomePage/sections/hero/three/ModernHouse3D.tsx (the homepage hero); keep the two in step.
import parts from './parts'

const { Block, Blob, Rod } = parts
const SLAB = '#E9EFF5'
const GLASS = '#8FCDF3'

/** Glass that catches the sky. */
function Glass({ at, size }: { at: [number, number, number]; size: [number, number, number] }) {
  return <Block at={at} color={GLASS} glow="#5FB4EE" glowStrength={0.35} size={size} smooth />
}

/** The same plot, rebuilt: a clean modern house with a timber upper floor, solar panels and an electric car. */
export default function ModernHouse3D() {
  return (
    <group>
      {/* Lower floor. */}
      <Block at={[0, 0.53, 0]} color="#F7FAFC" size={[2.8, 1.05, 1.8]} />
      <Glass at={[-0.5, 0.52, 0.91]} size={[1.4, 0.76, 0.05]} />
      <Block at={[0.85, 0.4, 0.91]} color="#B07A45" size={[0.4, 0.8, 0.05]} />
      <Block at={[0, 1.09, 0.1]} color={SLAB} size={[3, 0.08, 2.1]} />

      {/* Upper floor: a timber box that overhangs on the right. */}
      <Block at={[0.75, 1.6, -0.05]} color="#C9955F" size={[2.8, 0.95, 1.7]} />
      <Glass at={[0.75, 1.62, 0.81]} size={[1.9, 0.48, 0.05]} />
      <Block at={[0.75, 2.12, -0.05]} color={SLAB} size={[3, 0.08, 1.9]} />
      <Rod at={[2, 0.56, 0.65]} color="#9AA7B5" height={1.05} radius={0.045} />

      {/* Solar panels. */}
      <Block at={[0.2, 2.26, -0.05]} color="#1F4E8C" rotation={[-0.3, 0, 0]} size={[0.85, 0.04, 0.55]} smooth />
      <Block at={[1.25, 2.26, -0.05]} color="#1F4E8C" rotation={[-0.3, 0, 0]} size={[0.85, 0.04, 0.55]} smooth />

      {/* Tree and shrubs. */}
      <Rod at={[-2.45, 0.6, 0.6]} color="#8A5A35" height={1.2} radius={0.09} />
      <Blob at={[-2.45, 1.65, 0.6]} color="#5DB075" radius={0.78} />
      <Blob at={[-2.05, 1.25, 0.85]} color="#6CBF82" radius={0.45} />
      <Blob at={[-1.6, 0.2, 1.2]} color="#5DB075" radius={0.28} />
      <Blob at={[1.75, 0.18, 1.25]} color="#6CBF82" radius={0.24} />

      {/* Path and car. */}
      <Block at={[0.85, 0.012, 1.85]} color="#E7ECF2" size={[0.75, 0.02, 1.9]} />
      <Block at={[2.3, 0.3, 1.95]} color="#3F8FDC" size={[1.15, 0.28, 0.55]} smooth />
      <Block at={[2.25, 0.54, 1.95]} color="#CDEBFD" size={[0.62, 0.22, 0.5]} smooth />
      {[1.92, 2.68].map((x) => [1.68, 2.22].map((z) => (
        <Rod at={[x, 0.14, z]} color="#22313F" height={0.08} key={`${x}-${z}`} radius={0.14} rotation={[Math.PI / 2, 0, 0]} sides={10} />
      )))}
    </group>
  )
}
