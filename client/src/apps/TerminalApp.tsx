import Window from "../desktop/Window"
import TerminalWindow from "../components/TerminalWindow"

export default function TerminalApp({ close }: any) {
  return (
    <Window title="Terminal" onClose={close}>
      <TerminalWindow />
    </Window>
  )
}