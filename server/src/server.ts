import express from "express"
import cors from "cors"
import filesRoute from "./routes/files"

const app = express()

app.use(cors())
app.use(express.json())
app.use("/api/files", filesRoute)

app.get("/health", (req, res) => {
  res.json({ status: "Personal OS running" })
})

export default app