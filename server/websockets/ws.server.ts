import { Server as WebSocketServer } from "ws"
import { spawn } from "node-pty"
import http from "http"

export function startWSServer(server: http.Server) {

  const wss = new WebSocketServer({ server })

  wss.on("connection", (ws) => {

    const WORKSPACE = process.cwd() + "/storage/workspace"

    const shell = spawn("bash", ["--noprofile", "--norc"], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: WORKSPACE,
      env: {
        ...process.env,
        WORKSPACE, // pass workspace path to bash
        PROMPT_COMMAND: `
__evolve_prompt() {
  local real="$PWD"
  local base="$WORKSPACE"
  local virt="/"

  # strip the real workspace prefix
  local rel="\${real#\$base}"

  # if we're exactly at workspace root
  if [ -z "$rel" ]; then
    virt="/"
  else
    virt="$rel"
  fi

  PS1="evolve:\${virt}\\$ "
}
__evolve_prompt
`
      }
    })

    shell.onData((data: string) => {
      ws.send(data)
    })

    ws.on("message", (msg) => {
      shell.write(msg.toString())
    })

    ws.on("close", () => {
      shell.kill()
    })

  })
}