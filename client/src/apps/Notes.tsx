// apps/Notes.tsx
import { useState, useEffect, useRef } from 'react'
import Window from '../desktop/Window'

interface Note {
    id: string
    title: string
    content: string
    lastModified: number
    createdAt: number
}

export default function Notes({ windowId, close, zIndex, minimize }: any) {
    const [notes, setNotes] = useState<Note[]>([])
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    const editorRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Load notes from localStorage - only once on mount
    useEffect(() => {
        const savedNotes = localStorage.getItem('evolve-notes')
        if (savedNotes) {
            try {
                const parsed = JSON.parse(savedNotes)
                setNotes(parsed)
                // Set first note as active if exists
                if (parsed.length > 0) {
                    setActiveNoteId(parsed[0].id)
                }
            } catch (e) {
                console.error('Failed to load notes:', e)
            }
        } else {
            // Create default notes only if none exist
            const defaultNotes: Note[] = [
                {
                    id: '1',
                    title: 'Welcome to Notes',
                    content: 'This is your first note. Start writing!',
                    lastModified: Date.now(),
                    createdAt: Date.now()
                },
                {
                    id: '2',
                    title: 'Getting Started',
                    content: 'Create new notes, edit existing ones, and they will be saved automatically.',
                    lastModified: Date.now(),
                    createdAt: Date.now()
                }
            ]
            setNotes(defaultNotes)
            setActiveNoteId('1')
            localStorage.setItem('evolve-notes', JSON.stringify(defaultNotes))
        }
    }, []) // Empty dependency array - only runs once

    // Save to localStorage whenever notes change
    useEffect(() => {
        if (notes.length > 0) {
            localStorage.setItem('evolve-notes', JSON.stringify(notes))
        }
    }, [notes])

    const createNewNote = () => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: 'Untitled Note',
            content: '',
            lastModified: Date.now(),
            createdAt: Date.now()
        }
        setNotes(prev => [newNote, ...prev])
        setActiveNoteId(newNote.id)

        // Focus editor after creation
        setTimeout(() => {
            editorRef.current?.focus()
        }, 100)
    }

    const updateNote = (id: string, updates: Partial<Note>) => {
        setNotes(prev =>
            prev.map(note =>
                note.id === id
                    ? { ...note, ...updates, lastModified: Date.now() }
                    : note
            )
        )
    }

    const deleteNote = (id: string) => {
        if (notes.length === 1) {
            // Don't delete last note, clear it instead
            updateNote(id, { title: 'Untitled Note', content: '' })
            return
        }

        setNotes(prev => prev.filter(note => note.id !== id))
        if (activeNoteId === id) {
            // Set first available note as active
            const remainingNotes = notes.filter(n => n.id !== id)
            setActiveNoteId(remainingNotes[0]?.id || null)
        }
    }

    const duplicateNote = (id: string) => {
        const original = notes.find(n => n.id === id)
        if (original) {
            const duplicate: Note = {
                ...original,
                id: Date.now().toString(),
                title: `${original.title} (Copy)`,
                createdAt: Date.now(),
                lastModified: Date.now()
            }
            setNotes(prev => [duplicate, ...prev])
        }
    }

    const exportNote = (id: string) => {
        const note = notes.find(n => n.id === id)
        if (!note) return

        const content = `${note.title}\n\n${note.content}`
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${note.title}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    const importNote = (file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const content = e.target?.result as string
            const title = file.name.replace(/\.[^/.]+$/, '')

            const newNote: Note = {
                id: Date.now().toString(),
                title,
                content,
                lastModified: Date.now(),
                createdAt: Date.now()
            }
            setNotes(prev => [newNote, ...prev])
            setActiveNoteId(newNote.id)
        }
        reader.readAsText(file)
    }

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const activeNote = notes.find(n => n.id === activeNoteId)

    const ToolbarButton = ({ onClick, children, disabled }: any) => (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                background: 'transparent',
                border: '1px solid #3a3a3a',
                borderRadius: '4px',
                color: disabled ? '#666' : '#e0e0e0',
                padding: '6px 12px',
                cursor: disabled ? 'default' : 'pointer',
                fontSize: '13px',
                minWidth: '60px'
            }}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.currentTarget.style.background = '#3a3a3a'
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
            }}
        >
            {children}
        </button>
    )

    return (
        <Window
            windowId={windowId}
            title="Notes"
            onClose={close}
            zIndex={zIndex}
            onMinimize={minimize}
            defaultSize={{ width: 1000, height: 650 }}
            minSize={{ width: 600, height: 400 }}
        >
            <div style={{
                height: '100%',
                display: 'flex',
                background: '#1e1e1e',
                color: '#e0e0e0',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                {/* Sidebar */}
                <div style={{
                    width: isSidebarCollapsed ? '40px' : '250px',
                    borderRight: '1px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#252525'
                }}>
                    {/* Sidebar Header */}
                    <div style={{
                        padding: '12px',
                        borderBottom: '1px solid #333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        {!isSidebarCollapsed && <span style={{ fontWeight: 500 }}>Notes</span>}
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#888',
                                cursor: 'pointer',
                                padding: '4px 8px'
                            }}
                        >
                            {isSidebarCollapsed ? '›' : '‹'}
                        </button>
                    </div>

                    {!isSidebarCollapsed && (
                        <>
                            {/* Search */}
                            <div style={{ padding: '12px' }}>
                                <input
                                    type="text"
                                    placeholder="Search notes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '6px 8px',
                                        background: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: '4px',
                                        color: '#e0e0e0',
                                        fontSize: '13px',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {/* New Note Button */}
                            <button
                                onClick={createNewNote}
                                style={{
                                    margin: '0 12px 12px',
                                    padding: '6px',
                                    background: '#0a4a8a',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                + New Note
                            </button>

                            {/* Notes List */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '0 8px'
                            }}>
                                {filteredNotes.map(note => (
                                    <div
                                        key={note.id}
                                        onClick={() => setActiveNoteId(note.id)}
                                        style={{
                                            padding: '10px',
                                            margin: '4px 0',
                                            background: activeNoteId === note.id ? '#2a2a2a' : 'transparent',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            border: '1px solid',
                                            borderColor: activeNoteId === note.id ? '#0a4a8a' : 'transparent'
                                        }}
                                    >
                                        <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '4px' }}>
                                            {note.title}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#888' }}>
                                            {new Date(note.lastModified).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Editor */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#1a1a1a'
                }}>
                    {activeNote ? (
                        <>
                            {/* Toolbar */}
                            <div style={{
                                padding: '8px 12px',
                                borderBottom: '1px solid #333',
                                display: 'flex',
                                gap: '8px',
                                background: '#252525'
                            }}>
                                <ToolbarButton onClick={createNewNote}>New</ToolbarButton>
                                <ToolbarButton onClick={() => deleteNote(activeNote.id)}>Delete</ToolbarButton>
                                <ToolbarButton onClick={() => duplicateNote(activeNote.id)}>Copy</ToolbarButton>
                                <div style={{ width: '1px', height: '24px', background: '#333' }} />
                                <ToolbarButton onClick={() => exportNote(activeNote.id)}>Export</ToolbarButton>
                                <ToolbarButton onClick={() => fileInputRef.current?.click()}>Import</ToolbarButton>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".txt"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) importNote(file)
                                    }}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* Title */}
                            <input
                                type="text"
                                value={activeNote.title}
                                onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                                style={{
                                    padding: '16px 20px 8px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#e0e0e0',
                                    fontSize: '24px',
                                    fontWeight: 500,
                                    outline: 'none',
                                    width: '100%'
                                }}
                                placeholder="Title"
                            />

                            {/* Metadata */}
                            <div style={{
                                padding: '0 20px 12px',
                                fontSize: '11px',
                                color: '#888',
                                borderBottom: '1px solid #333'
                            }}>
                                Last modified: {new Date(activeNote.lastModified).toLocaleString()}
                            </div>

                            {/* Editor */}
                            <textarea
                                ref={editorRef}
                                value={activeNote.content}
                                onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                                style={{
                                    flex: 1,
                                    padding: '20px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#e0e0e0',
                                    fontFamily: 'monospace',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    resize: 'none',
                                    outline: 'none',
                                    width: '100%'
                                }}
                                placeholder="Start writing..."
                            />
                        </>
                    ) : (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#888'
                        }}>
                            Select a note or create a new one
                        </div>
                    )}
                </div>
            </div>
        </Window>
    )
}