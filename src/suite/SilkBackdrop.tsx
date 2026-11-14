// Copied from reinventwp-next src/content/pages/suite/SilkBackdrop.tsx (the /suite page's silk waves); keep the two in step.
import { Box } from '@mui/material'
import { motion, type MotionValue, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { type ReactNode, useEffect } from 'react'

/**
 * Layered silk sheets behind the top of the /suite page, after the macOS "Golden Gate" wallpaper: S-curves sweep from the
 * bottom left to the top right, each sheet lit along its edge, with a thin light rim and a soft shadow on the sheet
 * behind it. Warm gold on the left, where the copy sits, cooling to mauve and slate on the right.
 *
 * The sheets follow the pointer: each drifts towards it, the front sheets more than the back, so the waves slide
 * against each other like real layers. With reduced motion, or without a mouse, they stay still.
 *
 * Each sheet is its own layer. The browser draws a sheet and its soft shadow once, and the graphics card slides
 * that picture around. As groups inside one SVG, every pointer move redrew every shadow across the whole backdrop,
 * which dropped the page to about 26 frames a second.
 */

const W = 1600
const H = 1000

/** One sheet: its leading edge (an open path from the bottom left to the top right) and its light-to-shade fill. */
interface Sheet {
    edge: string
    /** The fill runs from the lit edge (`from`) into the sheet (`to`). */
    from: [number, number]
    to: [number, number]
    stops: [string, string, string]
}

const sheets: Sheet[] = [
    {
        edge: 'M -60 900 C 200 720 520 540 660 340 C 760 190 720 60 610 -30',
        from: [600, 330],
        to: [980, 760],
        stops: ['#FBF4EA', '#D4B184', '#8E6A4C'],
    },
    {
        edge: 'M -60 1040 C 320 780 760 660 1120 480 C 1400 340 1470 150 1360 -30',
        from: [1100, 470],
        to: [1360, 900],
        stops: ['#FAF5EF', '#D3C3BA', '#8A7A8B'],
    },
    {
        edge: 'M 470 1040 C 520 800 900 610 1250 480 C 1480 390 1600 230 1660 70',
        from: [1180, 520],
        to: [1440, 960],
        stops: ['#F3F0F2', '#9B97B3', '#55557A'],
    },
    {
        edge: 'M 1060 1040 C 1080 830 1290 630 1470 480 C 1580 390 1630 260 1680 120',
        from: [1440, 500],
        to: [1660, 900],
        stops: ['#F4F3F1', '#C2C8CE', '#8395A3'],
    },
]

/** How far the front sheet travels, in pixels, when the pointer is at the edge of the window. */
const DRIFT = 30
/** Each sheet's share of the drift, back to front. */
const DEPTH = [0.35, 0.6, 0.85, 1]
const SPRING = { damping: 22, mass: 0.9, stiffness: 55 }

/** The sheet's area: its edge, then round the right side and the bottom, with room to drift. */
const area = (edge: string) => `${edge} L ${W + 200} -200 L ${W + 200} ${H + 200} L -200 ${H + 200} Z`

/**
 * The pointer's position in the window, from -1 to 1 on each axis, eased by a spring; 0 when it leaves the page.
 * Stays at 0 with reduced motion or on touch screens. The silk sits behind the page, so it follows the pointer
 * wherever it is, not only over the silk itself.
 */
function usePointer() {
    const reduce = useReducedMotion()
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    useEffect(() => {
        if (reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined
        const move = (event: PointerEvent) => {
            x.set((event.clientX / window.innerWidth) * 2 - 1)
            y.set((event.clientY / window.innerHeight) * 2 - 1)
        }
        const leave = () => {
            x.set(0)
            y.set(0)
        }
        window.addEventListener('pointermove', move)
        document.documentElement.addEventListener('pointerleave', leave)
        return () => {
            window.removeEventListener('pointermove', move)
            document.documentElement.removeEventListener('pointerleave', leave)
        }
    }, [reduce, x, y])

    return { x: useSpring(x, SPRING), y: useSpring(y, SPRING) }
}

/** One full-size drawing layer; every layer uses the same canvas, so they line up. */
function Layer({ children }: { children: ReactNode }) {
    return (
        <svg preserveAspectRatio="xMidYMid slice" style={{ display: 'block', height: '100%', inset: 0, overflow: 'visible', position: 'absolute', width: '100%' }} viewBox={`0 0 ${W} ${H}`}>
            {children}
        </svg>
    )
}

function SilkSheet({ depth, edge, index, pointer }: { depth: number; edge: string; index: number; pointer: { x: MotionValue<number>; y: MotionValue<number> } }) {
    const x = useTransform(pointer.x, (value) => value * DRIFT * depth)
    const y = useTransform(pointer.y, (value) => value * DRIFT * depth * 0.6)

    return (
        <motion.div style={{ inset: 0, position: 'absolute', willChange: 'transform', x, y }}>
            <Layer>
                <path d={area(edge)} fill={`url(#suite-silk-${index})`} filter="url(#suite-silk-shadow)" />
                {/* The rim: a soft sheen under a crisp light line, like the wallpaper's paper edges. */}
                <path d={edge} fill="none" filter="url(#suite-silk-sheen)" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="10" />
                <path d={edge} fill="none" stroke="#FFFDF8" strokeOpacity="0.95" strokeWidth="2.5" />
            </Layer>
        </motion.div>
    )
}

export default function SilkBackdrop() {
    const pointer = usePointer()

    return (
        <Box aria-hidden sx={{ inset: 0, pointerEvents: 'none', position: 'absolute' }}>
            {/* The back sheet, with the gradients and shadows every layer uses. */}
            <Layer>
                <defs>
                    {/* Honey gold on the left, bronze shade towards the top middle. */}
                    <linearGradient id="suite-silk-back" x1="0" x2="1" y1="1" y2="0">
                        <stop offset="0" stopColor="#E9CFA2" />
                        <stop offset="0.45" stopColor="#F3E3CA" />
                        <stop offset="1" stopColor="#A9845F" />
                    </linearGradient>
                    <radialGradient id="suite-silk-glow" cx="0.1" cy="0.55" r="0.55">
                        <stop offset="0" stopColor="#FFF6E6" stopOpacity="0.95" />
                        <stop offset="1" stopColor="#FFF6E6" stopOpacity="0" />
                    </radialGradient>
                    {sheets.map(({ from, to, stops }, index) => (
                        <linearGradient gradientUnits="userSpaceOnUse" id={`suite-silk-${index}`} key={stops.join()} x1={from[0]} x2={to[0]} y1={from[1]} y2={to[1]}>
                            <stop offset="0" stopColor={stops[0]} />
                            <stop offset="0.35" stopColor={stops[1]} />
                            <stop offset="1" stopColor={stops[2]} />
                        </linearGradient>
                    ))}
                    {/* Each sheet casts a soft shadow up and to the left, onto the sheet behind it. */}
                    <filter height="140%" id="suite-silk-shadow" width="140%" x="-20%" y="-20%">
                        <feDropShadow dx="-14" dy="-10" floodColor="#3D2A14" floodOpacity="0.34" stdDeviation="22" />
                    </filter>
                    <filter height="140%" id="suite-silk-sheen" width="140%" x="-20%" y="-20%">
                        <feGaussianBlur stdDeviation="5" />
                    </filter>
                </defs>

                <rect fill="url(#suite-silk-back)" height={H} width={W} />
                <rect fill="url(#suite-silk-glow)" height={H} width={W} />
            </Layer>

            {sheets.map(({ edge }, index) => (
                <SilkSheet depth={DEPTH[index]} edge={edge} index={index} key={edge} pointer={pointer} />
            ))}
        </Box>
    )
}
