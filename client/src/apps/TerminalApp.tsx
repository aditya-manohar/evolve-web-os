import Window from "../desktop/Window"
import TerminalWindow from "../components/TerminalWindow"

export default function TerminalApp({ close, zIndex, onFocus }: any) {

  return (
    <Window
      title="Terminal"
      onClose={close}
      zIndex={zIndex}
      onFocus={onFocus}
    >
      <TerminalWindow />
    </Window>
  )
}