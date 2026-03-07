import { Server as WebSocketServer } from "ws"
import { spawn } from "node-pty"
import http from "http"

export function startWSServer(server: http.Server) {

  const wss = new WebSocketServer({ server })

  wss.on("connection", (ws) => {

    const shell = spawn("bash", [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env
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