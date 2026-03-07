import { useEffect, useRef } from "react"
import { Terminal } from "xterm"
import "xterm/css/xterm.css"

export default function TerminalWindow() {

  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {

    const term = new Terminal({
      cursorBlink: true
    })

    term.open(terminalRef.current!)

    const ws = new WebSocket("ws://localhost:4000")

    ws.onopen = () => {
      term.write("Connected to Personal OS\r\n")
    }

    ws.onmessage = (event) => {
      term.write(event.data)
    }

    term.onData((data) => {
      ws.send(data)
    })

  }, [])

  return (
    <div
      ref={terminalRef}
      style={{
        height: "400px",
        width: "100%",
        background: "black",
        overflow: "hidden"
      }}
    />
  )
}