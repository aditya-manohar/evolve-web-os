import TerminalWindow from "../components/TerminalWindow"

export default function TerminalApp({ close }: any) {

  return (
    <div
      style={{
        position: "absolute",
        top: "80px",
        left: "120px",
        width: "700px",
        height: "400px",
        background: "black",
        border: "1px solid #555",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          background: "#333",
          padding: "6px",
          display: "flex",
          justifyContent: "space-between"
        }}
      >
        <span>Terminal</span>
        <button onClick={close}>✖</button>
      </div>

      <div style={{ flex: 1 }}>
        <TerminalWindow />
      </div>

    </div>
  )
}