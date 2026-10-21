import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import { Box, ButtonBase, Collapse, Link, Stack, Typography } from "@mui/material";
import { useId, useState } from "react";
import hubApps from "../apps";
import strings from "../strings";
import type { HubApp } from "../types";
import type { AssistantResearch } from "./useAssistant";

/** "%d search…" with the singular or plural string. */
const count = (n: number, one: string, many: string) => (n === 1 ? one : many).replace("%d", String(n));

/** How a search is named in the list: the user's question, the assistant's keywords, or an app's settings. */
function searchLabel(search: AssistantResearch["searches"][number], apps: HubApp[]): string {
  if (search.where === "settings") {
    const app = apps.find((item) => item.slug === search.plugin);
    return `${strings.ask_settings.replace("%s", app?.name ?? search.plugin ?? "")}: “${search.query}”`;
  }
  return search.by === "question" || !search.query ? strings.ask_your_question : `“${search.query}”`;
}

/**
 * What the assistant searched and read before answering, collapsed into one line like a tool call:
 * each search (the question first, then the assistant's own keywords, on reinventwp.com or in an
 * app's settings) with the sections it found first.
 */
export default function ResearchDetail({ research, apps }: { research: AssistantResearch; apps: HubApp[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const byId = new Map(research.sections.map((section) => [section.id, section]));
  const summary = `${count(research.searches.length, strings.ask_search_one, strings.ask_search_many)} · ${count(research.sections.length, strings.ask_section_one, strings.ask_section_many)}`;

  return (
    <Box>
      <ButtonBase
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        title={summary}
        sx={{ gap: 0.75, borderRadius: 1, px: 0.5, py: 0.25, ml: -0.5, color: "text.secondary", "&:hover, &:focus-visible": { color: "text.primary", bgcolor: "rgba(7, 21, 34, 0.04)" } }}
      >
        <TravelExploreRoundedIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption" sx={{ fontSize: "0.8rem" }}>
          {summary}
        </Typography>
        <ExpandMoreRoundedIcon sx={{ fontSize: 18, transition: "transform 150ms ease", transform: open ? "rotate(180deg)" : "none" }} />
      </ButtonBase>
      <Collapse in={open} id={panelId}>
        <Stack component="ol" spacing={1} sx={{ listStyle: "none", m: 0, mt: 0.75, ml: 0.75, pl: 1.5, py: 0.25, borderLeft: "2px solid rgba(7, 21, 34, 0.1)" }}>
          {research.searches.map((search, index) => (
            <Box component="li" key={index}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                {search.where === "settings" ? (
                  <TuneRoundedIcon sx={{ fontSize: 14, color: "text.secondary", flexShrink: 0 }} />
                ) : (
                  <SearchRoundedIcon sx={{ fontSize: 14, color: "text.secondary", flexShrink: 0 }} />
                )}
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                  {searchLabel(search, apps)}
                </Typography>
              </Stack>
              {search.sections.length ? (
                <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 0.25, pl: 2.5 }}>
                  {search.sections.map((id) => {
                    const section = byId.get(id);
                    if (!section) return null;
                    const label = section.heading && section.heading !== section.page ? `${section.page} › ${section.heading}` : section.page;
                    const app = section.plugin ? apps.find((item) => item.slug === section.plugin) : undefined;
                    const href = app && section.path ? hubApps.settingUrl(app, section.path) : section.url;
                    if (!href) {
                      return (
                        <Box component="li" key={id} title={label} sx={{ lineHeight: 1.4, fontSize: "0.8rem", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {label}
                        </Box>
                      );
                    }
                    return (
                      <Box component="li" key={id} sx={{ lineHeight: 1.4 }}>
                        <Link
                          href={href}
                          target={section.url ? "_blank" : undefined}
                          rel={section.url ? "noopener noreferrer" : undefined}
                          underline="hover"
                          variant="caption"
                          title={label}
                          sx={{ fontSize: "0.8rem", color: "text.secondary", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", "&:hover, &:focus": { color: "primary.main" } }}
                        >
                          {label}
                        </Link>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary" component="p" sx={{ pl: 2.5, fontSize: "0.8rem" }}>
                  {search.found ? strings.ask_nothing_new : strings.ask_nothing_found}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}
