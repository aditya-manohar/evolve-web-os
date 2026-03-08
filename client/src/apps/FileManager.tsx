import Window from "../desktop/Window"
import { useEffect, useState } from "react"

type Item = {
    name: string
    type: "file" | "folder"
}

export default function FileManager({ close, path = "" }: any) {
    const [items, setItems] = useState<Item[]>([])
    const [currentPath, setCurrentPath] = useState(path || "")

    const loadFiles = async (p = currentPath) => {
        const res = await fetch(`http://localhost:4000/api/files/list?path=${p}`)
        const data = await res.json()
        setItems(data)
    }

    const openFolder = (name: string) => {
        const newPath = currentPath ? `${currentPath}/${name}` : name
        setCurrentPath(newPath)
    }

    const goBack = () => {
        if (!currentPath) return
        const parts = currentPath.split("/")
        parts.pop()
        const newPath = parts.join("/")
        setCurrentPath(newPath)
    }

    const addFolder = async () => {
        const name = prompt("Folder name")
        if (!name) return

        await fetch("http://localhost:4000/api/files/mkdir", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, path: currentPath })
        })

        loadFiles(currentPath)
    }

    const addFile = async () => {
        const name = prompt("File name")
        if (!name) return

        await fetch("http://localhost:4000/api/files/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, path: currentPath })
        })

        loadFiles(currentPath)
    }

    useEffect(() => {
        loadFiles(currentPath)
    }, [currentPath])

    return (
        <Window title="File Manager" onClose={close}>
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
                        /{currentPath}
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