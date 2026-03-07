import http from "http"
import app from "./server"
import { startWSServer } from "../websockets/ws.server"

const server = http.createServer(app)

startWSServer(server)

server.listen(4000, () => {
  console.log("Personal OS server running on port 4000")
})