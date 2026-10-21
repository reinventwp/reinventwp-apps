import { createTheme } from "@mui/material/styles";

/**
 * Same tokens as the reinventwp.com theme (reinventwp-next/src/content/Components/theme):
 * Reinvent WP blue, neutral text, the project font and its body sizes.
 * Design rules: reinventwp-next/docs/design/design-system.md.
 */
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#004984", contrastText: "#ffffff" },
    success: { main: "#2e7d32", contrastText: "#ffffff" },
    background: { default: "#ffffff", paper: "#ffffff" },
    text: { primary: "#333333", secondary: "#4a5568" },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    body1: { fontSize: "1.05rem" },
    body2: { fontSize: "1rem" },
  },
  components: {
    // Buttons with an href are <a> tags, and wp-admin's "a:hover, a:focus { color }" outranks
    // MUI's classes, so restate the text colour for those states.
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none" },
        containedPrimary: { "&:hover, &:focus, &:active": { color: "#ffffff" } },
        outlinedPrimary: { "&:hover, &:focus, &:active": { color: "#004984" } },
      },
    },
    MuiIconButton: { styleOverrides: { root: { "&:hover, &:focus, &:active": { color: "#004984" } } } },
    // Above the assistant panel (z-index 9989) and wp-admin's own layers.
    MuiTooltip: { styleOverrides: { tooltip: { fontSize: "0.85rem" }, popper: { zIndex: 10002 } } },
    MuiDialog: { styleOverrides: { root: { zIndex: 10001 } } },
  },
});

/** The shared sharp section panel (reinventwp-next sectionSurface.ts). */
export const sectionSurface = {
  backgroundColor: "#FFFFFF",
  border: "1px solid rgba(7, 21, 34, 0.1)",
  borderRadius: 0,
  boxShadow: "none",
} as const;

/** Thin neutral border used inside the panel. */
export const NEUTRAL_BORDER = "1px solid rgba(7, 21, 34, 0.1)";

export default theme;
