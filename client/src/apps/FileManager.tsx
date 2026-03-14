import Window from "../desktop/Window"
import { useEffect, useState, useRef } from "react"
import { useWindowManager } from "../store/windowManager"
import { useKeyboard } from "../hooks/useKeyboard"
import { useClipboard } from "../store/clipboardStore"

type Item = {
    name: string
    type: "file" | "folder"
}

export default function FileManager({ windowId, close, path = "", zIndex, minimize }: any) {
    const [items, setItems] = useState<Item[]>([])
    const [currentPath, setCurrentPath] = useState(path || "")
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [clipboardIndicator, setClipboardIndicator] = useState<{ show: boolean, message: string }>({ show: false, message: "" })
    const [contextMenu, setContextMenu] = useState<{
        x: number
        y: number
        item?: Item
    } | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)
    const activeWindow = useWindowManager(s => s.activeWindow)

    const isActive = activeWindow === windowId

    const isFolder = (name: string) => {
        const item = items.find(i => i.name === name)
        return item?.type === "folder"
    }

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
        if (currentPath === 'Desktop' || currentPath === '') {
            window.dispatchEvent(new CustomEvent('desktop-needs-refresh'))
        }
        setContextMenu(null)
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
        if (currentPath === 'Desktop' || currentPath === '') {
            window.dispatchEvent(new CustomEvent('desktop-needs-refresh'))
        }
        setContextMenu(null)
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
        if (currentPath === 'Desktop' || currentPath === '') {
            window.dispatchEvent(new CustomEvent('desktop-needs-refresh'))
        }
        setContextMenu(null)
    }

    const deleteItems = async (names: string[]) => {
        const hasDesktop = names.some(name => name === 'Desktop')
        const isInDesktopPath = currentPath === '' || currentPath === 'Desktop'

        if (hasDesktop && isInDesktopPath) {
            alert('⛔ Cannot delete this folder')
            return
        }
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

    const copyFiles = (fileNames: string[], cut: boolean = false) => {
        const clipboardItems = fileNames.map(name => {
            const item = items.find(i => i.name === name)
            return {
                name,
                path: currentPath,
                type: item?.type || "file",
                sourcePath: currentPath ? `${currentPath}/${name}` : name
            }
        })

        useClipboard.getState().setClipboard(clipboardItems, cut ? "cut" : "copy")

        setClipboardIndicator({
            show: true,
            message: `${clipboardItems.length} item(s) ${cut ? 'cut' : 'copied'} to clipboard`
        })
        setTimeout(() => setClipboardIndicator({ show: false, message: "" }), 2000)
        if (currentPath === 'Desktop' || currentPath === '') {
            window.dispatchEvent(new CustomEvent('desktop-needs-refresh'))
        }
        setContextMenu(null)
    }

    const pasteFiles = async () => {
        const { items: clipboardItems, action, clearClipboard } = useClipboard.getState()
        if (clipboardItems.length === 0) return

        for (const item of clipboardItems) {
            const destPath = currentPath ? `${currentPath}/${item.name}` : item.name

            if (action === "copy") {
                await fetch("http://localhost:4000/api/files/copy", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        source: item.sourcePath,
                        destination: destPath
                    })
                })
            } else if (action === "cut") {
                await fetch("http://localhost:4000/api/files/move", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        source: item.sourcePath,
                        destination: destPath
                    })
                })
            }
        }

        if (action === "cut") {
            clearClipboard()
            setClipboardIndicator({
                show: true,
                message: `${clipboardItems.length} item(s) moved`
            })
        } else {
            setClipboardIndicator({
                show: true,
                message: `${clipboardItems.length} item(s) pasted`
            })
        }
        setTimeout(() => setClipboardIndicator({ show: false, message: "" }), 2000)

        loadFiles()
        if (currentPath === 'Desktop' || currentPath === '') {
            window.dispatchEvent(new CustomEvent('desktop-needs-refresh'))
        }
        setContextMenu(null)
    }

    useEffect(() => {
        loadFiles(currentPath)
    }, [currentPath])

    useKeyboard({
        id: `filemanager-${windowId}`,
        priority: isActive ? 50 : 0,
        windowId: windowId,
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
                key: 'c',
                ctrl: true,
                handler: (e) => {
                    e.preventDefault()
                    if (selectedItems.length > 0) {
                        copyFiles(selectedItems, false)
                    }
                }
            },
            {
                key: 'x',
                ctrl: true,
                handler: (e) => {
                    e.preventDefault()
                    if (selectedItems.length > 0) {
                        copyFiles(selectedItems, true)
                    }
                }
            },
            {
                key: 'v',
                ctrl: true,
                handler: (e) => {
                    e.preventDefault()
                    pasteFiles()
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

    const folders = items.filter(item => item.type === "folder")
    const files = items.filter(item => item.type === "file")

    const handleContextMenu = (e: React.MouseEvent, item?: Item) => {
        e.preventDefault()
        e.stopPropagation()

        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return

        let x = e.clientX - rect.left
        let y = e.clientY - rect.top
        const windowWidth = rect.width
        const windowHeight = rect.height
        const menuWidth = 180
        const menuHeight = item ? 200 : 150

        if (x + menuWidth > windowWidth) {
            x = windowWidth - menuWidth - 10
        }
        if (y + menuHeight > windowHeight) {
            y = windowHeight - menuHeight - 10
        }

        x = Math.max(10, x)
        y = Math.max(10, y)

        setContextMenu({ x, y, item })
    }

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
                    position: "relative",
                    overflow: "hidden",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                }}
                onClick={() => {
                    setSelectedItems([])
                    setContextMenu(null)
                }}
                onContextMenu={(e) => handleContextMenu(e)}
            >
                <div
                    style={{
                        padding: "8px 16px",
                        borderBottom: "1px solid #333",
                        display: "flex",
                        gap: "4px",
                        alignItems: "center",
                        background: "#252525",
                        flexShrink: 0
                    }}
                >
                    <button
                        onClick={goBack}
                        disabled={!currentPath}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: !currentPath ? "#666" : "#fff",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            cursor: !currentPath ? "default" : "pointer",
                            fontSize: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            opacity: !currentPath ? 0.5 : 1,
                            transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            if (currentPath) {
                                e.currentTarget.style.background = "#3a3a3a"
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent"
                        }}
                    >
                        <span style={{ fontSize: "24px" }}>←</span>
                    </button>

                    <div
                        style={{
                            flex: 1,
                            background: "#1a1a1a",
                            border: "1px solid #3a3a3a",
                            borderRadius: "4px",
                            padding: "6px 12px",
                            margin: "0 8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#ccc",
                            fontSize: "13px"
                        }}
                    >
                        <span style={{ color: "#569cd6", fontSize: "16px" }}>📁</span>
                        <span style={{ fontFamily: "monospace" }}>
                            {currentPath ? currentPath.split("/").map((part, i, arr) => (
                                <span key={i}>
                                    {i > 0 && <span style={{ color: "#666", margin: "0 4px" }}>/</span>}
                                    <span style={{ color: "#fff" }}>{part}</span>
                                </span>
                            )) : <span style={{ color: "#888" }}>Home</span>}
                        </span>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "16px",
                            padding: "0 8px",
                            fontSize: "12px",
                            color: "#888"
                        }}
                    >
                        {items.length > 0 && (
                            <>
                                <span title="Folders">
                                    📁 {folders.length} {folders.length === 1 ? 'folder' : 'folders'}
                                </span>
                                <span title="Files">
                                    📄 {files.length} {files.length === 1 ? 'file' : 'files'}
                                </span>
                                {selectedItems.length > 0 && (
                                    <span style={{ color: "#569cd6" }}>
                                        ({selectedItems.length} selected)
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div
                    style={{
                        flex: 1,
                        padding: "16px",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, 80px)",
                        gap: "12px",
                        alignContent: "start",
                        overflowY: "auto",
                        background: "#1e1e1e",
                        minHeight: 0
                    }}
                >
                    {items.length === 0 ? (
                        <div style={{
                            gridColumn: "1 / -1",
                            textAlign: "center",
                            padding: "40px",
                            color: "#888"
                        }}>
                            <div>No files or folders</div>
                            <div style={{ fontSize: "12px", marginTop: "8px" }}>
                                Right-click to create new items
                            </div>
                        </div>
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
                                    handleContextMenu(e, item)
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
                {items.length > 0 && (
                    <div
                        style={{
                            padding: "6px 16px",
                            borderTop: "1px solid #333",
                            background: "#252525",
                            fontSize: "12px",
                            color: "#888",
                            display: "flex",
                            justifyContent: "space-between",
                            flexShrink: 0
                        }}
                    >
                        <span>
                            {items.length} {items.length === 1 ? 'item' : 'items'}
                            {selectedItems.length > 0 && (
                                <span style={{ color: "#569cd6", marginLeft: "8px" }}>
                                    ({selectedItems.length} selected)
                                </span>
                            )}
                        </span>
                        <span>
                            {new Date().toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                )}
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
                            zIndex: 10000,
                            borderRadius: "4px",
                            minWidth: "180px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                        }}
                    >
                        {!contextMenu.item && (
                            <>
                                <MenuItem onClick={() => addFolder()}>
                                    New Folder
                                </MenuItem>
                                <MenuItem onClick={() => addFile()}>
                                    New File
                                </MenuItem>
                                <Divider />

                                {useClipboard.getState().hasItems() && (
                                    <MenuItem onClick={() => {
                                        pasteFiles()
                                        setContextMenu(null)
                                    }}>
                                        Paste
                                    </MenuItem>
                                )}

                                <Divider />
                                <MenuItem onClick={() => {
                                    loadFiles(currentPath)
                                    setContextMenu(null)
                                }}>
                                    Refresh
                                </MenuItem>
                            </>
                        )}
                        {contextMenu.item && (
                            <>
                                {selectedItems.length === 1 && (
                                    <MenuItem onClick={() => {
                                        renameItem(contextMenu.item!)
                                        setContextMenu(null)
                                    }}>
                                        Rename
                                    </MenuItem>
                                )}

                                <MenuItem onClick={() => {
                                    const itemsToCopy = selectedItems.length > 0 ? selectedItems : [contextMenu.item!.name]
                                    copyFiles(itemsToCopy, false)
                                    setContextMenu(null)
                                }}>
                                    Copy
                                </MenuItem>

                                <MenuItem onClick={() => {
                                    const itemsToCut = selectedItems.length > 0 ? selectedItems : [contextMenu.item!.name]
                                    copyFiles(itemsToCut, true)
                                    setContextMenu(null)
                                }}>
                                    Cut
                                </MenuItem>

                                {useClipboard.getState().hasItems() && (
                                    <>
                                        <Divider />
                                        <MenuItem onClick={() => {
                                            pasteFiles()
                                            setContextMenu(null)
                                        }}>
                                            Paste
                                        </MenuItem>
                                    </>
                                )}

                                <Divider />
                                <MenuItem
                                    onClick={() => {
                                        const itemsToDelete = selectedItems.length > 1
                                            ? selectedItems
                                            : [contextMenu.item!.name]
                                        deleteItems(itemsToDelete)
                                        setContextMenu(null)
                                    }}
                                    style={{ color: "#ff6666" }}
                                >
                                    Delete
                                </MenuItem>
                            </>
                        )}
                    </div>
                )}

                {clipboardIndicator.show && (
                    <div
                        style={{
                            position: "fixed",
                            top: 20,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "#333",
                            border: "1px solid #88ccff",
                            color: "#88ccff",
                            padding: "8px 16px",
                            borderRadius: "20px",
                            zIndex: 10001,
                            fontSize: "13px",
                            boxShadow: "0 0 20px rgba(136, 204, 255, 0.3)",
                            backdropFilter: "blur(5px)",
                            animation: "fadeInOut 2s ease",
                            pointerEvents: "none",
                        }}
                    >
                        {clipboardIndicator.message}
                    </div>
                )}

                <style>{`
                    @keyframes fadeInOut {
                        0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
                        85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                        100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                    }
                `}</style>
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

const Divider = () => (
    <div style={{ height: "1px", background: "#444", margin: "4px 0" }} />
)