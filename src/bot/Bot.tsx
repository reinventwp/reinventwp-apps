import { ThemeProvider } from "@mui/material/styles";
import strings, { ASK_TYPING } from "../strings";
import theme from "../theme";
import AskBar from "./AskBar";
import ChatLauncher from "./ChatLauncher";
import AssistantPanel, { PANEL_WIDTH } from "./AssistantPanel";
import type { BotAgentConfig, BotConfig } from "./types";
import useApps from "./useApps";
import useAssistant from "./useAssistant";
import useAvailability from "./useAvailability";
import useStoredFlag, { OPEN_KEY } from "./storedFlag";
import usePlacement, { usePanelMode } from "./placement";
import usePageAllows from "./usePageAllows";
import { useAnchor, useShift } from "./useShift";

/**
 * The Reinvent WP assistant on any page: the "Describe a problem…" field at the bottom centre,
 * and the side panel it opens. Shown only when Reinvent WP Services says it's on.
 */
export default function Bot({ config, agent }: { config: BotConfig; agent?: BotAgentConfig }) {
  const apps = useApps(config);
  const serviceOn = useAvailability(`${config.url}/status`);
  const pageAllows = usePageAllows();
  const available = serviceOn && pageAllows;
  // Both remembered across reloads and pages: whether the panel is open, and where the closed assistant sits.
  const [asking, setAsking] = useStoredFlag(OPEN_KEY);
  const [placement, setPlacement] = usePlacement();
  const [panelMode, setPanelMode] = usePanelMode();
  const open = available && asking;
  const assistant = useAssistant(config, strings.ask_error, apps, agent);
  const anchor = useAnchor(config.shift);
  useShift(config.shift, open && panelMode === "beside", PANEL_WIDTH + 20);

  return (
    <ThemeProvider theme={theme}>
      {available && !asking && placement === "bar" && (
        <AskBar
          placeholder={strings.ask}
          phrases={ASK_TYPING}
          anchor={anchor}
          onOpen={() => setAsking(true)}
          onMinimize={() => setPlacement("right")}
          minimizeLabel={strings.ask_minimize}
        />
      )}
      {available && !asking && placement !== "bar" && (
        <ChatLauncher
          side={placement}
          label={strings.ask_launcher}
          restoreLabel={strings.ask_restore}
          onOpen={() => setAsking(true)}
          onRestore={() => setPlacement("bar")}
        />
      )}
      {open && (
        <AssistantPanel
          apps={apps}
          config={config}
          surface={config.surface}
          messages={assistant.messages}
          loading={assistant.loading}
          running={assistant.running}
          onApprove={assistant.answerApproval}
          onSend={assistant.send}
          onReset={assistant.reset}
          onClose={() => setAsking(false)}
          placement={placement}
          onPlacementChange={setPlacement}
          panelMode={panelMode}
          onPanelModeChange={setPanelMode}
          onFeedbackSent={assistant.markFeedbackSent}
        />
      )}
    </ThemeProvider>
  );
}
