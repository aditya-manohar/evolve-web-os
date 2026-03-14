import TerminalApp from "./TerminalApp"
import FileManager from "./FileManager"
import Notes from "./Notes"

export const apps = [
  {
    id: "terminal",
    name: "Terminal",
    icon: "🖥",
    component: TerminalApp
  },
  {
    id: "files",
    name: "File Manager",
    icon: "📁",
    component: FileManager
  },
  {
    id: "notes",
    name: "Notes",
    icon: "📝",
    component: Notes
  }
]