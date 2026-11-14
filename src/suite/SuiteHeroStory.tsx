// Copied from reinventwp-next src/content/pages/suite/SuiteHeroStory.tsx (the /suite page); keep the two in step.
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded'
import { Box, Stack, type Theme, Typography, useMediaQuery } from '@mui/material'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import suitePlans from './suitePlans'
import suiteTone from './suiteTone'
import ttsIcon from './ttsIcon'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const { color, gradient } = suiteTone

/** One beat of the story, in order. Each lasts STEP_MS. */
type Beat = 'release' | 'join' | 'price'
const BEATS: Beat[] = ['release', 'join', 'price']
const STEP_MS = 1800
/** New PRO plugins shown joining before the story starts over. */
const MAX_JOINED = 2

// The website serves this icon from its own /images folder; here it is inlined (see ttsIcon.ts).
const TTS_ICON = ttsIcon

const captions: Record<Beat | 'still', string> = {
    still: 'Text to Speech PRO is included now. Every new PRO plugin joins automatically.',
    release: 'We release a new PRO plugin.',
    join: 'It joins your Suite Pass automatically.',
    price: `Your price stays ${suitePlans.startingPrice()} a month.`,
}

function ProBadge({ pop = false }: { pop?: boolean }) {
    return (
        <Box
            animate={pop ? { scale: [0.4, 1.15, 1], opacity: [0, 1, 1] } : undefined}
            component={motion.span}
            sx={{
                bgcolor: color.goldDeep,
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.06em',
                lineHeight: 1,
                position: 'absolute',
                px: 0.75,
                py: 0.4,
                right: -6,
                top: -6,
            }}
            transition={{ duration: 0.45, ease: EASE }}
        >
            PRO
        </Box>
    )
}

/** A plugin in the Suite: its icon (or a monogram for one not released yet), a name, and a PRO badge. */
function PluginTile({ icon, label, fresh = false }: { icon?: string; label: string; fresh?: boolean }) {
    return (
        <Stack alignItems="center" spacing={1} sx={{ minWidth: 0, width: '100%' }}>
            <Box sx={{ maxWidth: 68, position: 'relative', width: '100%' }}>
                {icon ? (
                    <Box
                        alt=""
                        component="img"
                        src={icon}
                        sx={{ aspectRatio: '1', border: '1px solid rgba(7, 21, 34, 0.1)', display: 'block', width: '100%' }}
                    />
                ) : (
                    <Box
                        sx={{
                            alignItems: 'center',
                            bgcolor: color.peach,
                            border: `1px solid ${color.line}`,
                            color: color.goldDeep,
                            aspectRatio: '1',
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                        }}
                    >
                        <ExtensionRoundedIcon sx={{ fontSize: 34 }} />
                    </Box>
                )}
                <ProBadge pop={fresh} />
                {fresh && (
                    <Box
                        animate={{ opacity: [0, 1, 0], scale: [0.6, 1.4, 1.8] }}
                        component={motion.span}
                        sx={{ color: '#F5A524', left: -14, position: 'absolute', top: -14 }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                    >
                        <AutoAwesomeRoundedIcon fontSize="small" />
                    </Box>
                )}
            </Box>
            <Typography sx={{ color: color.brown, fontSize: 13, fontWeight: 600, lineHeight: 1.25, textAlign: 'center' }}>{label}</Typography>
        </Stack>
    )
}

/** The empty slot for the next PRO plugin; it pulses when one is released. */
function NextSlot({ pulsing }: { pulsing: boolean }) {
    return (
        <Stack alignItems="center" spacing={1} sx={{ minWidth: 0, width: '100%' }}>
            <Box
                animate={pulsing ? { scale: [1, 1.08, 1], borderColor: [color.lineStrong, color.gold, color.lineStrong] } : { scale: 1 }}
                component={motion.div}
                sx={{
                    alignItems: 'center',
                    border: `2px dashed ${color.lineStrong}`,
                    color: color.goldDeep,
                    aspectRatio: '1',
                    boxSizing: 'border-box',
                    display: 'flex',
                    justifyContent: 'center',
                    maxWidth: 68,
                    width: '100%',
                }}
                transition={pulsing ? { duration: 0.9, repeat: 1, ease: 'easeInOut' } : undefined}
            >
                <AddRoundedIcon />
            </Box>
            <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 600, lineHeight: 1.25, textAlign: 'center' }}>Next PRO plugin</Typography>
        </Stack>
    )
}

/**
 * What the Suite is, told in a loop: one pass at one price; Text to Speech PRO is in it today; each new PRO plugin
 * we release joins automatically; the price stays the same. Still on phones and for reduced motion.
 */
export default function SuiteHeroStory() {
    const ref = useRef<HTMLDivElement>(null)
    const onScreen = useInView(ref, { amount: 0.4 })
    // Both start false, as on the server, and update right after hydration, so the first render matches the HTML.
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
    const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
    const isStatic = isMobile || reduceMotion
    const running = onScreen && !isStatic

    // One cycle: MAX_JOINED rounds of release, join, price; then it starts over with only Text to Speech.
    const [step, setStep] = useState(0)
    const beat = BEATS[step % BEATS.length]
    const round = Math.floor(step / BEATS.length)
    const joined = round + (beat === 'release' ? 0 : 1)

    useEffect(() => {
        if (!running) return undefined
        const timer = window.setInterval(() => setStep((current) => (current + 1) % (BEATS.length * MAX_JOINED)), STEP_MS)
        return () => window.clearInterval(timer)
    }, [running])

    const caption = isStatic ? captions.still : captions[beat]
    const shownJoined = isStatic ? 0 : joined
    const priceFlash = running && beat === 'price'

    return (
        <Stack ref={ref} alignItems="center" spacing={3} sx={{ width: '100%', maxWidth: 460, mx: 'auto' }}>
            {/* The pass: one subscription, one price. */}
            <Box
                animate={running && beat === 'join' ? { boxShadow: ['0 0 0 0 rgba(184,134,46,0.45)', '0 0 0 14px rgba(184,134,46,0)'] } : undefined}
                component={motion.div}
                sx={{ background: gradient.pass, color: color.cream, px: 3.5, py: 3, width: '100%' }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
            >
                <Typography sx={{ color: color.goldBright, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Reinvent WP Suite Pass
                </Typography>
                <Stack alignItems="baseline" direction="row" justifyContent="space-between" spacing={2} sx={{ mt: 0.5 }}>
                    <Stack alignItems="baseline" direction="row" spacing={0.75}>
                        <Box
                            animate={priceFlash ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                            component={motion.span}
                            sx={{ display: 'inline-block', fontSize: 44, fontWeight: 800, lineHeight: 1, transformOrigin: 'left bottom' }}
                            transition={{ duration: 0.6, ease: EASE }}
                        >
                            {suitePlans.startingPrice()}
                        </Box>
                        <Typography component="span" sx={{ fontSize: 16, opacity: 0.85 }}>
                            a month
                        </Typography>
                    </Stack>
                    <AnimatePresence>
                        {(priceFlash || isStatic) && (
                            <Stack
                                alignItems="center"
                                animate={{ opacity: 1, x: 0 }}
                                component={motion.div}
                                direction="row"
                                exit={{ opacity: 0 }}
                                initial={isStatic ? false : { opacity: 0, x: 8 }}
                                spacing={0.5}
                                sx={{ bgcolor: 'rgba(210, 154, 47, 0.22)', color: color.cream, px: 1, py: 0.5 }}
                            >
                                <CheckRoundedIcon sx={{ fontSize: 16 }} />
                                <Typography component="span" sx={{ fontSize: 12, fontWeight: 700 }}>
                                    Same price
                                </Typography>
                            </Stack>
                        )}
                    </AnimatePresence>
                </Stack>
            </Box>

            {/* Everything the pass unlocks. */}
            <Box sx={{ position: 'relative', width: '100%' }}>
                <Box aria-hidden="true" sx={{ bgcolor: color.line, height: 2, left: '12.5%', position: 'absolute', right: '12.5%', top: -14 }} />
                {/* Four fixed cells in one row: Text to Speech, then joined plugins, then the next slot. Nothing wraps or moves. */}
                <Box sx={{ display: 'grid', gap: { xs: 1, sm: 2 }, gridTemplateColumns: `repeat(${MAX_JOINED + 2}, minmax(0, 1fr))` }}>
                    <PluginTile icon={TTS_ICON} label="Text to Speech" />
                    {Array.from({ length: MAX_JOINED + 1 }, (_, slot) => {
                        const kind = slot < shownJoined ? 'joined' : slot === shownJoined ? 'next' : 'empty'
                        return (
                            <AnimatePresence initial={false} key={slot} mode="wait">
                                <Box
                                    animate={{ opacity: 1, scale: 1 }}
                                    component={motion.div}
                                    exit={{ opacity: 0, scale: 0.85 }}
                                    initial={{ opacity: 0, scale: kind === 'joined' ? 0.6 : 0.9 }}
                                    key={kind}
                                    transition={{ duration: 0.4, ease: EASE }}
                                >
                                    {kind === 'joined' && <PluginTile fresh={slot === shownJoined - 1 && beat === 'join'} label="New PRO plugin" />}
                                    {kind === 'next' && <NextSlot pulsing={running && beat === 'release'} />}
                                </Box>
                            </AnimatePresence>
                        )
                    })}
                </Box>
            </Box>

            <Box aria-live="off" sx={{ minHeight: 52, width: '100%' }}>
                <AnimatePresence mode="wait">
                    <Typography
                        animate={{ opacity: 1, y: 0 }}
                        component={motion.p}
                        exit={{ opacity: 0, y: -6 }}
                        initial={isStatic ? false : { opacity: 0, y: 6 }}
                        key={caption}
                        sx={{ color: color.brown, fontSize: 17, fontWeight: 600, lineHeight: 1.45, textAlign: 'center' }}
                        transition={{ duration: 0.3 }}
                    >
                        {caption}
                    </Typography>
                </AnimatePresence>
            </Box>
        </Stack>
    )
}
