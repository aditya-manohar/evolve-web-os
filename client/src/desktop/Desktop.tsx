import { useState, useEffect } from "react"
import { apps } from "../apps/apps"

export default function Desktop() {

  const [openApps, setOpenApps] = useState<any[]>([])
  const [zCounter, setZCounter] = useState(10)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [desktopItems, setDesktopItems] = useState<any[]>([])
  const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>({})
  const [dragging, setDragging] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    type: "desktop" | "icon"
    x: number
    y: number
    item?: any
  } | null>(null)
  const [minimizedApps, setMinimizedApps] = useState<string[]>([])

  const openApp = (id: string) => {
    if (!openApps.find(a => a.id === id)) {
      setOpenApps([...openApps, { id, component: id }])
    }
  }

  const closeApp = (id: string) => {
    setOpenApps(openApps.filter(app => app.id !== id))
  }

  const minimizeApp = (id: string) => {
    setMinimizedApps(prev => [...prev, id])
  }

  const restoreApp = (id: string) => {
    setMinimizedApps(prev => prev.filter(app => app !== id))
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

  const deleteItem = async (item: any) => {
    if (!confirm(`Delete ${item.name}?`)) return

    await fetch("http://localhost:4000/api/files/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: item.name,
        path: "Desktop"
      })
    })

    loadDesktop()
    setContextMenu(null)
  }

  const loadDesktop = async () => {
    const res = await fetch("http://localhost:4000/api/files/list?path=Desktop")
    const data = await res.json()
    setDesktopItems(data)
  }

  useEffect(() => {
    loadDesktop()
  }, [])

  useEffect(() => {
    const closeMenu = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null)
      }
    }
    window.addEventListener("keydown", closeMenu)
    return () => window.removeEventListener("keydown", closeMenu)

  }, [])

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
      body: JSON.stringify({
        name,
        path: "Desktop"
      })
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
      body: JSON.stringify({
        name,
        path: "Desktop"
      })
    })
    loadDesktop()
    setContextMenu(null)
  }

  return (

    <div
      style={{
        height: "100%",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        padding: "20px",
        color: "white"
      }}
      onContextMenu={(e) => {
        if (e.target !== e.currentTarget) return
        e.preventDefault()
        setContextMenu({
          type: "desktop",
          x: e.clientX,
          y: e.clientY
        })
      }}
      onClick={() => {
        setContextMenu(null)
        setSelectedItem(null)
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
    >

      {apps.map((app, index) => {

        const defaultPos = getDefaultPosition(index)
        const pos = positions[app.id] || defaultPos

        return (
          <div
            key={app.id}
            onMouseDown={() => setDragging(app.id)}
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
              background: selectedItem === app.id ? "rgba(255,255,255,0.15)" : "transparent",
              borderRadius: "6px"
            }}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedItem(app.id)
            }}
            onDoubleClick={() => openApp(app.id)}
          >
            <div style={{ fontSize: "32px" }}>
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
            onMouseDown={() => setDragging(item.name)}
            onDoubleClick={() => {
              if (item.type === "folder") {
                const id = `files-${item.name}`
                setOpenApps(prev => {
                  if (prev.find(a => a.id === id)) return prev
                  return [
                    ...prev,
                    {
                      id,
                      component: "files",
                      path: `Desktop/${item.name}`
                    }
                  ]
                })
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSelectedItem(item.name)
              setContextMenu({
                type: "icon",
                x: e.clientX,
                y: e.clientY,
                item
              })
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItem(item.name)
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
              background: selectedItem === item.name ? "rgba(255,255,255,0.15)" : "transparent",
              borderRadius: "6px"
            }}
          >
            <div style={{ fontSize: "32px" }}>
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
          const Component = app!.component

          const focusWindow = () => {
            setZCounter(prev => prev + 1)

            setOpenApps(prev =>
              prev.map(w =>
                w.id === appInstance.id
                  ? { ...w, zIndex: zCounter + 1 }
                  : w
              )
            )
          }
          return (
            <Component
              key={appInstance.id}
              close={() => closeApp(appInstance.id)}
              minimize={() => minimizeApp(appInstance.id)}
              path={appInstance.path}
              zIndex={appInstance.zIndex || 10}
              onFocus={focusWindow}
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
            padding: "6px",
            zIndex: 999
          }}
        >
          <div style={{ padding: "6px 12px", cursor: "pointer" }} onClick={createFolder}>
            New Folder
          </div>

          <div style={{ padding: "6px 12px", cursor: "pointer" }} onClick={createFile}>
            New File
          </div>

          <div style={{ padding: "6px 12px", cursor: "pointer" }} onClick={refreshDesktop}>
            Refresh
          </div>
        </div>
      )}
      {contextMenu?.type === "icon" && (<div
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: contextMenu.y,
          left: contextMenu.x,
          background: "#222",
          border: "1px solid #555",
          padding: "6px",
          zIndex: 1000
        }}
      >
        <div
          style={{ padding: "6px 12px", cursor: "pointer" }}
          onClick={() => renameItem(contextMenu.item)}
        >
          Rename
        </div>
        <div
          style={{ padding: "6px 12px", cursor: "pointer", color: "#ff6666" }}
          onClick={() => deleteItem(contextMenu.item)}
        >
          Delete
        </div>
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
          gap: "10px",
          padding: "0 10px"
        }}
      >

        {minimizedApps.map(id => {
          const app = openApps.find(a => a.id === id)
          const meta = apps.find(a => a.id === app.component)
          return (
            <div
              key={id}
              onClick={() => restoreApp(id)}
              style={{
                padding: "4px 10px",
                background: "#222",
                border: "1px solid #555",
                cursor: "pointer"
              }}
            >
              {meta?.name}
            </div>
          )
        })}
      </div>
    </div>
  )
}