import TerminalApp from "./TerminalApp"
import FileManager from "./FileManager"

export const apps = [
  {
    id: "terminal",
    name: "Terminal",
    icon: "🖥",
    component: TerminalApp
  },
  {
    id: "files",
    name: "Files",
    icon: "📁",
    component: FileManager
  }
]