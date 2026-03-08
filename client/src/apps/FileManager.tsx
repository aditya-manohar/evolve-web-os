import Window from "../desktop/Window"
import { useEffect, useState, useRef } from "react"

type Item = {
    name: string
    type: "file" | "folder"
}

export default function FileManager({ close, path = "", zIndex, onFocus, minimize }: any) {
    const [items, setItems] = useState<Item[]>([])
    const [currentPath, setCurrentPath] = useState(path || "")
    const [selectedItem, setSelectedItem] = useState<string | null>(null)
    const [contextMenu, setContextMenu] = useState<{
        x: number
        y: number
        item: Item
    } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

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

    const renameItem = async (item: Item) => {

        const newName = prompt("New name", item.name)
        if (!newName || newName === item.name) return

        await fetch("http://localhost:4000/api/files/rename", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                oldName: item.name,
                newName,
                path: currentPath
            })
        })

        loadFiles(currentPath)
        setContextMenu(null)
    }

    const deleteItem = async (item: Item) => {

        if (!confirm(`Delete ${item.name}?`)) return

        await fetch("http://localhost:4000/api/files/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: item.name,
                path: currentPath
            })
        })

        loadFiles(currentPath)
        setContextMenu(null)
    }

    useEffect(() => {
        loadFiles(currentPath)
    }, [currentPath])

    return (
        <Window title="File Manager" onClose={close} zIndex={zIndex} onFocus={onFocus} onMinimize={minimize}>
            <div
                ref={containerRef}
                style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    background: "#1e1e1e"
                }}
                onClick={() => {
                    setSelectedItem(null)
                    setContextMenu(null)
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
                                onContextMenu={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setSelectedItem(item.name)
                                    const rect = containerRef.current?.getBoundingClientRect()
                                    setContextMenu({
                                        x: e.clientX - (rect?.left ?? 0) + 10,
                                        y: e.clientY - (rect?.top ?? 0) + 50,
                                        item
                                    })
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItem(item.name)
                                }}
                                onDoubleClick={() => {
                                    if (item.type === "folder") openFolder(item.name)
                                }}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    textAlign: "center",
                                    background: selectedItem === item.name ? "rgba(255,255,255,0.15)" : "transparent",
                                    borderRadius: "6px",
                                    padding: "4px"
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
                {contextMenu && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: "absolute",
                            top: contextMenu.y,
                            left: contextMenu.x,
                            background: "#222",
                            border: "1px solid #555",
                            padding: "6px",
                            zIndex: 2000
                        }}
                    >
                        <div
                            style={{ padding: "6px 12px", cursor: "pointer" }}
                            onClick={() => renameItem(contextMenu.item)}>
                            Rename
                        </div>
                        <div
                            style={{ padding: "6px 12px", cursor: "pointer", color: "#ff6666" }}
                            onClick={() => deleteItem(contextMenu.item)}>
                            Delete
                        </div>
                    </div>
                )}
            </div>
        </Window>
    )
}