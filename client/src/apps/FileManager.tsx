import Window from "../desktop/Window"
import { useState } from "react"

type Item = {
    name: string
    type: "file" | "folder"
}

export default function FileManager({ close }: any) {

    const [items, setItems] = useState<Item[]>([])

    const addFile = () => {
        const name = prompt("File name")
        if (!name) return
        setItems([...items, { name, type: "file" }])
    }

    const addFolder = () => {
        const name = prompt("Folder name")
        if (!name) return
        setItems([...items, { name, type: "folder" }])
    }

    return (
        <Window title="Files" onClose={close}>
            <div
                style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    background: "#1e1e1e"
                }}
            >

                {/* Toolbar */}
                <div
                    style={{
                        padding: "8px",
                        borderBottom: "1px solid #444",
                        display: "flex",
                        gap: "8px"
                    }}
                >
                    <button onClick={addFile}>+ File</button>
                    <button onClick={addFolder}>+ Folder</button>
                </div>

                {/* Files Area */}
                <div
                    style={{
                        flex: 1,
                        padding: "12px",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, 80px)",
                        gap: "14px",
                        alignContent: "start"
                    }}
                >
                    {items.length === 0 ? (
                        <div style={{ opacity: 0.6 }}>
                            No files or folders
                        </div>
                    ) : (
                        items.map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    textAlign: "center"
                                }}
                            >
                                <div style={{ fontSize: "32px" }}>
                                    {item.type === "folder" ? "📁" : "📄"}
                                </div>

                                <div
                                    style={{
                                        fontSize: "12px",
                                        marginTop: "4px",
                                        wordBreak: "break-word"
                                    }}
                                >
                                    {item.name}
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </Window>
    )
}