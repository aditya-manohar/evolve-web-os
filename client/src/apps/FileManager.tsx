// FileManager.tsx
import Window from "../desktop/Window"
import { useEffect, useState, useRef } from "react"
import { useWindowManager } from "../store/windowManager"
import { useKeyboard } from "../hooks/useKeyboard"

type Item = {
    name: string
    type: "file" | "folder"
}

export default function FileManager({ windowId, close, path = "", zIndex, minimize }: any) {
    const [items, setItems] = useState<Item[]>([])
    const [currentPath, setCurrentPath] = useState(path || "")
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [contextMenu, setContextMenu] = useState<{
        x: number
        y: number
        item: Item
    } | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)
    const activeWindow = useWindowManager(s => s.activeWindow)

    // File manager is active only when this window is focused
    const isActive = activeWindow === windowId

    const loadFiles = async (p = currentPath) => {
        try {
            const res = await fetch(`http://localhost:4000/api/files/list?path=${encodeURIComponent(p)}`)
            const data = await res.json()
            setItems(data)
        } catch (error) {
            console.error("Failed to load files:", error)
        }
    }

    const openFolder = (name: string) => {
        const newPath = currentPath ? `${currentPath}/${name}` : name
        setCurrentPath(newPath)
        setSelectedItems([])
    }

    const goBack = () => {
        if (!currentPath) return
        const parts = currentPath.split("/")
        parts.pop()
        const newPath = parts.join("/")
        setCurrentPath(newPath)
        setSelectedItems([])
    }

    const addFolder = async () => {
        const name = prompt("Folder name")
        if (!name) return

        await fetch("http://localhost:4000/api/files/mkdir", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, path: currentPath })
        })

        loadFiles(currentPath)
    }

    const addFile = async () => {
        const name = prompt("File name")
        if (!name) return

        await fetch("http://localhost:4000/api/files/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, path: currentPath })
        })

        loadFiles(currentPath)
    }

    const selectItem = (name: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (e.ctrlKey) {
            setSelectedItems(prev =>
                prev.includes(name)
                    ? prev.filter(i => i !== name)
                    : [...prev, name]
            )
        } else {
            setSelectedItems([name])
        }
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

    const deleteItems = async (names: string[]) => {
        if (!confirm(`Delete ${names.length} item(s)?`)) return

        await Promise.all(
            names.map(name =>
                fetch("http://localhost:4000/api/files/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, path: currentPath })
                })
            )
        )

        loadFiles(currentPath)
        setSelectedItems([])
        setContextMenu(null)
    }

    useEffect(() => {
        loadFiles(currentPath)
    }, [currentPath])

    // File manager keyboard handlers - only active when this window is focused
    useKeyboard({
        id: `filemanager-${windowId}`,
        priority: isActive ? 50 : 0,
        windowId: windowId, // Only handle keys when this window is active
        keys: [
            {
                key: 'a',
                ctrl: true,
                handler: (e) => {
                    e.preventDefault()
                    setSelectedItems(items.map(i => i.name))
                }
            },
            {
                key: 'Enter',
                handler: (e) => {
                    e.preventDefault()
                    if (selectedItems.length !== 1) return

                    const name = selectedItems[0]
                    const item = items.find(i => i.name === name)

                    if (item?.type === "folder") {
                        openFolder(name)
                    }
                }
            },
            {
                key: 'Delete',
                handler: (e) => {
                    e.preventDefault()
                    if (selectedItems.length > 0) {
                        deleteItems(selectedItems)
                    }
                }
            },
            {
                key: 'F2',
                handler: (e) => {
                    e.preventDefault()
                    if (selectedItems.length === 1) {
                        const item = items.find(i => i.name === selectedItems[0])
                        if (item) renameItem(item)
                    }
                }
            },
            {
                key: 'Escape',
                handler: (e) => {
                    e.preventDefault()
                    setSelectedItems([])
                    setContextMenu(null)
                }
            }
        ]
    })

    return (
        <Window
            windowId={windowId}
            title={`File Manager - ${currentPath || "Home"}`}
            onClose={close}
            zIndex={zIndex}
            onMinimize={minimize}
        >
            <div
                ref={containerRef}
                style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    background: "#1e1e1e",
                    color: "white",
                    position: "relative"
                }}
                onClick={() => {
                    setSelectedItems([])
                    setContextMenu(null)
                }}
            >
                {/* Toolbar */}
                <div
                    style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #444",
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        background: "#252525"
                    }}
                >
                    <button onClick={goBack} disabled={!currentPath}>← Back</button>
                    <button onClick={addFile}>+ File</button>
                    <button onClick={addFolder}>+ Folder</button>
                    <span style={{ marginLeft: "10px", opacity: 0.7 }}>
                        /{currentPath}
                    </span>
                </div>

                {/* File grid */}
                <div
                    style={{
                        flex: 1,
                        padding: "16px",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, 80px)",
                        gap: "12px",
                        alignContent: "start",
                        overflowY: "auto"
                    }}
                >
                    {items.length === 0 ? (
                        <div style={{ opacity: 0.6 }}>No files or folders</div>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.name}
                                onContextMenu={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (!selectedItems.includes(item.name)) {
                                        setSelectedItems([item.name])
                                    }
                                    const rect = containerRef.current?.getBoundingClientRect()
                                    setContextMenu({
                                        x: e.clientX - (rect?.left ?? 0),
                                        y: e.clientY - (rect?.top ?? 0) + 40,
                                        item
                                    })
                                }}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    selectItem(item.name, e)
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
                                    background: selectedItems.includes(item.name)
                                        ? "rgba(255,255,255,0.15)"
                                        : "transparent",
                                    borderRadius: "6px",
                                    padding: "8px 4px"
                                }}
                            >
                                <div style={{ fontSize: "32px", marginBottom: "4px" }}>
                                    {item.type === "folder" ? "📁" : "📄"}
                                </div>
                                <div style={{ fontSize: "11px", wordBreak: "break-word" }}>
                                    {item.name}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Context Menu */}
                {contextMenu && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: "absolute",
                            top: contextMenu.y,
                            left: contextMenu.x,
                            background: "#222",
                            border: "1px solid #555",
                            padding: "6px 0",
                            zIndex: 2000,
                            borderRadius: "4px",
                            minWidth: "150px"
                        }}
                    >
                        {selectedItems.length === 1 && (
                            <MenuItem onClick={() => {
                                renameItem(contextMenu.item)
                                setContextMenu(null)
                            }}>
                                Rename
                            </MenuItem>
                        )}
                        <MenuItem
                            onClick={() => {
                                const itemsToDelete = selectedItems.length > 1
                                    ? selectedItems
                                    : [contextMenu.item.name]
                                deleteItems(itemsToDelete)
                                setContextMenu(null)
                            }}
                            style={{ color: "#ff6666" }}
                        >
                            Delete
                        </MenuItem>
                    </div>
                )}
            </div>
        </Window>
    )
}

const MenuItem = ({ children, onClick, style }: any) => (
    <div
        onClick={onClick}
        style={{
            padding: "6px 16px",
            cursor: "pointer",
            fontSize: "13px",
            transition: "background 0.1s ease",
            ...style
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = "#333"
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
        }}
    >
        {children}
    </div>
)