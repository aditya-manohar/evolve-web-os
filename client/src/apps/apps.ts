import TerminalApp from "./TerminalApp"
import FileManager from "./FileManager"
import Notes from "./Notes"
import Calendar from "./Calendar"
import Calculator from "./Calculator"

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
  },
  {
    id: "calendar",
    name: "Calendar",
    icon: "🗓️",
    component: Calendar
  },
  {
    id: "calculator",
    name: "Calculator",
    icon: "🖩",
    component: Calculator
  }
]