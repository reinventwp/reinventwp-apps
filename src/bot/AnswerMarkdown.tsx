import { Box } from "@mui/material";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";

/**
 * Links and images from the model render as plain text: the model never writes links, the
 * sources under the answer are the only links. Raw HTML stays escaped (react-markdown's default).
 */
const components: Components = {
  a: ({ children }) => <>{children}</>,
  img: ({ alt }) => <>{alt}</>,
  // Code blocks get a copy button.
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  // A table wider than the panel scrolls sideways inside the answer.
  table: ({ children }) => (
    <Box sx={{ overflowX: "auto", my: 1, border: "1px solid rgba(7, 21, 34, 0.12)", borderRadius: 2 }}>
      <table>{children}</table>
    </Box>
  ),
};

/** An assistant answer written in Markdown: paragraphs, lists, bold, inline code, code blocks and tables. */
export default function AnswerMarkdown({ text }: { text: string }) {
  return (
    <Box
      sx={{
        typography: "body2",
        fontSize: "0.95rem",
        lineHeight: 1.6,
        color: "text.primary",
        overflowWrap: "anywhere",
        "& > :first-of-type": { mt: 0 },
        "& > :last-child": { mb: 0 },
        // wp-admin sets p { font-size: 13px }: keep paragraphs and list items at the answer's size.
        "& p, & li": { fontSize: "inherit", lineHeight: "inherit" },
        "& p": { my: 1 },
        // wp-admin resets lists (ul { list-style: none }), so set the markers back.
        "& ul, & ol": { my: 1, pl: 2.5 },
        "& ul": { listStyle: "disc" },
        "& ol": { listStyle: "decimal" },
        "& li": { my: 0.25, display: "list-item" },
        "& h1, & h2, & h3, & h4, & h5, & h6": { fontSize: "1rem", fontWeight: 600, my: 1 },
        "& code": {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: "0.85em",
          px: 0.5,
          py: 0.125,
          borderRadius: 1,
          bgcolor: "rgba(7, 21, 34, 0.06)",
        },
        "& pre": {
          my: 1,
          p: 1.5,
          borderRadius: 2,
          bgcolor: "rgba(7, 21, 34, 0.05)",
          overflowX: "auto",
          overflowWrap: "normal",
        },
        // Comparison tables (prices, plans, limits): compact, header bold, numbers right-aligned.
        "& table": { width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", lineHeight: 1.45 },
        "& th, & td": { px: 1.25, py: 0.75, textAlign: "left", borderBottom: "1px solid rgba(7, 21, 34, 0.08)", verticalAlign: "top" },
        "& th": { fontWeight: 600, bgcolor: "rgba(7, 21, 34, 0.04)", whiteSpace: "nowrap" },
        "& tbody tr:last-of-type td": { borderBottom: 0 },
        "& td:not(:first-of-type), & th:not(:first-of-type)": { textAlign: "right", whiteSpace: "nowrap" },
        "& pre code": { p: 0, bgcolor: "transparent", fontSize: "0.8rem", lineHeight: 1.5, whiteSpace: "pre" },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </Box>
  );
}
