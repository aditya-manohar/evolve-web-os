import { Server as WebSocketServer } from "ws"
import { spawn } from "node-pty"
import http from "http"

export function startWSServer(server: http.Server) {

  const wss = new WebSocketServer({ server })

  wss.on("connection", (ws) => {

    const shell = spawn("bash", ["--noprofile", "--norc"], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: "./storage/workspace",
      env: {
        ...process.env,
        PS1: "evolve:/workspace$ "
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