import Window from "../desktop/Window"
import TerminalWindow from "../components/TerminalWindow"

export default function TerminalApp({ close, zIndex, onFocus, minimize }: any) {

  return (
    <Window
      title="Terminal"
      onClose={close}
      zIndex={zIndex}
      onFocus={onFocus}
      onMinimize={minimize}
    >
      <TerminalWindow />
    </Window>
  )
}