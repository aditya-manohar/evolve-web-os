import { Rnd } from "react-rnd"
import { useEffect, useState } from "react"
import { useWindowManager } from "../store/windowManager"

export default function Window({
    windowId,
    title,
    children,
    onClose,
    zIndex,
    onMinimize,
    defaultSize = { width: 700, height: 400 },
}: any) {
    const setActiveWindow = useWindowManager(state => state.setActiveWindow)
    const registerWindow = useWindowManager(state => state.registerWindow)
    const unregisterWindow = useWindowManager(state => state.unregisterWindow)
    const bringToFront = useWindowManager(state => state.bringToFront)
    const [isMaximized, setIsMaximized] = useState(false)
    const [size, setSize] = useState(defaultSize)
    const [position, setPosition] = useState({ x: 120, y: 80 })
    const [previousState, setPreviousState] = useState<any>(null)

    useEffect(() => {
        registerWindow(windowId)
        return () => unregisterWindow(windowId)
    }, [windowId])

    const handleFocus = () => {
        bringToFront(windowId)
    }

    const handleMaximize = () => {
        if (isMaximized) {
            setPosition(previousState.position)
            setSize(previousState.size)
            setIsMaximized(false)
        } else {
            setPreviousState({ position, size })
            setPosition({ x: 0, y: 0 })
            setSize({
                width: window.innerWidth,
                height: window.innerHeight - 40
            })
            setIsMaximized(true)
        }
    }

    return (
        <Rnd
            size={{ width: size.width, height: size.height }}
            position={{ x: position.x, y: position.y }}
            onDragStart={handleFocus}
            onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
            onResizeStart={handleFocus}
            onResizeStop={(e, direction, ref, delta, position) => {
                setSize({
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height)
                })
                setPosition(position)
            }}
            minWidth={300}
            minHeight={200}
            bounds="window"
            dragHandleClassName="window-title"
            enableResizing={!isMaximized}
            style={{
                border: "1px solid #444",
                background: "#1e1e1e",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                zIndex: zIndex,
                borderRadius: "8px 8px 0 0",
                overflow: "hidden"
            }}
            onMouseDown={handleFocus}
        >
            <div
                className="window-title"
                style={{
                    background: "#2d2d2d",
                    padding: "8px 12px",
                    cursor: isMaximized ? "default" : "move",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: "white",
                    userSelect: "none",
                    borderBottom: "1px solid #444"
                }}
                onDoubleClick={handleMaximize}
            >
                <span style={{ fontSize: "14px", fontWeight: 500 }}>{title}</span>
                <div style={{ display: "flex", gap: "8px" }}>
                    <WindowButton onClick={onMinimize}>_</WindowButton>
                    <WindowButton onClick={handleMaximize}>
                        {isMaximized ? "❐" : "□"}
                    </WindowButton>
                    <WindowButton onClick={onClose} style={{ color: "#ff5f56" }}>
                        ✕
                    </WindowButton>
                </div>
            </div>
            <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                background: "#1e1e1e"
            }}>
                {children}
            </div>
        </Rnd>
    )
}

const WindowButton = ({ children, onClick, style }: any) => (
    <button
        onClick={onClick}
        style={{
            background: "transparent",
            border: "none",
            color: "#ccc",
            cursor: "pointer",
            fontSize: "16px",
            padding: "4px 8px",
            borderRadius: "4px",
            ...style
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = "#404040"
            e.currentTarget.style.color = "white"
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.color = "#ccc"
        }}
    >
        {children}
    </button>
)