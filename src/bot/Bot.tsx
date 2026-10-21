import { ThemeProvider } from "@mui/material/styles";
import { useState } from "react";
import strings, { ASK_TYPING } from "../strings";
import theme from "../theme";
import AskBar from "./AskBar";
import AssistantPanel, { PANEL_WIDTH } from "./AssistantPanel";
import type { BotConfig } from "./types";
import useApps from "./useApps";
import useAssistant from "./useAssistant";
import useAvailability from "./useAvailability";
import usePageAllows from "./usePageAllows";
import { useAnchor, useShift } from "./useShift";

/**
 * The Reinvent WP assistant on any page: the "Describe a problem…" field at the bottom centre,
 * and the side panel it opens. Shown only when Reinvent WP Services says it's on.
 */
export default function Bot({ config }: { config: BotConfig }) {
  const apps = useApps(config);
  const serviceOn = useAvailability(`${config.url}/status`);
  const pageAllows = usePageAllows();
  const available = serviceOn && pageAllows;
  const [asking, setAsking] = useState(false);
  const open = available && asking;
  const assistant = useAssistant(config, strings.ask_error, apps);
  const anchor = useAnchor(config.shift);
  useShift(config.shift, open, PANEL_WIDTH + 20);

  return (
    <ThemeProvider theme={theme}>
      {available && !asking && <AskBar placeholder={strings.ask} phrases={ASK_TYPING} anchor={anchor} onOpen={() => setAsking(true)} />}
      {open && (
        <AssistantPanel
          apps={apps}
          config={config}
          surface={config.surface}
          messages={assistant.messages}
          loading={assistant.loading}
          onSend={assistant.send}
          onReset={assistant.reset}
          onClose={() => setAsking(false)}
          onFeedbackSent={assistant.markFeedbackSent}
        />
      )}
    </ThemeProvider>
  );
}
