import { Rnd } from "react-rnd"
import { useWindowManager } from "../store/windowManager"

export default function Window({
    windowId,
    title,
    children,
    onClose,
    zIndex,
    onFocus,
    onMinimize = () => { }
}: any) {

    const setActiveWindow = useWindowManager(state => state.setActiveWindow)

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
            onMouseDown={() => {
                setActiveWindow(windowId)
                onFocus?.()
            }}
            style={{
                border: "1px solid #555",
                background: "black",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
                zIndex: zIndex
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

                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        onClick={onMinimize}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "white",
                            cursor: "pointer"
                        }}
                    >
                        _
                    </button>

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
            </div>

            <div style={{ flex: 1, overflow: "hidden" }}>
                {children}
            </div>

        </Rnd>
    )
}