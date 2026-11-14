import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import { Box, ButtonBase, Stack, type Theme, useMediaQuery } from "@mui/material";
import { useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import strings from "../strings";
import Hero3D from "./Hero3D";
import story from "./story";
import SvgStory from "./SvgStory";
import useHeroSnap from "./useHeroSnap";

/**
 * The reinventwp.com homepage hero (reinventwp-next src/content/HomePage/sections/HomeHero.tsx), copied as it is:
 * the headline over the story of an old house rebuilt as a modern one, then as a home from the future. Desktop tells
 * it in 3D (three.js); phones, reduced motion and the moment before 3D is ready use the flat illustrations.
 * Like the homepage, it fills the screen: there under the navbar, here under wp-admin's bar. When it can't run up
 * to the bar (`flush` false: notices sit above the page), it is shorter by the 20px gap and the panel's 1px border.
 */
const HEIGHT = "calc(100vh - var(--wp-admin--admin-bar--height, 32px))";
const HEIGHT_UNDER_NOTICES = "calc(100vh - var(--wp-admin--admin-bar--height, 32px) - 21px)";
/** On a very short window the headline and the house still need this much room. */
const MIN_HEIGHT = 520;

/** Which part of the story is on screen. */
function StoryProgress({ scene }: { scene: number }) {
  return (
    <Stack
      aria-hidden
      direction="row"
      spacing={1.5}
      sx={{ backdropFilter: "blur(8px)", bgcolor: "rgba(8, 12, 42, 0.5)", bottom: 16, color: "#FFFFFF", fontSize: 13, fontWeight: 600, left: 16, pointerEvents: "none", position: "absolute", px: 1.5, py: 0.75 }}
    >
      {story.scenes.map(({ label }, index) => (
        <Stack alignItems="center" direction="row" key={label} spacing={0.75} sx={{ opacity: index === scene ? 1 : 0.5, transition: "opacity 300ms ease" }}>
          <Box sx={{ bgcolor: index === scene ? "#5FF0FF" : "#FFFFFF", borderRadius: "50%", height: 6, width: 6 }} />
          <span>{label}</span>
        </Stack>
      ))}
    </Stack>
  );
}

/**
 * Tells that the page goes on under the hero, and goes there. It keeps clear of the bottom right corner, where the
 * minimized assistant's button sits.
 */
function ScrollDown({ onClick }: { onClick: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        backdropFilter: "blur(8px)",
        bgcolor: "rgba(8, 12, 42, 0.5)",
        bottom: 16,
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: 600,
        gap: 0.75,
        position: "absolute",
        px: 1.5,
        py: 0.75,
        right: 84,
        "&:hover, &:focus-visible": { bgcolor: "rgba(8, 12, 42, 0.75)" },
        "& svg": { animation: "rwp-scroll-down 1.6s ease-in-out infinite", fontSize: 16 },
        "@keyframes rwp-scroll-down": { "0%, 100%": { transform: "translateY(-2px)" }, "50%": { transform: "translateY(3px)" } },
        "@media (prefers-reduced-motion: reduce)": { "& svg": { animation: "none" } },
      }}
    >
      {strings.scroll_down}
      <ArrowDownwardRoundedIcon />
    </ButtonBase>
  );
}

export default function HubHero({ flush = true }: { flush?: boolean }) {
  const { scene, changes } = story.useStory();
  const root = useRef<HTMLElement>(null);
  const scrollDown = useHeroSnap(root);
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up("md"));
  const reduce = useReducedMotion();
  const use3D = isDesktop && !reduce;
  const [covered, setCovered] = useState(false);

  return (
    <Box
      component="section"
      ref={root}
      aria-labelledby="home-hero-title"
      sx={{
        bgcolor: "#F6EBD6",
        height: flush ? HEIGHT : HEIGHT_UNDER_NOTICES,
        isolation: "isolate",
        minHeight: MIN_HEIGHT,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {!(use3D && covered) && <SvgStory changes={changes} scene={scene} />}
      {use3D && <Hero3D onCovered={setCovered} scene={scene} />}
      <StoryProgress scene={scene} />
      <ScrollDown onClick={scrollDown} />
    </Box>
  );
}
