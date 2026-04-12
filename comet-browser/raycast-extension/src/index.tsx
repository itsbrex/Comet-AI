import { List, Icon, open, showHUD } from "@raycast/api";
import { closeMainWindow } from "@raycast/utils";

export default function IndexCommand() {
  const handleOpenComet = async () => {
    try {
      await open("comet-browser://");
      await closeMainWindow();
    } catch {
      await showHUD("Comet AI not installed");
    }
  };

  return (
    <List>
      <List.Item
        title="Open Comet AI"
        subtitle="Launch the AI-powered browser"
        icon={Icon.Globe}
        onAction={handleOpenComet}
      />
      <List.Item
        title="AI Chat"
        subtitle="Open AI chat sidebar"
        icon={Icon.Chat}
        onAction={() => {
          open("comet-browser://chat");
          closeMainWindow();
        }}
      />
      <List.Item
        title="Quick Browse"
        subtitle="Navigate to URL or search"
        icon={Icon.MagnifyingGlass}
        onAction={() => {
          open("comet-browser://browse");
          closeMainWindow();
        }}
      />
      <List.Item
        title="Screen OCR"
        subtitle="Capture and extract screen text"
        icon={Icon.Eye}
        onAction={() => {
          open("comet-browser://ocr");
          closeMainWindow();
        }}
      />
      <List.Item
        title="Create PDF"
        subtitle="Generate PDF documents"
        icon={Icon.Document}
        onAction={() => {
          open("comet-browser://pdf");
          closeMainWindow();
        }}
      />
      <List.Item
        title="Automations"
        subtitle="Run automation workflows"
        icon={Icon.Gear}
        onAction={() => {
          open("comet-browser://automation");
          closeMainWindow();
        }}
      />
      <List.Item
        title="Settings"
        subtitle="Configure Comet AI"
        icon={Icon.Sliders}
        onAction={() => {
          open("comet-browser://settings");
          closeMainWindow();
        }}
      />
    </List>
  );
}