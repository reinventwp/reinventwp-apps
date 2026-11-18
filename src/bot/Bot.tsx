import { ThemeProvider } from "@mui/material/styles";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { embedStore } from "./embed";
import type { ChatMessage } from "./useAssistant";
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
  // A host page may hand over the agent config (the AI Agent dev server has no printed one).
  const hostAgent = useSyncExternalStore(embedStore.subscribe, embedStore.agent, () => undefined);
  const assistant = useAssistant(config, strings.ask_error, apps, agent ?? hostAgent);
  const anchor = useAnchor(config.shift);
  // A host page (AI Agent's admin) can draw the chat inside its own layout; see embed.ts.
  const host = useSyncExternalStore(embedStore.subscribe, embedStore.host, () => null);
  const hosted = useSyncExternalStore(embedStore.subscribe, embedStore.hosted, () => false);
  useShift(config.shift, !hosted && open && panelMode === "beside", PANEL_WIDTH + 20);
  useEffect(() => embedStore.onNewChat(assistant.reset), [assistant.reset]);
  useEffect(() => embedStore.onLoad((saved) => assistant.loadSaved(saved as ChatMessage[])), [assistant.loadSaved]);
  useEffect(() => embedStore.onOpenChat((id) => void assistant.openChat(id)), [assistant.openChat]);
  // Tell a host page about every change, so it can save the chat (screenshots full size and file texts stay in memory).
  useEffect(() => {
    if (!hosted) return;
    embedStore.emitChange({
      messages: assistant.messages.map(({ full: _full, fileText: _fileText, ...message }) => message),
      busy: assistant.loading,
      chatId: assistant.chatId,
      savedAt: assistant.savedAt,
    });
  }, [hosted, assistant.messages, assistant.loading, assistant.chatId, assistant.savedAt]);

  if (hosted) {
    // On a host page the floating ask bar and panel stay hidden; the chat lives in the host's layout.
    return (
      <ThemeProvider theme={theme}>
        {host &&
          createPortal(
            <AssistantPanel
              embedded
              apps={apps}
              config={config}
              surface={config.surface}
              messages={assistant.messages}
              loading={assistant.loading}
              running={assistant.running}
              onApprove={assistant.answerApproval}
              onSend={assistant.send}
              onReset={assistant.reset}
              onClose={() => undefined}
              placement={placement}
              onPlacementChange={setPlacement}
              panelMode={panelMode}
              onPanelModeChange={setPanelMode}
              onFeedbackSent={assistant.markFeedbackSent}
              chats={assistant.chats}
              chatId={assistant.chatId}
              savedAt={assistant.savedAt}
              onOpenChat={(id) => void assistant.openChat(id)}
            />,
            host,
          )}
      </ThemeProvider>
    );
  }

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
          chats={assistant.chats}
          chatId={assistant.chatId}
          savedAt={assistant.savedAt}
          onOpenChat={(id) => void assistant.openChat(id)}
        />
      )}
    </ThemeProvider>
  );
}
