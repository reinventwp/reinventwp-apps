/**
 * Links in the chat: MUI's info blue, underlined. wp-admin's "a:hover, a:focus { color }" outranks
 * MUI's classes, so every state is stated.
 */
export const LINK_SX = {
  color: "info.main",
  textDecorationColor: "currentColor",
  textUnderlineOffset: "0.18em",
  "&:visited": { color: "info.main" },
  "&:hover, &:focus, &:active": { color: "info.dark" },
} as const;
