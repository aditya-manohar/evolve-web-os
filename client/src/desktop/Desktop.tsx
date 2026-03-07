import { useState } from "react"
import { apps } from "../apps/apps"

export default function Desktop() {

  const [openApps, setOpenApps] = useState<string[]>([])

  const openApp = (id: string) => {
    if (!openApps.includes(id)) {
      setOpenApps([...openApps, id])
    }
  }

  const closeApp = (id: string) => {
    setOpenApps(openApps.filter(app => app !== id))
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
            userSelect: "none",
            borderRadius: "6px"
          }}
          onDoubleClick={() => openApp(app.id)}
        >
          <div style={{ fontSize: "32px", marginBottom: "6px" }}>
            {app.icon}
          </div>

          <div
            style={{
              fontSize: "13px",
              textAlign: "center",
              wordBreak: "break-word"
            }}
          >
            {app.name}
          </div>
        </div>
      ))}

      {openApps.map((id) => {
        const app = apps.find(a => a.id === id)
        const Component = app!.component

        return (
          <Component key={id} close={() => closeApp(id)} />
        )
      })}

    </div>
  )
}