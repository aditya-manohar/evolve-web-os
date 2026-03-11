import { useEffect, useRef } from "react"
import { Terminal } from "xterm"
import "xterm/css/xterm.css"

export default function TerminalWindow() {
  const terminalRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!terminalRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#1e1e1e",
        foreground: "#f0f0f0",
        cursor: "#f0f0f0",
        selection: "rgba(255,255,255,0.3)",
        black: "#2e2e2e",
        red: "#eb4129",
        green: "#abe047",
        yellow: "#f5c631",
        blue: "#51a2ff",
        magenta: "#b000bc",
        cyan: "#15c5c5",
        white: "#eaeaea",
        brightBlack: "#4e4e4e",
        brightRed: "#ff6e5c",
        brightGreen: "#c3ff6e",
        brightYellow: "#ffd96e",
        brightBlue: "#7ab3ff",
        brightMagenta: "#e16bff",
        brightCyan: "#6effff",
        brightWhite: "#ffffff"
      }
    })

    termRef.current = term
    term.open(terminalRef.current)

    const forceFillHeight = () => {
      const viewport = terminalRef.current?.querySelector('.xterm-viewport');
      const screen = terminalRef.current?.querySelector('.xterm-screen');

      if (viewport) {
        (viewport as HTMLElement).style.height = '100%';
        (viewport as HTMLElement).style.maxHeight = '100%';
      }

      if (screen) {
        (screen as HTMLElement).style.height = '100%';
        (screen as HTMLElement).style.maxHeight = '100%';
      }
    };

    // Apply force fill multiple times
    forceFillHeight()
    setTimeout(forceFillHeight, 50)
    setTimeout(forceFillHeight, 100)
    setTimeout(forceFillHeight, 200)

    const observer = new MutationObserver(() => {
      const terminalElement = terminalRef.current?.querySelector('.xterm-helper-textarea')
      if (terminalElement) {
        terminalElement.removeEventListener('keydown', stopPropagation, true)
        terminalElement.removeEventListener('keyup', stopPropagation, true)
        terminalElement.removeEventListener('keypress', stopPropagation, true)

        terminalElement.addEventListener('keydown', stopPropagation, true)
        terminalElement.addEventListener('keyup', stopPropagation, true)
        terminalElement.addEventListener('keypress', stopPropagation, true)

          (terminalElement as HTMLElement).style.opacity = '0'
            (terminalElement as HTMLElement).style.position = 'absolute'

        observer.disconnect()
      }
    })

    observer.observe(terminalRef.current, {
      childList: true,
      subtree: true
    })

    const stopPropagation = (e: Event) => {
      e.stopPropagation()
    }

    const fitTerminal = () => {
      if (!terminalRef.current || !term) return
      const cols = Math.floor(terminalRef.current.clientWidth / 9)
      const rows = Math.ceil(terminalRef.current.clientHeight / 20)
      if (cols > 0 && rows > 0) {
        term.resize(cols, rows)
        // Re-apply force fill after resize
        forceFillHeight()
      }
    }

    setTimeout(fitTerminal, 100)
    window.addEventListener('resize', fitTerminal)

    const ws = new WebSocket("ws://localhost:4000")
    wsRef.current = ws

    ws.onmessage = (event) => {
      term.write(event.data)
    }

    ws.onerror = () => {
      term.write("\x1b[31mWebSocket connection error\x1b[0m\r\n")
    }

    ws.onclose = () => {
      term.write("\x1b[31mDisconnected from server\x1b[0m\r\n")
    }

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    })
    setTimeout(() => term.focus(), 200)

    return () => {
      window.removeEventListener('resize', fitTerminal)
      observer.disconnect()
      term.dispose()
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [])

  return (
    <div
      ref={terminalRef}
      style={{
        height: "100%",
        width: "100%",
        background: "#1e1e1e",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}
    />
  )
}

const style = document.createElement('style')
style.textContent = `
  .xterm-viewport {
    overflow-y: hidden !important;
  }
`
document.head.appendChild(style)