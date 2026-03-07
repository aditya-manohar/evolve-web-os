import Window from "../desktop/Window"
import { useEffect, useState } from "react"

type Item = {
    name: string
    type: "file" | "folder"
}

export default function FileManager({ close }: any) {

    const [items, setItems] = useState<Item[]>([])
    const [path, setPath] = useState("")

    const loadFiles = async (targetPath = path) => {
        const res = await fetch(`http://localhost:4000/api/files/list?path=${targetPath}`)
        const data = await res.json()
        setItems(data)
    }

    const openFolder = (name: string) => {
        const newPath = path ? `${path}/${name}` : name
        setPath(newPath)
        loadFiles(newPath)
    }

    const goBack = () => {
        if (!path) return

        const parts = path.split("/")
        parts.pop()
        const newPath = parts.join("/")

        setPath(newPath)
        loadFiles(newPath)
    }

    const addFolder = async () => {
        const name = prompt("Folder name")
        if (!name) return

        await fetch("http://localhost:4000/api/files/mkdir", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, path })
        })

        loadFiles()
    }

    const addFile = async () => {
        const name = prompt("File name")
        if (!name) return

        await fetch("http://localhost:4000/api/files/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, path })
        })

        loadFiles()
    }

    useEffect(() => {
        loadFiles("")
    }, [])

    return (
        <Window title="Files" onClose={close}>
            <div
                style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    background: "#1e1e1e"
                }}
            >
                <div
                    style={{
                        padding: "8px",
                        borderBottom: "1px solid #444",
                        display: "flex",
                        gap: "8px",
                        alignItems: "center"
                    }}
                >
                    <button onClick={goBack}>← Back</button>
                    <button onClick={addFile}>+ File</button>
                    <button onClick={addFolder}>+ Folder</button>

                    <span style={{ marginLeft: "10px", opacity: 0.7 }}>
                        /{path}
                    </span>
                </div>
                <div
                    style={{
                        flex: 1,
                        padding: "12px",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, 80px)",
                        gap: "14px",
                        alignContent: "start"
                    }}
                >
                    {items.length === 0 ? (
                        <div style={{ opacity: 0.6 }}>
                            No files or folders
                        </div>
                    ) : (
                        items.map((item, i) => (
                            <div
                                key={i}
                                onDoubleClick={() => {
                                    if (item.type === "folder") openFolder(item.name)
                                }}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    textAlign: "center"
                                }}
                            >
                                <div style={{ fontSize: "32px" }}>
                                    {item.type === "folder" ? "📁" : "📄"}
                                </div>

                                <div
                                    style={{
                                        fontSize: "12px",
                                        marginTop: "4px",
                                        wordBreak: "break-word"
                                    }}
                                >
                                    {item.name}
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </Window>
    )
}