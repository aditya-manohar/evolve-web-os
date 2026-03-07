import Window from "../desktop/Window"

export default function FileManager({ close }: any) {
    return (
        <Window title="Files" onClose={close}>
            <div>File Manager</div>
        </Window>
    )
}