import express from "express"
import fs from "fs"
import fsPromises from "fs/promises"
import path from "path"

const router = express.Router()

const WORKSPACE = path.join(process.cwd(), "storage/workspace")

if (!fs.existsSync(WORKSPACE)) {
    fs.mkdirSync(WORKSPACE, { recursive: true })
}

router.get("/list", (req, res) => {
    const dir = req.query.path as string || ""
    const target = path.join(WORKSPACE, dir)

    try {
        const files = fs.readdirSync(target, { withFileTypes: true })
        const result = files.map(f => ({
            name: f.name,
            type: f.isDirectory() ? "folder" : "file"
        }))
        res.json(result)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Unable to read directory" })
    }
})

router.post("/mkdir", (req, res) => {
    const { name, path: dir } = req.body
    const target = path.join(WORKSPACE, dir || "", name)
    try {
        fs.mkdirSync(target, { recursive: true })
        res.json({ success: true })
    } catch (err) {
        console.error(err)
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

router.post("/rename", (req, res) => {
    const { oldName, newName, path: dir } = req.body
    const oldPath = path.join(WORKSPACE, dir || "", oldName)
    const newPath = path.join(WORKSPACE, dir || "", newName)

    try {
        fs.renameSync(oldPath, newPath)
        res.json({ success: true })
    } catch {
        res.status(500).json({ error: "Unable to rename item" })
    }
})

router.post("/copy", async (req, res) => {
    const { source, destination } = req.body

    try {
        const sourcePath = path.join(WORKSPACE, source)
        const destPath = path.join(WORKSPACE, destination)

        if (!fs.existsSync(sourcePath)) {
            return res.status(404).json({ error: "Source not found" })
        }
        if (fs.existsSync(destPath)) {
            return res.status(409).json({ error: "Destination already exists" })
        }
        const stat = fs.statSync(sourcePath)

        if (stat.isDirectory()) {
            await copyDirectory(sourcePath, destPath)
        } else {
            fs.copyFileSync(sourcePath, destPath)
        }

        res.json({ success: true })
    } catch (error: any) {
        console.error("Copy error:", error)
        res.status(500).json({ error: error.message || "Unable to copy item" })
    }
})

router.post("/move", async (req, res) => {
    const { source, destination } = req.body

    try {
        const sourcePath = path.join(WORKSPACE, source)
        const destPath = path.join(WORKSPACE, destination)

        if (!fs.existsSync(sourcePath)) {
            return res.status(404).json({ error: "Source not found" })
        }
        if (fs.existsSync(destPath)) {
            return res.status(409).json({ error: "Destination already exists" })
        }
        const destDir = path.dirname(destPath)
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true })
        }
        fs.renameSync(sourcePath, destPath)
        res.json({ success: true })
    } catch (error: any) {
        console.error("Move error:", error)
        res.status(500).json({ error: error.message || "Unable to move item" })
    }
})

router.post("/delete", (req, res) => {
    const { name, path: dir } = req.body
    const target = path.join(WORKSPACE, dir || "", name)

    try {
        if (!fs.existsSync(target)) {
            return res.status(404).json({ error: "Item not found" })
        }

        if (fs.lstatSync(target).isDirectory()) {
            fs.rmSync(target, { recursive: true, force: true })
        } else {
            fs.unlinkSync(target)
        }
        res.json({ success: true })
    } catch (error: any) {
        console.error("Delete error:", error)
        res.status(500).json({ error: error.message || "Unable to delete item" })
    }
})

async function copyDirectory(source: string, destination: string) {
    await fsPromises.mkdir(destination, { recursive: true })
    const entries = await fsPromises.readdir(source, { withFileTypes: true })

    for (const entry of entries) {
        const srcPath = path.join(source, entry.name)
        const destPath = path.join(destination, entry.name)

        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath)
        } else {
            await fsPromises.copyFile(srcPath, destPath)
        }
    }
}

export default router