import { useState, useEffect } from "react"
import { apps } from "../apps/apps"

export default function Desktop() {

  const [openApps, setOpenApps] = useState<any[]>([])
  const [menu, setMenu] = useState<{ x: number, y: number } | null>(null)
  const [desktopItems, setDesktopItems] = useState<any[]>([])

  const openApp = (id: string) => {
    if (!openApps.find(a => a.id === id)) {
      setOpenApps([...openApps, { id, component: id }])
    }
  }

  const closeApp = (id: string) => {
    setOpenApps(openApps.filter(app => app.id !== id))
  }

  const loadDesktop = async () => {
    const res = await fetch("http://localhost:4000/api/files/list?path=Desktop")
    const data = await res.json()
    setDesktopItems(data)
  }

  useEffect(() => {
    loadDesktop()
  }, [])

  const refreshDesktop = () => {
    loadDesktop()
    setMenu(null)
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
    setMenu(null)
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
    setMenu(null)
  }

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, 90px)",
        gridAutoRows: "90px",
        alignContent: "start",
        gap: "12px",
        padding: "20px",
        color: "white"
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        setMenu({ x: e.clientX, y: e.clientY })
      }}
      onClick={() => setMenu(null)}
    >
      {apps.map((app) => (
        <div
          key={app.id}
          style={{
            width: "80px",
            height: "80px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            userSelect: "none"
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
      ))}

      {desktopItems.map((item) => (

        <div
          key={item.name}
          style={{
            width: "80px",
            height: "80px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}

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
        >

          <div style={{ fontSize: "32px" }}>
            {item.type === "folder" ? "📁" : "📄"}
          </div>

          <div style={{ fontSize: "12px", textAlign: "center" }}>
            {item.name}
          </div>

        </div>

      ))}

      {openApps.map((appInstance) => {

        const app = apps.find(a => a.id === appInstance.component)
        const Component = app!.component

        return (
          <Component
            key={appInstance.id}
            close={() => closeApp(appInstance.id)}
            path={appInstance.path}
          />
        )

      })}

      {menu && (
        <div
          style={{
            position: "absolute",
            top: menu.y,
            left: menu.x,
            background: "#222",
            border: "1px solid #555",
            padding: "6px",
            zIndex: 999
          }}
        >

          <div
            style={{ padding: "6px 12px", cursor: "pointer" }}
            onClick={createFolder}
          >
            New Folder
          </div>

          <div
            style={{ padding: "6px 12px", cursor: "pointer" }}
            onClick={createFile}
          >
            New File
          </div>

          <div
            style={{ padding: "6px 12px", cursor: "pointer" }}
            onClick={refreshDesktop}
          >
            Refresh
          </div>

        </div>
      )}

    </div>
  )
}