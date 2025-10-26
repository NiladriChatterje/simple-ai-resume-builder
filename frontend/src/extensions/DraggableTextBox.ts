import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import DraggableTextBoxComponent from './DraggableTextBoxComponent.tsx'

export interface DraggableTextBoxOptions {
    HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        draggableTextBox: {
            setDraggableTextBox: (options: { x: number; y: number; width: number; height: number }) => ReturnType
        }
    }
}

export const DraggableTextBox = Node.create<DraggableTextBoxOptions>({
    name: 'draggableTextBox',

    group: 'block',

    atom: true,

    draggable: false,

    addOptions() {
        return {
            HTMLAttributes: {},
        }
    },

    addAttributes() {
        return {
            x: {
                default: 0,
            },
            y: {
                default: 0,
            },
            width: {
                default: 200,
            },
            height: {
                default: 100,
            },
            content: {
                default: 'Double-click to edit',
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="draggable-text-box"]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'draggable-text-box' })]
    },

    addCommands() {
        return {
            setDraggableTextBox:
                (options) =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: options,
                        })
                    },
        }
    },

    addNodeView() {
        return ReactNodeViewRenderer(DraggableTextBoxComponent)
    },
})