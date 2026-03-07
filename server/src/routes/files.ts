import express from "express"
import fs from "fs"
import path from "path"

const router = express.Router()

const WORKSPACE = path.join(process.cwd(), "storage/workspace")

router.get("/list", (req, res) => {
    const dir = req.query.path || ""
    const target = path.join(WORKSPACE, dir as string)

    try {
        const files = fs.readdirSync(target, { withFileTypes: true })

        const result = files.map((f) => ({
            name: f.name,
            type: f.isDirectory() ? "folder" : "file"
        }))

        res.json(result)
    } catch (err) {
        res.status(500).json({ error: "Unable to read directory" })
    }
})

router.post("/mkdir", (req, res) => {
    const { name, path: dir } = req.body
    const target = path.join(WORKSPACE, dir || "", name)

    try {
        fs.mkdirSync(target)
        res.json({ success: true })
    } catch {
        res.status(500).json({ error: "Unable to create folder" })
    }
})

router.post("/create", (req, res) => {
    const { name, path: dir } = req.body

    const filePath = path.join(WORKSPACE, dir || "", name)

    try {
        fs.writeFileSync(filePath, "")
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: "Unable to create file" })
    }
})

export default router