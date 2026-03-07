import { Rnd } from "react-rnd"

export default function Window({ title, children, onClose }: any) {
    return (
        <Rnd
            default={{
                x: 120,
                y: 80,
                width: 700,
                height: 400
            }}
            bounds="window"
            dragHandleClassName="window-title"
            style={{
                border: "1px solid #555",
                background: "black",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 4px 20px rgba(0,0,0,0.6)"
            }}
        >
            <div
                className="window-title"
                style={{
                    background: "#333",
                    padding: "6px 10px",
                    cursor: "move",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: "white"
                }}
            >
                <span>{title}</span>

                <button
                    onClick={onClose}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "white",
                        cursor: "pointer"
                    }}
                >
                    ✕
                </button>
            </div>

            <div style={{ flex: 1, overflow: "hidden" }}>
                {children}
            </div>
        </Rnd>
    )
}