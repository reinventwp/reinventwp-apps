// Copied from reinventwp-next src/content/HomePage/sections/hero/HeroCopy.tsx (the homepage hero); keep the two in step.
import { Box, Typography } from '@mui/material'

interface HeroCopyProps {
  title: string
  text: string
  /** Only one copy on the page is the real heading; the others are decoration. */
  real: boolean
  /** Fade between colours when they change (the 3D hero keeps one copy for every scene). */
  fade?: boolean
}

/** The headline and company line, in one scene's colours. */
export default function HeroCopy({ title, text, real, fade = false }: HeroCopyProps) {
  const transition = fade ? 'color 900ms ease' : undefined

  return (
    <Box sx={{ position: 'relative', px: { xs: 3, sm: 5, md: 7 }, pt: 5, textAlign: 'center' }}>
      <Typography
        component={real ? 'h1' : 'p'}
        id={real ? 'home-hero-title' : undefined}
        sx={{
          color: title,
          fontSize: { xs: '2.65rem', sm: '3.45rem', md: '3.85rem' },
          fontWeight: 750,
          letterSpacing: '-0.055em',
          lineHeight: 1.02,
          m: 0,
          maxWidth: 820,
          mx: 'auto',
          textWrap: 'balance',
          transition,
        }}
      >
        Enhance your boring website with the latest web technology.
      </Typography>
      <Typography component="p" sx={{ color: text, fontSize: { xs: '1.08rem', md: '1.2rem' }, lineHeight: 1.55, maxWidth: '58ch', mt: 3, mx: 'auto', textWrap: 'pretty', transition }}>
        Reinvent WP creates high-quality WordPress plugins with clean design and blazing-fast performance.
      </Typography>
    </Box>
  )
}
