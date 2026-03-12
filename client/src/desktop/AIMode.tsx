// AIMode.tsx
import { useEffect, useRef, useState } from 'react'

interface AIModeProps {
    isActive: boolean
    onExit: () => void
}

declare global {
    interface Window {
        THREE: any
        webkitAudioContext: typeof AudioContext
        SpeechRecognition: any
        webkitSpeechRecognition: any
    }
}

export default function AIMode({ isActive, onExit }: AIModeProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const animationRef = useRef<number>()
    const sceneRef = useRef<any>(null)
    const cameraRef = useRef<any>(null)
    const rendererRef = useRef<any>(null)
    const linesRef = useRef<any>(null)
    const particlesRef = useRef<any>(null)

    const [audioLevel, setAudioLevel] = useState(0)
    const [transcript, setTranscript] = useState<string>("")
    const [isListening, setIsListening] = useState(false)

    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const mediaStreamRef = useRef<MediaStream | null>(null)
    const recognitionRef = useRef<any>(null)
    const silenceTimeoutRef = useRef<any>(null)
    const restartTimeoutRef = useRef<any>(null)

    // Force cleanup when isActive becomes false
    useEffect(() => {
        if (!isActive) {
            console.log('AI Mode deactivated - cleaning up resources')

            // Clear all timeouts
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current)
                silenceTimeoutRef.current = null
            }
            if (restartTimeoutRef.current) {
                clearTimeout(restartTimeoutRef.current)
                restartTimeoutRef.current = null
            }

            // Stop speech recognition
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.onend = null
                    recognitionRef.current.onerror = null
                    recognitionRef.current.stop()
                } catch (e) { }
                recognitionRef.current = null
            }

            // Stop audio context and tracks
            if (sourceRef.current) {
                try {
                    sourceRef.current.disconnect()
                } catch (e) { }
                sourceRef.current = null
            }

            if (audioContextRef.current) {
                try {
                    audioContextRef.current.close()
                } catch (e) { }
                audioContextRef.current = null
            }

            if (mediaStreamRef.current) {
                try {
                    mediaStreamRef.current.getTracks().forEach(track => track.stop())
                } catch (e) { }
                mediaStreamRef.current = null
            }

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                animationRef.current = undefined
            }

            setAudioLevel(0)
            setTranscript("")
            setIsListening(false)

            analyserRef.current = null
        }
    }, [isActive])

    // Load Three.js from CDN
    useEffect(() => {
        if (!isActive) return

        if (window.THREE) {
            initScene()
        } else {
            const script = document.createElement('script')
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
            script.async = true
            script.onload = initScene
            document.body.appendChild(script)

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current)
                }
                if (rendererRef.current) {
                    rendererRef.current.dispose()
                }
                if (script.parentNode) {
                    document.body.removeChild(script)
                }
            }
        }
    }, [isActive])

    // Audio and Speech setup
    useEffect(() => {
        if (!isActive) return

        setIsListening(false)

        // Setup speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
            try {
                const recognition = new SpeechRecognition()
                recognition.continuous = true
                recognition.interimResults = true
                recognition.maxAlternatives = 1
                recognition.lang = 'en-US'

                recognition.onstart = () => {
                    if (!isActive) return
                    setIsListening(true)
                }

                recognition.onresult = (event: any) => {
                    if (!isActive) return

                    if (silenceTimeoutRef.current) {
                        clearTimeout(silenceTimeoutRef.current)
                    }

                    let finalTranscript = ''
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript + ' '
                        }
                    }

                    if (finalTranscript) {
                        setTranscript(finalTranscript.trim())

                        silenceTimeoutRef.current = setTimeout(() => {
                            if (isActive) {
                                setTranscript("")
                            }
                        }, 3000)
                    }
                }

                recognition.onerror = (event: any) => {
                    if (!isActive) return
                    if (event.error !== 'no-speech' && event.error !== 'aborted') {
                        console.log('Recognition error:', event.error)
                    }
                }

                recognition.onend = () => {
                    if (!isActive) return

                    if (restartTimeoutRef.current) {
                        clearTimeout(restartTimeoutRef.current)
                    }
                    restartTimeoutRef.current = setTimeout(() => {
                        if (isActive && recognitionRef.current) {
                            try {
                                recognition.start()
                            } catch (e) { }
                        }
                    }, 300)
                }

                recognition.start()
                recognitionRef.current = recognition

            } catch (error) {
                console.error('Failed to start speech recognition:', error)
            }
        }

        // Setup audio context for visualization
        const setupAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                if (!isActive) {
                    stream.getTracks().forEach(track => track.stop())
                    return
                }

                mediaStreamRef.current = stream

                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
                analyserRef.current = audioContextRef.current.createAnalyser()
                sourceRef.current = audioContextRef.current.createMediaStreamSource(stream)
                sourceRef.current.connect(analyserRef.current)

                analyserRef.current.fftSize = 128
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

                const updateLevel = () => {
                    if (!analyserRef.current || !isActive) return
                    analyserRef.current.getByteFrequencyData(dataArray)
                    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
                    const level = average / 255
                    setAudioLevel(prev => prev * 0.7 + level * 0.3)
                    animationRef.current = requestAnimationFrame(updateLevel)
                }

                updateLevel()
            } catch (error) {
                console.log('Microphone access denied or not available')
            }
        }

        setupAudio()

        return () => {
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current)
                silenceTimeoutRef.current = null
            }

            if (restartTimeoutRef.current) {
                clearTimeout(restartTimeoutRef.current)
                restartTimeoutRef.current = null
            }

            if (recognitionRef.current) {
                try {
                    recognitionRef.current.onend = null
                    recognitionRef.current.onerror = null
                    recognitionRef.current.stop()
                } catch (e) { }
                recognitionRef.current = null
            }

            if (sourceRef.current) {
                try {
                    sourceRef.current.disconnect()
                } catch (e) { }
                sourceRef.current = null
            }

            if (audioContextRef.current) {
                try {
                    audioContextRef.current.close()
                } catch (e) { }
                audioContextRef.current = null
            }

            if (mediaStreamRef.current) {
                try {
                    mediaStreamRef.current.getTracks().forEach(track => track.stop())
                } catch (e) { }
                mediaStreamRef.current = null
            }

            analyserRef.current = null
        }
    }, [isActive])

    // Animation loop with listening feedback
    useEffect(() => {
        if (!isActive || !sceneRef.current || !cameraRef.current || !rendererRef.current || !linesRef.current || !particlesRef.current) return

        let time = 0
        const animate = () => {
            if (!linesRef.current || !particlesRef.current || !cameraRef.current || !rendererRef.current || !sceneRef.current || !isActive) return

            time += 0.005

            // Base rotation - very slow
            linesRef.current.rotation.y += 0.0003
            linesRef.current.rotation.x += 0.0001
            particlesRef.current.rotation.y = linesRef.current.rotation.y
            particlesRef.current.rotation.x = linesRef.current.rotation.x

            // LISTENING FEEDBACK - Neural mesh reacts when audio is detected
            if (audioLevel > 0.05) {
                // Quick pulse outward when sound is detected
                const pulse = 1 + audioLevel * 0.4
                linesRef.current.scale.set(pulse, pulse, pulse)
                particlesRef.current.scale.set(pulse, pulse, pulse)

                // Brighten and change color slightly
                if (linesRef.current.material) {
                    linesRef.current.material.opacity = 0.25 + audioLevel * 0.3
                    // Shift from blue to cyan when listening
                    linesRef.current.material.color.setHSL(0.58, 1, 0.5 + audioLevel * 0.1)
                }

                // Add a subtle bounce/ripple effect
                if (Math.random() > 0.95) {
                    linesRef.current.rotation.z += 0.01 * audioLevel
                }
            } else {
                // Return to idle state
                if (linesRef.current.scale.x > 1.01) {
                    linesRef.current.scale.set(1, 1, 1)
                    particlesRef.current.scale.set(1, 1, 1)
                }

                if (linesRef.current.material) {
                    linesRef.current.material.opacity = 0.15
                    linesRef.current.material.color.setHSL(0.6, 1, 0.45)
                }

                // Smoothly return rotation to normal
                linesRef.current.rotation.z *= 0.95
            }

            rendererRef.current.render(sceneRef.current, cameraRef.current)
            animationRef.current = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [isActive, audioLevel])

    const initScene = () => {
        if (!containerRef.current || !window.THREE) return

        const THREE = window.THREE

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x0a0a0a)
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
        camera.position.set(0, 0, 8)
        camera.lookAt(0, 0, 0)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const points = []
        const radius = 2

        for (let i = 0; i < 120; i++) {
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            const r = radius + (Math.random() - 0.5) * 0.3

            const x = r * Math.sin(phi) * Math.cos(theta)
            const y = r * Math.sin(phi) * Math.sin(theta)
            const z = r * Math.cos(phi)

            points.push(new THREE.Vector3(x, y, z))
        }

        // Create connections
        const connections = []
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const dist = points[i].distanceTo(points[j])
                if (dist < 1.8) {
                    connections.push([i, j])
                }
            }
        }
        const edgeVertices = []
        connections.forEach(([i, j]) => {
            edgeVertices.push(points[i].x, points[i].y, points[i].z)
            edgeVertices.push(points[j].x, points[j].y, points[j].z)
        })

        const lineGeometry = new THREE.BufferGeometry()
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgeVertices, 3))

        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.15
        })

        const lines = new THREE.LineSegments(lineGeometry, lineMaterial)
        scene.add(lines)
        linesRef.current = lines

        const pointGeometry = new THREE.BufferGeometry()
        const pointPositions = new Float32Array(points.length * 3)
        points.forEach((point, i) => {
            pointPositions[i * 3] = point.x
            pointPositions[i * 3 + 1] = point.y
            pointPositions[i * 3 + 2] = point.z
        })
        pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3))

        const pointMaterial = new THREE.PointsMaterial({
            color: 0xaaccff,
            size: 0.05,
            transparent: true,
            blending: THREE.AdditiveBlending
        })

        const particleSystem = new THREE.Points(pointGeometry, pointMaterial)
        scene.add(particleSystem)
        particlesRef.current = particleSystem

        const handleResize = () => {
            if (!cameraRef.current || !rendererRef.current) return
            cameraRef.current.aspect = window.innerWidth / window.innerHeight
            cameraRef.current.updateProjectionMatrix()
            rendererRef.current.setSize(window.innerWidth, window.innerHeight)
        }

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }

    if (!isActive) return null

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 999998,
                pointerEvents: 'none',
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div
                ref={containerRef}
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                }}
            />

            {transcript && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 100,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '8px 16px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        border: '1px solid rgba(136, 204, 255, 0.3)',
                        borderRadius: '20px',
                        color: '#88ccff',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        zIndex: 999999,
                        backdropFilter: 'blur(4px)',
                        textAlign: 'center',
                        animation: 'fadeIn 0.3s ease',
                    }}
                >
                    {transcript}
                </div>
            )}

            <button
                onClick={onExit}
                style={{
                    position: 'absolute',
                    bottom: 30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '6px 16px',
                    background: 'transparent',
                    border: '1px solid rgba(136, 204, 255, 0.2)',
                    color: '#88ccff',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    zIndex: 999999,
                    backdropFilter: 'blur(5px)',
                    pointerEvents: 'auto',
                    letterSpacing: '1px',
                    transition: 'all 0.2s ease',
                    opacity: 0.5,
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1'
                    e.currentTarget.style.borderColor = '#88ccff'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.5'
                    e.currentTarget.style.borderColor = 'rgba(136, 204, 255, 0.2)'
                }}
            >
                EXIT
            </button>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
        </div>
    )
}