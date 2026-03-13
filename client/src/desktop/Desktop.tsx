import { useState, useEffect, useRef } from "react"
import { apps } from "../apps/apps"
import { useWindowManager } from "../store/windowManager"
import { useKeyboard } from "../hooks/useKeyboard"
import AIMode from "./AIMode"
import { useClipboard } from "../store/clipboardStore"

export default function Desktop() {
  const [openApps, setOpenApps] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [desktopItems, setDesktopItems] = useState<any[]>([])
  const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>({})
  const [dragging, setDragging] = useState<string | null>(null)
  const [aiModeActive, setAiModeActive] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    type: "desktop" | "icon"
    x: number
    y: number
    item?: any
  } | null>(null)
  const [minimizedApps, setMinimizedApps] = useState<string[]>([])
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [clipboardIndicator, setClipboardIndicator] = useState<{ show: boolean, message: string }>({ show: false, message: "" })

  const desktopRef = useRef<HTMLDivElement>(null)

  const activeWindow = useWindowManager(s => s.activeWindow)
  const setActiveWindow = useWindowManager(s => s.setActiveWindow)
  const getNextZIndex = useWindowManager(s => s.getNextZIndex)

  const isDesktopActive = activeWindow === null

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleDesktopRefresh = () => {
      console.log('Received refresh event from FileManager')
      loadDesktop()
    }

    window.addEventListener('desktop-needs-refresh', handleDesktopRefresh)

    return () => {
      window.removeEventListener('desktop-needs-refresh', handleDesktopRefresh)
    }
  }, [])

  const openApp = (id: string, props?: any) => {
    const existingApp = openApps.find(a => a.id === id)

    if (!existingApp) {
      setOpenApps([...openApps, {
        id,
        component: id,
        zIndex: getNextZIndex(),
        ...props
      }])
    } else {
      setOpenApps(prev => prev.map(app =>
        app.id === id
          ? { ...app, zIndex: getNextZIndex() }
          : app
      ))
    }

    setActiveWindow(id)
    setMinimizedApps(prev => prev.filter(appId => appId !== id))
  }

  const closeApp = (id: string) => {
    setOpenApps(prev => prev.filter(app => app.id !== id))
    if (activeWindow === id) {
      setActiveWindow(null)
    }
  }

  const minimizeApp = (id: string) => {
    setMinimizedApps(prev => [...prev, id])
    if (activeWindow === id) {
      setActiveWindow(null)
    }
  }

  const restoreApp = (id: string) => {
    setMinimizedApps(prev => prev.filter(app => app !== id))
    setActiveWindow(id)
    setOpenApps(prev => prev.map(app =>
      app.id === id
        ? { ...app, zIndex: getNextZIndex() }
        : app
    ))
  }

  function getDefaultPosition(index: number) {
    const col = Math.floor(index / 8)
    const row = index % 8
    return {
      x: 20 + col * 100,
      y: 20 + row * 100
    }
  }

  const renameItem = async (item: any) => {
    const newName = prompt("New name", item.name)
    if (!newName || newName === item.name) return

    await fetch("http://localhost:4000/api/files/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldName: item.name,
        newName,
        path: "Desktop"
      })
    })

    loadDesktop()
    setContextMenu(null)
  }

  const deleteItems = async (names: string[]) => {
    if (!confirm(`Delete ${names.length} item(s)?`)) return

    for (const name of names) {
      await fetch("http://localhost:4000/api/files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, path: "Desktop" })
      })
    }

    loadDesktop()
    setSelectedItems([])
    setContextMenu(null)
  }

  const copyItems = async (names: string[], cut: boolean = false) => {
    const items = names.map(name => {
      const desktopItem = desktopItems.find(i => i.name === name)
      const appItem = apps.find(a => a.id === name)

      return {
        name,
        path: "Desktop",
        type: desktopItem?.type || (appItem ? "app" : "file"),
        sourcePath: `Desktop/${name}`
      }
    }).filter(item => item.type !== "app")

    if (items.length === 0) return

    useClipboard.getState().setClipboard(items, cut ? "cut" : "copy")

    setClipboardIndicator({
      show: true,
      message: `${items.length} item(s) ${cut ? 'cut' : 'copied'} to clipboard`
    })
    setTimeout(() => setClipboardIndicator({ show: false, message: "" }), 2000)
    setContextMenu(null)
  }

  const pasteItems = async () => {
    const { items, action, clearClipboard } = useClipboard.getState()
    if (items.length === 0) return

    for (const item of items) {
      const destPath = `Desktop/${item.name}`

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
        message: `${items.length} item(s) moved`
      })
    } else {
      setClipboardIndicator({
        show: true,
        message: `${items.length} item(s) pasted`
      })
    }
    setTimeout(() => setClipboardIndicator({ show: false, message: "" }), 2000)

    loadDesktop()
    setContextMenu(null)
  }

  const loadDesktop = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/files/list?path=Desktop")
      const data = await res.json()
      setDesktopItems(data)
    } catch (error) {
      console.error("Failed to load desktop items:", error)
    }
  }

  useEffect(() => {
    loadDesktop()
  }, [])

  useKeyboard({
    id: 'ai-shortcut',
    priority: 1000,
    keys: [
      {
        key: 'i',
        ctrl: true,
        handler: (e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Ctrl+I pressed - toggling AI mode')
          setAiModeActive(prev => !prev)
          return true
        }
      }
    ]
  })

  useKeyboard({
    id: 'desktop',
    priority: isDesktopActive ? 100 : 0,
    keys: [
      {
        key: 'a',
        ctrl: true,
        handler: (e) => {
          e.preventDefault()
          const allItems = [
            ...apps.map(a => a.id),
            ...desktopItems.map(i => i.name)
          ]
          setSelectedItems(allItems)
        }
      },
      {
        key: 'c',
        ctrl: true,
        handler: (e) => {
          e.preventDefault()
          if (selectedItems.length > 0) {
            copyItems(selectedItems, false)
          }
        }
      },
      {
        key: 'x',
        ctrl: true,
        handler: (e) => {
          e.preventDefault()
          if (selectedItems.length > 0) {
            copyItems(selectedItems, true)
          }
        }
      },
      {
        key: 'v',
        ctrl: true,
        handler: (e) => {
          e.preventDefault()
          pasteItems()
        }
      },
      {
        key: 'Enter',
        handler: (e) => {
          e.preventDefault()

          if (selectedItems.length !== 1) return

          const id = selectedItems[0]
          const app = apps.find(a => a.id === id)

          if (app) {
            openApp(id)
            return
          }

          const item = desktopItems.find(i => i.name === id)
          if (!item) return

          if (item.type === "folder") {
            openApp(`files-${item.name}`, {
              component: "files",
              path: `Desktop/${item.name}`
            })
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
            const item = desktopItems.find(i => i.name === selectedItems[0])
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

  const refreshDesktop = () => {
    loadDesktop()
    setContextMenu(null)
  }

  const createFolder = async () => {
    const name = prompt("Folder name")
    if (!name) return

    await fetch("http://localhost:4000/api/files/mkdir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, path: "Desktop" })
    })
    loadDesktop()
    setContextMenu(null)
  }

  const createFile = async () => {
    const name = prompt("File name")
    if (!name) return

    await fetch("http://localhost:4000/api/files/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, path: "Desktop" })
    })
    loadDesktop()
    setContextMenu(null)
  }

  const selectItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.ctrlKey) {
      setSelectedItems(prev =>
        prev.includes(id)
          ? prev.filter(i => i !== id)
          : [...prev, id]
      )
    } else {
      setSelectedItems([id])
    }
  }

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div
      ref={desktopRef}
      style={{
        height: "100%",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        padding: "20px",
        color: "white",
        background: "#0a0a0a"
      }}
      onClick={(e) => {
        if (e.target === desktopRef.current) {
          setSelectedItems([])
          setContextMenu(null)
          setActiveWindow(null)
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        if (e.target === desktopRef.current) {
          setContextMenu({
            type: "desktop",
            x: e.clientX,
            y: e.clientY
          })
        }
      }}
      onMouseMove={(e) => {
        if (!dragging) return
        setPositions(prev => ({
          ...prev,
          [dragging]: {
            x: e.clientX - 40,
            y: e.clientY - 40
          }
        }))
      }}
      onMouseUp={() => setDragging(null)}
      onMouseLeave={() => setDragging(null)}
    >
      <AIMode
        isActive={aiModeActive}
        onExit={() => setAiModeActive(false)}
      />

      {apps.map((app, index) => {
        const defaultPos = getDefaultPosition(index)
        const pos = positions[app.id] || defaultPos

        return (
          <div
            key={app.id}
            onMouseDown={(e) => {
              e.stopPropagation()
              setDragging(app.id)
            }}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: "80px",
              height: "80px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              userSelect: "none",
              background: selectedItems.includes(app.id)
                ? "rgba(255,255,255,0.15)"
                : "transparent",
              borderRadius: "6px",
              transition: dragging === app.id ? "none" : "all 0.1s ease",
              zIndex: dragging === app.id ? 1000 : 1
            }}
            onClick={(e) => {
              e.stopPropagation()
              selectItem(app.id, e)
            }}
            onDoubleClick={() => openApp(app.id)}
          >
            <div style={{ fontSize: "32px", marginBottom: "4px" }}>
              {app.icon}
            </div>
            <div style={{ fontSize: "12px", textAlign: "center" }}>
              {app.name}
            </div>
          </div>
        )
      })}

      {desktopItems.map((item, index) => {
        const defaultPos = getDefaultPosition(index + apps.length)
        const pos = positions[item.name] || defaultPos

        return (
          <div
            key={item.name}
            onMouseDown={(e) => {
              e.stopPropagation()
              setDragging(item.name)
            }}
            onDoubleClick={() => {
              if (item.type === "folder") {
                openApp(`files-${item.name}`, {
                  component: "files",
                  path: `Desktop/${item.name}`
                })
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!selectedItems.includes(item.name)) {
                setSelectedItems([item.name])
              }
              setContextMenu({
                type: "icon",
                x: e.clientX,
                y: e.clientY,
                item
              })
            }}
            onClick={(e) => {
              e.stopPropagation()
              selectItem(item.name, e)
            }}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: "80px",
              height: "80px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              userSelect: "none",
              background: selectedItems.includes(item.name)
                ? "rgba(255,255,255,0.15)"
                : "transparent",
              borderRadius: "6px",
              transition: dragging === item.name ? "none" : "all 0.1s ease",
              zIndex: dragging === item.name ? 1000 : 1
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "4px" }}>
              {item.type === "folder" ? "📁" : "📄"}
            </div>
            <div style={{ fontSize: "12px", textAlign: "center" }}>
              {item.name}
            </div>
          </div>
        )
      })}

      {openApps
        .filter(app => !minimizedApps.includes(app.id))
        .map((appInstance) => {
          const app = apps.find(a => a.id === appInstance.component)
          if (!app) return null

          const Component = app.component

          return (
            <Component
              key={appInstance.id}
              windowId={appInstance.id}
              close={() => closeApp(appInstance.id)}
              minimize={() => minimizeApp(appInstance.id)}
              path={appInstance.path}
              zIndex={appInstance.zIndex || 10}
            />
          )
        })}

      {contextMenu?.type === "desktop" && (
        <div
          style={{
            position: "absolute",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "#222",
            border: "1px solid #555",
            padding: "6px 0",
            zIndex: 9999,
            borderRadius: "4px",
            minWidth: "180px"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={createFolder}>📁 New Folder</MenuItem>
          <MenuItem onClick={createFile}>📄 New File</MenuItem>
          <Divider />

          {useClipboard.getState().hasItems() && (
            <MenuItem onClick={pasteItems}>📋 Paste</MenuItem>
          )}

          <Divider />
          <MenuItem onClick={refreshDesktop}>🔄 Refresh</MenuItem>
        </div>
      )}

      {contextMenu?.type === "icon" && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "#222",
            border: "1px solid #555",
            padding: "6px 0",
            zIndex: 9999,
            borderRadius: "4px",
            minWidth: "180px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
          }}
        >
          {selectedItems.length === 1 && (
            <>
              <MenuItem onClick={() => {
                renameItem(contextMenu.item)
                setContextMenu(null)
              }}>
                Rename
              </MenuItem>
              <Divider />
            </>
          )}

          <MenuItem onClick={() => {
            const itemsToCopy = selectedItems.length > 0 ? selectedItems : [contextMenu.item.name]
            copyItems(itemsToCopy, false)
          }}>
            Copy
          </MenuItem>

          <MenuItem onClick={() => {
            const itemsToCut = selectedItems.length > 0 ? selectedItems : [contextMenu.item.name]
            copyItems(itemsToCut, true)
          }}>
            Cut
          </MenuItem>

          {useClipboard.getState().hasItems() && (
            <>
              <Divider />
              <MenuItem onClick={pasteItems}>📋 Paste</MenuItem>
            </>
          )}

          <Divider />
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
          }}
        >
          {clipboardIndicator.message}
        </div>
      )}

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "40px",
          background: "#111",
          borderTop: "1px solid #444",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 10px",
          zIndex: 10000
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {minimizedApps.map(id => {
            const app = openApps.find(a => a.id === id)
            if (!app) return null
            const meta = apps.find(a => a.id === app.component)
            return (
              <div
                key={id}
                onClick={() => restoreApp(id)}
                style={{
                  padding: "4px 12px",
                  background: "#222",
                  border: "1px solid #555",
                  cursor: "pointer",
                  borderRadius: "3px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>{meta?.icon}</span>
                <span>{meta?.name}</span>
              </div>
            )
          })}
        </div>
        <div
          style={{
            display: "flex",
            gap: "16px",
            padding: "0 12px",
            background: "#1a1a1a",
            borderRadius: "4px",
            height: "28px",
            alignItems: "center",
            border: "1px solid #333"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#ccc" }}>{formattedDate}</span>
          </div>
          <div style={{ width: "1px", height: "16px", background: "#444" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#ccc", fontFamily: "monospace" }}>
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          15% { opacity: 1; transform: translateX(-50%) translateY(0); }
          85% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
      `}</style>
    </div>
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