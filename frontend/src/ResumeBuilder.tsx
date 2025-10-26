import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'

type Profile = {
    name?: string
    title?: string
    summary?: string
    experience?: string
    skills?: string
    education?: string
}

function markdownToHtml(markdown: string): string {
    let html = markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')

    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    html = `<p>${html}</p>`

    return html
}

export default function ResumeBuilder() {
    const [profile, setProfile] = useState<Profile>({
        name: '',
        title: '',
        summary: '',
        experience: '',
        skills: '',
        education: '',
    })
    const [instructions, setInstructions] = useState('Create a clear, concise resume tailored to the target job.')
    const [generated, setGenerated] = useState('')
    const [loading, setLoading] = useState(false)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
        ],
        content: '<p>Your generated resume will appear here...</p>',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[70vh] p-4',
            },
        },
    })

    useEffect(() => {
        if (generated && editor) {
            const htmlContent = markdownToHtml(generated)
            editor.commands.setContent(htmlContent)
        }
    }, [generated, editor])

    async function generate() {
        setLoading(true)
        setGenerated('')
        try {
            const resp = await fetch(`${backendUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile, instructions }),
            })
            const data = await resp.json()
            if (data.success) {
                setGenerated(data.text || JSON.stringify(data, null, 2))
            } else {
                setGenerated('Error: ' + (data.error || 'unknown'))
            }
        } catch (e: any) {
            setGenerated('Request failed: ' + (e.message || String(e)))
        } finally {
            setLoading(false)
        }
    }

    function updateField<K extends keyof Profile>(key: K, value: Profile[K]) {
        setProfile((p) => ({ ...p, [key]: value }))
    }

    function downloadResume(format: 'html' | 'md' = 'html') {
        let content: string
        let mimeType: string
        let extension: string

        if (format === 'html' && editor) {
            content = editor.getHTML()
            mimeType = 'text/html'
            extension = 'html'
        } else {
            content = generated
            mimeType = 'text/markdown'
            extension = 'md'
        }

        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${profile.name || 'resume'}.${extension}`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <section style={{ padding: '1rem', border: '1px solid #eee', borderRadius: 8 }}>
                <h2>Profile</h2>
                <label>Name</label>
                <input value={profile.name} onChange={(e) => updateField('name', e.target.value)} style={{ width: '100%' }} />
                <label>Title</label>
                <input value={profile.title} onChange={(e) => updateField('title', e.target.value)} style={{ width: '100%' }} />
                <label>Summary</label>
                <textarea value={profile.summary} onChange={(e) => updateField('summary', e.target.value)} style={{ width: '100%' }} rows={3} />
                <label>Experience (paste or short bullet list)</label>
                <textarea value={profile.experience} onChange={(e) => updateField('experience', e.target.value)} style={{ width: '100%' }} rows={5} />
                <label>Skills (comma separated)</label>
                <input value={profile.skills} onChange={(e) => updateField('skills', e.target.value)} style={{ width: '100%' }} />
                <label>Education</label>
                <input value={profile.education} onChange={(e) => updateField('education', e.target.value)} style={{ width: '100%' }} />

                <h3 style={{ marginTop: '0.75rem' }}>Prompt Instructions</h3>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} style={{ width: '100%' }} rows={3} />

                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={generate} disabled={loading}>
                        {loading ? 'Generating…' : 'Generate'}
                    </button>
                    <button onClick={() => {
                        const blankContent = `<h1>${profile.name || 'Name'}</h1><p><br/></p>`
                        editor?.commands.setContent(blankContent)
                    }}>Start Blank</button>
                </div>
            </section>

            <section style={{ padding: '1rem', border: '1px solid #eee', borderRadius: 8 }}>
                <h2>Generated Resume (editable)</h2>

                <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
                    <button
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        disabled={!editor}
                        style={{ fontWeight: editor?.isActive('bold') ? 'bold' : 'normal', padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        disabled={!editor}
                        style={{ fontStyle: editor?.isActive('italic') ? 'italic' : 'normal', padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                    >
                        <em>I</em>
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().toggleUnderline().run()}
                        disabled={!editor}
                        style={{ textDecoration: editor?.isActive('underline') ? 'underline' : 'none', padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                    >
                        <u>U</u>
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                        disabled={!editor}
                        style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                    >
                        H1
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        disabled={!editor}
                        style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                    >
                        H2
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        disabled={!editor}
                        style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                    >
                        • List
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                        disabled={!editor}
                        style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                    >
                        ⬅
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                        disabled={!editor}
                        style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                    >
                        ↔
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                        disabled={!editor}
                        style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                    >
                        ➡
                    </button>
                </div>

                <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => downloadResume('html')} disabled={!editor}>Download HTML</button>
                    <button onClick={() => downloadResume('md')} disabled={!generated}>Download MD</button>
                </div>

                <div style={{ border: '1px solid #ddd', borderRadius: 4, minHeight: '70vh', backgroundColor: '#fff' }}>
                    <EditorContent editor={editor} />
                </div>
            </section>
        </div>
    )
}
