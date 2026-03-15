// apps/Calculator.tsx
import { useState, useEffect } from 'react'
import Window from '../desktop/Window'

type CalculationState = {
    display: string
    previousValue: number | null
    operator: string | null
    newNumber: boolean
    memory: number
    lastResult: number
    expression: string
}

export default function Calculator({ windowId, close, zIndex, minimize }: any) {
    const [state, setState] = useState<CalculationState>({
        display: '0',
        previousValue: null,
        operator: null,
        newNumber: true,
        memory: 0,
        lastResult: 0,
        expression: ''
    })

    const [hasMemory, setHasMemory] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setHasMemory(state.memory !== 0)
    }, [state.memory])

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key

            if (/^[0-9]$/.test(key)) {
                e.preventDefault()
                handleNumber(key)
            }

            if (key === '+') {
                e.preventDefault()
                handleOperator('+')
            }
            if (key === '-') {
                e.preventDefault()
                handleOperator('-')
            }
            if (key === '*') {
                e.preventDefault()
                handleOperator('×')
            }
            if (key === '/') {
                e.preventDefault()
                handleOperator('÷')
            }

            if (key === 'Enter' || key === '=') {
                e.preventDefault()
                handleEquals()
            }

            if (key === 'Escape') {
                e.preventDefault()
                handleClear()
            }

            if (key === 'Backspace') {
                e.preventDefault()
                handleBackspace()
            }

            if (key === '.') {
                e.preventDefault()
                handleDecimal()
            }

            if (key === '%') {
                e.preventDefault()
                handlePercentage()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [state])

    const handleNumber = (num: string) => {
        setError(null)
        setState(prev => {
            if (prev.newNumber) {
                return {
                    ...prev,
                    display: num,
                    newNumber: false,
                    expression: prev.operator ? prev.expression + ' ' + num : prev.expression + num
                }
            } else {
                const newDisplay = prev.display === '0' ? num : prev.display + num
                return {
                    ...prev,
                    display: newDisplay,
                    expression: prev.expression + num
                }
            }
        })
    }

    const handleOperator = (op: string) => {
        setError(null)
        setState(prev => {
            const currentValue = parseFloat(prev.display)

            if (prev.previousValue !== null && prev.operator && !prev.newNumber) {
                const result = calculate(prev.previousValue, currentValue, prev.operator)
                return {
                    ...prev,
                    previousValue: result,
                    display: result.toString(),
                    operator: op,
                    newNumber: true,
                    expression: result.toString() + ' ' + op
                }
            }

            return {
                ...prev,
                previousValue: currentValue,
                operator: op,
                newNumber: true,
                expression: currentValue.toString() + ' ' + op
            }
        })
    }

    const calculate = (a: number, b: number, op: string): number => {
        switch (op) {
            case '+': return a + b
            case '-': return a - b
            case '×': return a * b
            case '÷':
                if (b === 0) {
                    setError('Cannot divide by zero')
                    return 0
                }
                return a / b
            default: return b
        }
    }

    const handleEquals = () => {
        setState(prev => {
            if (prev.previousValue === null || prev.operator === null) return prev

            const currentValue = parseFloat(prev.display)
            const result = calculate(prev.previousValue, currentValue, prev.operator)

            return {
                ...prev,
                display: result.toString(),
                previousValue: null,
                operator: null,
                newNumber: true,
                lastResult: result,
                expression: result.toString()
            }
        })
    }

    const handleClear = () => {
        setError(null)
        setState({
            display: '0',
            previousValue: null,
            operator: null,
            newNumber: true,
            memory: state.memory,
            lastResult: 0,
            expression: ''
        })
    }

    const handleClearEntry = () => {
        setError(null)
        setState(prev => ({
            ...prev,
            display: '0',
            newNumber: true
        }))
    }

    const handleBackspace = () => {
        setState(prev => {
            if (prev.display.length > 1) {
                return {
                    ...prev,
                    display: prev.display.slice(0, -1)
                }
            } else {
                return {
                    ...prev,
                    display: '0',
                    newNumber: true
                }
            }
        })
    }

    const handleDecimal = () => {
        setState(prev => {
            if (prev.newNumber) {
                return {
                    ...prev,
                    display: '0.',
                    newNumber: false
                }
            }
            if (!prev.display.includes('.')) {
                return {
                    ...prev,
                    display: prev.display + '.'
                }
            }
            return prev
        })
    }

    const handleSign = () => {
        setState(prev => ({
            ...prev,
            display: (parseFloat(prev.display) * -1).toString()
        }))
    }

    const handlePercentage = () => {
        setState(prev => {
            const value = parseFloat(prev.display) / 100
            return {
                ...prev,
                display: value.toString(),
                newNumber: true
            }
        })
    }

    const handleSquareRoot = () => {
        const value = parseFloat(state.display)
        if (value < 0) {
            setError('Invalid input')
            return
        }
        setState(prev => ({
            ...prev,
            display: Math.sqrt(value).toString(),
            newNumber: true
        }))
    }

    const handleReciprocal = () => {
        const value = parseFloat(state.display)
        if (value === 0) {
            setError('Cannot divide by zero')
            return
        }
        setState(prev => ({
            ...prev,
            display: (1 / value).toString(),
            newNumber: true
        }))
    }

    // Memory functions
    const handleMemoryAdd = () => {
        setState(prev => ({
            ...prev,
            memory: prev.memory + parseFloat(prev.display),
            newNumber: true
        }))
    }

    const handleMemorySubtract = () => {
        setState(prev => ({
            ...prev,
            memory: prev.memory - parseFloat(prev.display),
            newNumber: true
        }))
    }

    const handleMemoryRecall = () => {
        setState(prev => ({
            ...prev,
            display: prev.memory.toString(),
            newNumber: true
        }))
    }

    const handleMemoryClear = () => {
        setState(prev => ({
            ...prev,
            memory: 0
        }))
    }

    const Button = ({ onClick, children, className = '', disabled = false, title = '' }: any) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{
                background: className === 'operator' ? '#ff9f0a' :
                    className === 'function' ? '#5c5c5c' :
                        className === 'memory' ? '#404040' : '#333',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                cursor: disabled ? 'default' : 'pointer',
                fontSize: '18px',
                fontWeight: className === 'operator' ? '500' : '400',
                padding: '16px 0',
                width: '100%',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.1s',
                outline: 'none'
            }}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.currentTarget.style.filter = 'brightness(1.1)'
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)'
            }}
            onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
            }}
        >
            {children}
        </button>
    )

    return (
        <Window
            windowId={windowId}
            title="Calculator"
            onClose={close}
            zIndex={zIndex}
            onMinimize={minimize}
            defaultSize={{ width: 500, height: 800 }}
            minSize={{ width: 260, height: 800 }}
            resizable={false}
        >
            <div style={{
                height: '100%',
                background: '#1e1e1e',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                userSelect: 'none'
            }}>
                {/* Memory indicator */}
                <div style={{ height: '20px', fontSize: '12px', color: '#888' }}>
                    {hasMemory && <span style={{ color: '#ff9f0a' }}>M</span>}
                </div>

                {/* Display */}
                <div style={{
                    background: '#2a2a2a',
                    borderRadius: '6px',
                    padding: '20px 12px',
                    textAlign: 'right',
                    fontFamily: 'monospace',
                    fontSize: '36px',
                    color: error ? '#ff6b6b' : 'white',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minHeight: '100px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    {state.expression && !error && (
                        <div style={{ fontSize: '14px', color: '#888', marginBottom: '4px' }}>
                            {state.expression}
                        </div>
                    )}
                    <div>
                        {error || state.display}
                    </div>
                </div>

                {/* Memory buttons row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    marginBottom: '4px'
                }}>
                    <Button onClick={handleMemoryClear} className="memory" disabled={!hasMemory} title="Memory Clear (MC)">MC</Button>
                    <Button onClick={handleMemoryRecall} className="memory" disabled={!hasMemory} title="Memory Recall (MR)">MR</Button>
                    <Button onClick={handleMemoryAdd} className="memory" title="Memory Add (M+)">M+</Button>
                    <Button onClick={handleMemorySubtract} className="memory" title="Memory Subtract (M-)">M-</Button>
                </div>

                {/* Main button grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    flex: 1
                }}>
                    {/* Row 1 */}
                    <Button onClick={handleClearEntry} className="function">CE</Button>
                    <Button onClick={handleClear} className="function">C</Button>
                    <Button onClick={handleBackspace} className="function">⌫</Button>
                    <Button onClick={() => handleOperator('÷')} className="operator">÷</Button>

                    {/* Row 2 */}
                    <Button onClick={() => handleNumber('7')}>7</Button>
                    <Button onClick={() => handleNumber('8')}>8</Button>
                    <Button onClick={() => handleNumber('9')}>9</Button>
                    <Button onClick={() => handleOperator('×')} className="operator">×</Button>

                    {/* Row 3 */}
                    <Button onClick={() => handleNumber('4')}>4</Button>
                    <Button onClick={() => handleNumber('5')}>5</Button>
                    <Button onClick={() => handleNumber('6')}>6</Button>
                    <Button onClick={() => handleOperator('-')} className="operator">-</Button>

                    {/* Row 4 */}
                    <Button onClick={() => handleNumber('1')}>1</Button>
                    <Button onClick={() => handleNumber('2')}>2</Button>
                    <Button onClick={() => handleNumber('3')}>3</Button>
                    <Button onClick={() => handleOperator('+')} className="operator">+</Button>

                    {/* Row 5 */}
                    <Button onClick={handleSign} className="function">±</Button>
                    <Button onClick={() => handleNumber('0')}>0</Button>
                    <Button onClick={handleDecimal}>.</Button>
                    <Button onClick={handleEquals} className="operator">=</Button>

                    {/* Row 6 - Extra functions */}
                    <Button onClick={handleSquareRoot} className="function">√</Button>
                    <Button onClick={handlePercentage} className="function">%</Button>
                    <Button onClick={handleReciprocal} className="function">1/x</Button>
                    <div /> {/* Empty cell for grid alignment */}
                </div>

                {/* Status bar */}
                <div style={{
                    fontSize: '10px',
                    color: '#666',
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '4px'
                }}>
                    <span>Standard</span>
                    <span>© Evolve OS</span>
                </div>
            </div>
        </Window>
    )
}