// apps/TerminalApp.tsx
import Window from "../desktop/Window"
import TerminalWindow from "../components/TerminalWindow"

export default function TerminalApp({ windowId, close, zIndex, minimize }: any) {
  return (
    <Window
      windowId={windowId}
      title="Terminal"
      onClose={close}
      zIndex={zIndex}
      onMinimize={minimize}
    >
      <TerminalWindow />
    </Window>
  )
}