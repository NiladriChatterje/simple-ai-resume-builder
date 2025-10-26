import { NodeViewWrapper } from '@tiptap/react'
import { useState, useRef, useEffect } from 'react'

export default function DraggableTextBoxComponent({ node, updateAttributes }: any) {
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    const { x, y, width, height, content } = node.attrs

    useEffect(() => {
        if (isEditing && textAreaRef.current) {
            textAreaRef.current.focus()
            textAreaRef.current.select()
        }
    }, [isEditing])

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isEditing) return
        e.preventDefault()
        setIsDragging(true)
        setDragStart({
            x: e.clientX - x,
            y: e.clientY - y,
        })
    }

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(true)
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width,
            height,
        })
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newX = e.clientX - dragStart.x
                const newY = e.clientY - dragStart.y
                updateAttributes({ x: newX, y: newY })
            } else if (isResizing) {
                const deltaX = e.clientX - resizeStart.x
                const deltaY = e.clientY - resizeStart.y
                const newWidth = Math.max(100, resizeStart.width + deltaX)
                const newHeight = Math.max(50, resizeStart.height + deltaY)
                updateAttributes({ width: newWidth, height: newHeight })
            }
        }

        const handleMouseUp = () => {
            setIsDragging(false)
            setIsResizing(false)
        }

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, isResizing, dragStart, resizeStart, updateAttributes])

    const handleDoubleClick = () => {
        setIsEditing(true)
    }

    const handleBlur = () => {
        setIsEditing(false)
    }

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateAttributes({ content: e.target.value })
    }

    return (
        <NodeViewWrapper
            style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: `${width}px`,
                height: `${height}px`,
                border: '2px solid #3b82f6',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 50,
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
        >
            {isEditing ? (
                <textarea
                    ref={textAreaRef}
                    value={content}
                    onChange={handleContentChange}
                    onBlur={handleBlur}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        outline: 'none',
                        padding: '8px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        resize: 'none',
                        backgroundColor: 'transparent',
                    }}
                />
            ) : (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        padding: '8px',
                        fontSize: '14px',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}
                >
                    {content}
                </div>
            )}

            {/* Resize Handle */}
            <div
                onMouseDown={handleResizeMouseDown}
                style={{
                    position: 'absolute',
                    right: '-4px',
                    bottom: '-4px',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#3b82f6',
                    border: '2px solid white',
                    borderRadius: '50%',
                    cursor: 'nwse-resize',
                    zIndex: 51,
                }}
            />
        </NodeViewWrapper>
    )
}