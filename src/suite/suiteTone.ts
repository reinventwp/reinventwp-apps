// Copied from reinventwp-next src/content/pages/suite/suiteTone.ts (the /suite page); keep the two in step.
import type { SxProps, Theme } from '@mui/material'

/** The Suite's warm, quiet tone: cream and peach surfaces, gold lines, deep brown text. Used on /suite and the Suite banner. */
const color = {
    gold: '#B8862E',
    goldDeep: '#8C6418',
    goldBright: '#D29A2F',
    goldText: '#9A6A1E',
    brown: '#3D2A14',
    brownSoft: '#6B4A1F',
    cream: '#FFF8EC',
    peach: '#FDEFDC',
    line: 'rgba(184, 134, 46, 0.22)',
    lineStrong: 'rgba(184, 134, 46, 0.55)',
}

const gradient = {
    /** Left-to-right glow for bands and banners. */
    band: 'linear-gradient(90deg, #FFF8EC 0%, #FDEFDC 50%, #FCE3C4 100%)',
    /** Soft diagonal for panels. */
    panel: 'linear-gradient(160deg, #FFF8EC 0%, #FDEFDC 100%)',
    /** The glows and cream wash at the top of the /suite page; see `pageBackdrop`. */
    pageTop: 'radial-gradient(circle at 8% 0%, rgba(252, 211, 158, 0.38), transparent 38%), radial-gradient(circle at 92% 6%, rgba(246, 192, 132, 0.26), transparent 40%), linear-gradient(180deg, #FFFBF4 0%, #FDF5EA 60%, #FBF0E2 100%)',
    /** The Suite pass: deep warm brown. */
    pass: 'linear-gradient(135deg, #3D2A14 0%, #5A3D1B 100%)',
}

const button: Record<'contained' | 'outlined', SxProps<Theme>> = {
    contained: {
        bgcolor: color.goldDeep,
        boxShadow: 'none',
        color: '#FFFFFF',
        '&:hover': { bgcolor: '#6F4E12', boxShadow: 'none' },
    },
    outlined: {
        bgcolor: 'rgba(255, 255, 255, 0.6)',
        borderColor: color.lineStrong,
        color: color.brownSoft,
        '&:hover': { bgcolor: '#FFFFFF', borderColor: color.gold },
    },
}

/** Heights of the fixed parts of the page backdrop, in pixels. */
const PAGE_TOP_PX = 1400
const PAGE_FADE_PX = 260
const PAGE_END = '#FBF0E2'

/**
 * The warm backdrop behind the whole /suite page, in place of the site's cool wash: glows at the top, a flat cream
 * below, and a fade into the site background at the bottom.
 *
 * The gradients sit in layers of a fixed height. One gradient stretched over the page had to be redrawn across the
 * whole page whenever its height changed (opening a question), which stuttered on phones.
 */
const pageBackdrop: SxProps<Theme> = {
    isolation: 'isolate',
    position: 'relative',
    '&::before, &::after': { content: '""', left: 0, pointerEvents: 'none', position: 'absolute', right: 0, zIndex: -1 },
    '&::before': {
        backgroundColor: PAGE_END,
        backgroundImage: gradient.pageTop,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `100% ${PAGE_TOP_PX}px`,
        bottom: PAGE_FADE_PX,
        top: 0,
    },
    '&::after': { background: `linear-gradient(180deg, ${PAGE_END} 0%, rgba(251, 240, 226, 0) 100%)`, bottom: 0, height: PAGE_FADE_PX },
}

const suiteTone = {
    button,
    pageBackdrop,
    color,
    gradient,
}

export default suiteTone
