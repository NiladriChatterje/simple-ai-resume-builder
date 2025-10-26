import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import { DraggableTextBox } from './extensions/DraggableTextBox'
import {
    Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2,
    List, AlignLeft, AlignCenter, AlignRight, Download, Save,
    Upload, Plus, Trash2, ChevronDown, ChevronUp, FileText,
    Sparkles, RotateCcw, ImageIcon, Type
} from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { marked } from 'marked'

type Experience = {
    id: string
    company: string
    position: string
    location: string
    startDate: string
    endDate: string
    current: boolean
    description: string
}

type Education = {
    id: string
    institution: string
    degree: string
    field: string
    location: string
    graduationDate: string
    gpa: string
}

type Project = {
    id: string
    name: string
    description: string
    technologies: string
    link: string
}

type Certification = {
    id: string
    name: string
    issuer: string
    date: string
    credentialId: string
}

type Language = {
    id: string
    language: string
    proficiency: string
}

type Profile = {
    fullName: string
    email: string
    phone: string
    location: string
    linkedin: string
    website: string
    github: string
    summary: string
    skills: string
    experiences: Experience[]
    education: Education[]
    projects: Project[]
    certifications: Certification[]
    languages: Language[]
}

type CollapsibleSectionProps = {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
}

function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="card" style={{ marginBottom: '1rem' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="secondary"
                style={{ width: '100%', justifyContent: 'space-between', marginBottom: isOpen ? '1rem' : 0 }}
            >
                <span style={{ fontWeight: 600, fontSize: '1rem' }}>{title}</span>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isOpen && <div>{children}</div>}
        </div>
    )
}

function markdownToHtml(markdown: string): string {
    // Configure marked options for better rendering
    marked.setOptions({
        breaks: true,
        gfm: true
    })

    try {
        const html = marked.parse(markdown) as string
        return html
    } catch (error) {
        console.error('Markdown parsing error:', error)
        return `<p>${markdown}</p>`
    }
}

export default function ResumeBuilder() {
    const [profile, setProfile] = useState<Profile>({
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        website: '',
        github: '',
        summary: '',
        skills: '',
        experiences: [],
        education: [],
        projects: [],
        certifications: [],
        languages: []
    })

    const [instructions, setInstructions] = useState('Create a clear, concise, ATS-friendly resume tailored to the target job. Highlight achievements and use action verbs.')
    const [generated, setGenerated] = useState('')
    const [loading, setLoading] = useState(false)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

    const [padding, setPadding] = useState({
        top: 40,
        right: 40,
        bottom: 40,
        left: 40
    })

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            DraggableTextBox,
            Image.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'resume-image',
                },
            }),
        ],
        content: '<p>Your generated resume will appear here...</p>',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg focus:outline-none min-h-[70vh] p-6',
                style: 'background-color: white; border-radius: 0.5rem;'
            },
        },
    })

    useEffect(() => {
        const saved = localStorage.getItem('resumeProfile')
        if (saved) {
            try {
                setProfile(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to load saved profile:', e)
            }
        }
    }, [])

    useEffect(() => {
        if (generated && editor) {
            const htmlContent = markdownToHtml(generated)
            editor.commands.setContent(htmlContent)
        }
    }, [generated, editor])

    useEffect(() => {
        if (!editor) return

        let selectedImage: HTMLImageElement | null = null
        let resizeBox: HTMLDivElement | null = null
        let isDragging = false
        let isResizing = false
        let startX = 0
        let startY = 0
        let startWidth = 0
        let startHeight = 0
        let startLeft = 0
        let startTop = 0
        let currentHandle = ''

        const handleImageClick = (e: Event) => {
            const target = e.target as HTMLElement
            if (target.tagName === 'IMG' && target.classList.contains('resume-image')) {
                e.stopPropagation()
                selectImage(target as HTMLImageElement)
            }
        }

        const selectImage = (img: HTMLImageElement) => {
            removeResizeBox()
            selectedImage = img

            // Make image absolutely positioned for dragging
            if (img.style.position !== 'absolute') {
                const rect = img.getBoundingClientRect()
                const editorRect = img.closest('.ProseMirror')?.getBoundingClientRect()
                if (editorRect) {
                    img.style.position = 'absolute'
                    img.style.left = `${rect.left - editorRect.left}px`
                    img.style.top = `${rect.top - editorRect.top}px`
                }
            }

            createResizeBox(img)
        }

        const createResizeBox = (img: HTMLImageElement) => {
            resizeBox = document.createElement('div')
            resizeBox.className = 'image-resize-box'
            resizeBox.style.cssText = `
                position: absolute;
                border: 2px solid var(--primary-color);
                pointer-events: none;
                z-index: 1000;
                cursor: move;
            `

            const updateBoxPosition = () => {
                if (!img || !resizeBox) return
                const rect = img.getBoundingClientRect()
                const editorRect = img.closest('.ProseMirror')?.getBoundingClientRect()
                if (!editorRect) return

                resizeBox.style.left = `${rect.left - editorRect.left}px`
                resizeBox.style.top = `${rect.top - editorRect.top}px`
                resizeBox.style.width = `${rect.width}px`
                resizeBox.style.height = `${rect.height}px`
            }

            // Create 8 resize handles
            const handles = [
                { position: 'top-left', cursor: 'nw-resize', top: '-5px', left: '-5px' },
                { position: 'top', cursor: 'n-resize', top: '-5px', left: '50%', transform: 'translateX(-50%)' },
                { position: 'top-right', cursor: 'ne-resize', top: '-5px', right: '-5px' },
                { position: 'right', cursor: 'e-resize', top: '50%', right: '-5px', transform: 'translateY(-50%)' },
                { position: 'bottom-right', cursor: 'se-resize', bottom: '-5px', right: '-5px' },
                { position: 'bottom', cursor: 's-resize', bottom: '-5px', left: '50%', transform: 'translateX(-50%)' },
                { position: 'bottom-left', cursor: 'sw-resize', bottom: '-5px', left: '-5px' },
                { position: 'left', cursor: 'w-resize', top: '50%', left: '-5px', transform: 'translateY(-50%)' }
            ]

            handles.forEach(({ position, cursor, ...styles }) => {
                const handle = document.createElement('div')
                handle.className = `resize-handle resize-handle-${position}`
                handle.dataset.position = position

                let styleString = `
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: var(--primary-color);
                    cursor: ${cursor};
                    pointer-events: auto;
                    border-radius: 2px;
                    border: 1px solid white;
                `

                Object.entries(styles).forEach(([key, value]) => {
                    styleString += `${key}: ${value};`
                })

                handle.style.cssText = styleString

                handle.addEventListener('mousedown', (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    isResizing = true
                    currentHandle = position
                    startX = e.clientX
                    startY = e.clientY
                    startWidth = img.offsetWidth
                    startHeight = img.offsetHeight
                    startLeft = parseFloat(img.style.left) || 0
                    startTop = parseFloat(img.style.top) || 0
                    document.body.style.cursor = cursor
                })

                if (resizeBox) {
                    resizeBox.appendChild(handle)
                }
            })

            // Add drag functionality on the box itself
            resizeBox.style.pointerEvents = 'auto'
            resizeBox.addEventListener('mousedown', (e) => {
                if ((e.target as HTMLElement).classList.contains('resize-handle')) return
                e.preventDefault()
                e.stopPropagation()
                isDragging = true
                startX = e.clientX
                startY = e.clientY
                startLeft = parseFloat(img.style.left) || 0
                startTop = parseFloat(img.style.top) || 0
                document.body.style.cursor = 'move'
            })

            document.addEventListener('mousemove', (e) => {
                if (isDragging && selectedImage) {
                    const dx = e.clientX - startX
                    const dy = e.clientY - startY
                    selectedImage.style.left = `${startLeft + dx}px`
                    selectedImage.style.top = `${startTop + dy}px`
                    updateBoxPosition()
                } else if (isResizing && selectedImage) {
                    const dx = e.clientX - startX
                    const dy = e.clientY - startY

                    let newWidth = startWidth
                    let newHeight = startHeight
                    let newLeft = startLeft
                    let newTop = startTop

                    switch (currentHandle) {
                        case 'right':
                        case 'bottom-right':
                        case 'top-right':
                            newWidth = Math.max(50, startWidth + dx)
                            break
                        case 'left':
                        case 'bottom-left':
                        case 'top-left':
                            newWidth = Math.max(50, startWidth - dx)
                            newLeft = startLeft + (startWidth - newWidth)
                            break
                    }

                    switch (currentHandle) {
                        case 'bottom':
                        case 'bottom-right':
                        case 'bottom-left':
                            newHeight = Math.max(50, startHeight + dy)
                            break
                        case 'top':
                        case 'top-right':
                        case 'top-left':
                            newHeight = Math.max(50, startHeight - dy)
                            newTop = startTop + (startHeight - newHeight)
                            break
                    }

                    selectedImage.style.width = `${newWidth}px`
                    selectedImage.style.height = `${newHeight}px`
                    selectedImage.style.left = `${newLeft}px`
                    selectedImage.style.top = `${newTop}px`
                    updateBoxPosition()
                }
            })

            document.addEventListener('mouseup', () => {
                if (isDragging || isResizing) {
                    isDragging = false
                    isResizing = false
                    currentHandle = ''
                    document.body.style.cursor = 'default'
                }
            })

            img.closest('.ProseMirror')?.appendChild(resizeBox)
            updateBoxPosition()
        }

        const removeResizeBox = () => {
            if (resizeBox) {
                resizeBox.remove()
                resizeBox = null
            }
            selectedImage = null
        }

        const handleClickOutside = (e: Event) => {
            const target = e.target as HTMLElement
            if (!target.closest('.image-resize-box') && !target.classList.contains('resume-image')) {
                removeResizeBox()
            }
        }

        const editorElement = editor.view.dom
        editorElement.addEventListener('click', handleImageClick)
        document.addEventListener('click', handleClickOutside)

        return () => {
            editorElement.removeEventListener('click', handleImageClick)
            document.removeEventListener('click', handleClickOutside)
            removeResizeBox()
        }
    }, [editor])

    const saveProfile = () => {
        localStorage.setItem('resumeProfile', JSON.stringify(profile))
        alert('Profile saved successfully!')
    }

    const loadProfile = () => {
        const saved = localStorage.getItem('resumeProfile')
        if (saved) {
            setProfile(JSON.parse(saved))
            alert('Profile loaded successfully!')
        } else {
            alert('No saved profile found')
        }
    }

    const clearProfile = () => {
        if (confirm('Are you sure you want to clear all data?')) {
            setProfile({
                fullName: '',
                email: '',
                phone: '',
                location: '',
                linkedin: '',
                website: '',
                github: '',
                summary: '',
                skills: '',
                experiences: [],
                education: [],
                projects: [],
                certifications: [],
                languages: []
            })
            localStorage.removeItem('resumeProfile')
        }
    }

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

    const addExperience = () => {
        setProfile(p => ({
            ...p,
            experiences: [...p.experiences, {
                id: Date.now().toString(),
                company: '',
                position: '',
                location: '',
                startDate: '',
                endDate: '',
                current: false,
                description: ''
            }]
        }))
    }

    const removeExperience = (id: string) => {
        setProfile(p => ({
            ...p,
            experiences: p.experiences.filter(e => e.id !== id)
        }))
    }

    const updateExperience = (id: string, field: keyof Experience, value: any) => {
        setProfile(p => ({
            ...p,
            experiences: p.experiences.map(e => e.id === id ? { ...e, [field]: value } : e)
        }))
    }

    const addEducation = () => {
        setProfile(p => ({
            ...p,
            education: [...p.education, {
                id: Date.now().toString(),
                institution: '',
                degree: '',
                field: '',
                location: '',
                graduationDate: '',
                gpa: ''
            }]
        }))
    }

    const removeEducation = (id: string) => {
        setProfile(p => ({
            ...p,
            education: p.education.filter(e => e.id !== id)
        }))
    }

    const updateEducation = (id: string, field: keyof Education, value: any) => {
        setProfile(p => ({
            ...p,
            education: p.education.map(e => e.id === id ? { ...e, [field]: value } : e)
        }))
    }

    const addProject = () => {
        setProfile(p => ({
            ...p,
            projects: [...p.projects, {
                id: Date.now().toString(),
                name: '',
                description: '',
                technologies: '',
                link: ''
            }]
        }))
    }

    const removeProject = (id: string) => {
        setProfile(p => ({
            ...p,
            projects: p.projects.filter(p => p.id !== id)
        }))
    }

    const updateProject = (id: string, field: keyof Project, value: any) => {
        setProfile(p => ({
            ...p,
            projects: p.projects.map(proj => proj.id === id ? { ...proj, [field]: value } : proj)
        }))
    }

    const addCertification = () => {
        setProfile(p => ({
            ...p,
            certifications: [...p.certifications, {
                id: Date.now().toString(),
                name: '',
                issuer: '',
                date: '',
                credentialId: ''
            }]
        }))
    }

    const removeCertification = (id: string) => {
        setProfile(p => ({
            ...p,
            certifications: p.certifications.filter(c => c.id !== id)
        }))
    }

    const updateCertification = (id: string, field: keyof Certification, value: any) => {
        setProfile(p => ({
            ...p,
            certifications: p.certifications.map(c => c.id === id ? { ...c, [field]: value } : c)
        }))
    }

    const addLanguage = () => {
        setProfile(p => ({
            ...p,
            languages: [...p.languages, {
                id: Date.now().toString(),
                language: '',
                proficiency: 'Intermediate'
            }]
        }))
    }

    const removeLanguage = (id: string) => {
        setProfile(p => ({
            ...p,
            languages: p.languages.filter(l => l.id !== id)
        }))
    }

    const updateLanguage = (id: string, field: keyof Language, value: any) => {
        setProfile(p => ({
            ...p,
            languages: p.languages.map(l => l.id === id ? { ...l, [field]: value } : l)
        }))
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
        a.download = `${profile.fullName || 'resume'}.${extension}`
        a.click()
        URL.revokeObjectURL(url)
    }

    async function downloadPDF() {
        if (!editor) return

        const element = document.querySelector('.ProseMirror') as HTMLElement
        if (!element) return

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            const imgWidth = 210
            const imgHeight = (canvas.height * imgWidth) / canvas.width

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
            pdf.save(`${profile.fullName || 'resume'}.pdf`)
        } catch (error) {
            console.error('PDF generation failed:', error)
            alert('Failed to generate PDF. Please try again.')
        }
    }

    const addImage = () => {
        const url = prompt('Enter image URL:')
        if (url) {
            editor?.chain().focus().setImage({ src: url }).run()
        }
    }

    const uploadImage = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = (event) => {
                    const src = event.target?.result as string
                    const width = prompt('Enter image width in pixels (leave empty for 200px default):', '200')
                    const widthValue = width && !isNaN(Number(width)) ? Number(width) : 200

                    // Insert the image first
                    editor?.chain().focus().setImage({ src, alt: file.name }).run()

                    // Then update the HTML attributes via DOM manipulation
                    setTimeout(() => {
                        const images = document.querySelectorAll('.ProseMirror img.resume-image')
                        const lastImage = images[images.length - 1] as HTMLImageElement
                        if (lastImage) {
                            lastImage.style.width = `${widthValue}px`
                            lastImage.style.height = 'auto'
                        }
                    }, 100)
                }
                reader.readAsDataURL(file)
            }
        }
        input.click()
    }

    const addTextBox = () => {
        editor?.chain().focus().setDraggableTextBox({
            x: 100,
            y: 100,
            width: 200,
            height: 100
        }).run()
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '450px 1fr',
            gap: '1rem',
            maxWidth: '1600px',
            margin: '0 auto',
            height: '100%',
            overflow: 'hidden'
        }}>
            <div style={{
                height: '100%',
                overflowY: 'auto',
                paddingRight: '0.5rem'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'var(--background)',
                    zIndex: 10,
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem'
                }}>
                    <button onClick={saveProfile} className="secondary" style={{ flex: 1 }}>
                        <Save size={16} />
                        Save
                    </button>
                    <button onClick={loadProfile} className="secondary" style={{ flex: 1 }}>
                        <Upload size={16} />
                        Load
                    </button>
                    <button onClick={clearProfile} className="secondary danger" style={{ flex: 1 }}>
                        <RotateCcw size={16} />
                        Clear
                    </button>
                </div>

                <CollapsibleSection title="Page Settings">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label>Padding (px)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Top</label>
                                    <input
                                        type="number"
                                        value={padding.top}
                                        onChange={(e) => setPadding(p => ({ ...p, top: Number(e.target.value) }))}
                                        min="0"
                                        max="200"
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Bottom</label>
                                    <input
                                        type="number"
                                        value={padding.bottom}
                                        onChange={(e) => setPadding(p => ({ ...p, bottom: Number(e.target.value) }))}
                                        min="0"
                                        max="200"
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Left</label>
                                    <input
                                        type="number"
                                        value={padding.left}
                                        onChange={(e) => setPadding(p => ({ ...p, left: Number(e.target.value) }))}
                                        min="0"
                                        max="200"
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Right</label>
                                    <input
                                        type="number"
                                        value={padding.right}
                                        onChange={(e) => setPadding(p => ({ ...p, right: Number(e.target.value) }))}
                                        min="0"
                                        max="200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Contact Information">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label>Full Name *</label>
                            <input
                                value={profile.fullName}
                                onChange={(e) => updateField('fullName', e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label>Email *</label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => updateField('email', e.target.value)}
                                placeholder="john.doe@example.com"
                            />
                        </div>
                        <div>
                            <label>Phone *</label>
                            <input
                                value={profile.phone}
                                onChange={(e) => updateField('phone', e.target.value)}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>
                        <div>
                            <label>Location</label>
                            <input
                                value={profile.location}
                                onChange={(e) => updateField('location', e.target.value)}
                                placeholder="San Francisco, CA"
                            />
                        </div>
                        <div>
                            <label>LinkedIn</label>
                            <input
                                value={profile.linkedin}
                                onChange={(e) => updateField('linkedin', e.target.value)}
                                placeholder="linkedin.com/in/johndoe"
                            />
                        </div>
                        <div>
                            <label>Website/Portfolio</label>
                            <input
                                value={profile.website}
                                onChange={(e) => updateField('website', e.target.value)}
                                placeholder="johndoe.com"
                            />
                        </div>
                        <div>
                            <label>GitHub</label>
                            <input
                                value={profile.github}
                                onChange={(e) => updateField('github', e.target.value)}
                                placeholder="github.com/johndoe"
                            />
                        </div>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Professional Summary">
                    <textarea
                        value={profile.summary}
                        onChange={(e) => updateField('summary', e.target.value)}
                        rows={4}
                        placeholder="Brief overview of your professional background, key skills, and career objectives..."
                    />
                </CollapsibleSection>

                <CollapsibleSection title="Work Experience">
                    {profile.experiences.map((exp, idx) => (
                        <div key={exp.id} style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            backgroundColor: '#f8fafc'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <strong>Experience {idx + 1}</strong>
                                <button
                                    onClick={() => removeExperience(exp.id)}
                                    className="secondary danger icon-only"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <input
                                    value={exp.position}
                                    onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                                    placeholder="Job Title"
                                />
                                <input
                                    value={exp.company}
                                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                    placeholder="Company Name"
                                />
                                <input
                                    value={exp.location}
                                    onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                                    placeholder="Location"
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <input
                                        type="month"
                                        value={exp.startDate}
                                        onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                        placeholder="Start Date"
                                    />
                                    <input
                                        type="month"
                                        value={exp.endDate}
                                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                        placeholder="End Date"
                                        disabled={exp.current}
                                    />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={exp.current}
                                        onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                                        style={{ width: 'auto' }}
                                    />
                                    <span style={{ fontSize: '0.875rem' }}>Currently working here</span>
                                </label>
                                <textarea
                                    value={exp.description}
                                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                                    rows={3}
                                    placeholder="Key responsibilities and achievements..."
                                />
                            </div>
                        </div>
                    ))}
                    <button onClick={addExperience} className="secondary" style={{ width: '100%' }}>
                        <Plus size={16} />
                        Add Experience
                    </button>
                </CollapsibleSection>

                <CollapsibleSection title="Education">
                    {profile.education.map((edu, idx) => (
                        <div key={edu.id} style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            backgroundColor: '#f8fafc'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <strong>Education {idx + 1}</strong>
                                <button
                                    onClick={() => removeEducation(edu.id)}
                                    className="secondary danger icon-only"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <input
                                    value={edu.institution}
                                    onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                                    placeholder="Institution Name"
                                />
                                <input
                                    value={edu.degree}
                                    onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                    placeholder="Degree (e.g., Bachelor of Science)"
                                />
                                <input
                                    value={edu.field}
                                    onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                                    placeholder="Field of Study"
                                />
                                <input
                                    value={edu.location}
                                    onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                                    placeholder="Location"
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <input
                                        type="month"
                                        value={edu.graduationDate}
                                        onChange={(e) => updateEducation(edu.id, 'graduationDate', e.target.value)}
                                        placeholder="Graduation Date"
                                    />
                                    <input
                                        value={edu.gpa}
                                        onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                                        placeholder="GPA (optional)"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={addEducation} className="secondary" style={{ width: '100%' }}>
                        <Plus size={16} />
                        Add Education
                    </button>
                </CollapsibleSection>

                <CollapsibleSection title="Skills">
                    <textarea
                        value={profile.skills}
                        onChange={(e) => updateField('skills', e.target.value)}
                        rows={3}
                        placeholder="JavaScript, React, Node.js, Python, AWS, Docker..."
                    />
                </CollapsibleSection>

                <CollapsibleSection title="Projects" defaultOpen={false}>
                    {profile.projects.map((proj, idx) => (
                        <div key={proj.id} style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            backgroundColor: '#f8fafc'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <strong>Project {idx + 1}</strong>
                                <button
                                    onClick={() => removeProject(proj.id)}
                                    className="secondary danger icon-only"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <input
                                    value={proj.name}
                                    onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                                    placeholder="Project Name"
                                />
                                <textarea
                                    value={proj.description}
                                    onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                                    rows={2}
                                    placeholder="Project description and your role..."
                                />
                                <input
                                    value={proj.technologies}
                                    onChange={(e) => updateProject(proj.id, 'technologies', e.target.value)}
                                    placeholder="Technologies used (e.g., React, Node.js)"
                                />
                                <input
                                    value={proj.link}
                                    onChange={(e) => updateProject(proj.id, 'link', e.target.value)}
                                    placeholder="Project URL (optional)"
                                />
                            </div>
                        </div>
                    ))}
                    <button onClick={addProject} className="secondary" style={{ width: '100%' }}>
                        <Plus size={16} />
                        Add Project
                    </button>
                </CollapsibleSection>

                <CollapsibleSection title="Certifications" defaultOpen={false}>
                    {profile.certifications.map((cert, idx) => (
                        <div key={cert.id} style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            backgroundColor: '#f8fafc'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <strong>Certification {idx + 1}</strong>
                                <button
                                    onClick={() => removeCertification(cert.id)}
                                    className="secondary danger icon-only"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <input
                                    value={cert.name}
                                    onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                                    placeholder="Certification Name"
                                />
                                <input
                                    value={cert.issuer}
                                    onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                                    placeholder="Issuing Organization"
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <input
                                        type="month"
                                        value={cert.date}
                                        onChange={(e) => updateCertification(cert.id, 'date', e.target.value)}
                                        placeholder="Date Obtained"
                                    />
                                    <input
                                        value={cert.credentialId}
                                        onChange={(e) => updateCertification(cert.id, 'credentialId', e.target.value)}
                                        placeholder="Credential ID (optional)"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={addCertification} className="secondary" style={{ width: '100%' }}>
                        <Plus size={16} />
                        Add Certification
                    </button>
                </CollapsibleSection>

                <CollapsibleSection title="Languages" defaultOpen={false}>
                    {profile.languages.map((lang, idx) => (
                        <div key={lang.id} style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            backgroundColor: '#f8fafc',
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center'
                        }}>
                            <input
                                value={lang.language}
                                onChange={(e) => updateLanguage(lang.id, 'language', e.target.value)}
                                placeholder="Language"
                                style={{ flex: 1 }}
                            />
                            <select
                                value={lang.proficiency}
                                onChange={(e) => updateLanguage(lang.id, 'proficiency', e.target.value)}
                                style={{ flex: 1 }}
                            >
                                <option>Native</option>
                                <option>Fluent</option>
                                <option>Advanced</option>
                                <option>Intermediate</option>
                                <option>Basic</option>
                            </select>
                            <button
                                onClick={() => removeLanguage(lang.id)}
                                className="secondary danger icon-only"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    <button onClick={addLanguage} className="secondary" style={{ width: '100%' }}>
                        <Plus size={16} />
                        Add Language
                    </button>
                </CollapsibleSection>

                <CollapsibleSection title="AI Instructions">
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        rows={3}
                        placeholder="Additional instructions for AI (e.g., focus on leadership skills, tailor for tech industry)..."
                    />
                </CollapsibleSection>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button onClick={generate} disabled={loading} style={{ flex: 1 }}>
                        <Sparkles size={16} />
                        {loading ? 'Generating...' : 'Generate Resume'}
                    </button>
                    <button
                        onClick={() => {
                            const blankContent = `<h1>${profile.fullName || 'Your Name'}</h1><p><br/></p>`
                            editor?.commands.setContent(blankContent)
                        }}
                        className="secondary"
                    >
                        <FileText size={16} />
                        Start Blank
                    </button>
                </div>
            </div>

            <div className="card" style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Resume Preview</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => downloadResume('html')} disabled={!editor} className="secondary">
                            <Download size={16} />
                            HTML
                        </button>
                        <button onClick={() => downloadResume('md')} disabled={!generated} className="secondary">
                            <Download size={16} />
                            MD
                        </button>
                        <button onClick={downloadPDF} disabled={!editor}>
                            <Download size={16} />
                            PDF
                        </button>
                    </div>
                </div>

                <div className="divider" />

                <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    flexWrap: 'wrap',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--border)',
                    marginBottom: '0.75rem'
                }}>
                    <button
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        disabled={!editor}
                        className={`secondary icon-only ${editor?.isActive('bold') ? 'active' : ''}`}
                        title="Bold"
                    >
                        <Bold size={18} />
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        disabled={!editor}
                        className={`secondary icon-only ${editor?.isActive('italic') ? 'active' : ''}`}
                        title="Italic"
                    >
                        <Italic size={18} />
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().toggleUnderline().run()}
                        disabled={!editor}
                        className={`secondary icon-only ${editor?.isActive('underline') ? 'active' : ''}`}
                        title="Underline"
                    >
                        <UnderlineIcon size={18} />
                    </button>
                    <div style={{ width: '1px', backgroundColor: 'var(--border)', margin: '0 0.25rem' }} />
                    <button
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                        disabled={!editor}
                        className={`secondary icon-only ${editor?.isActive('heading', { level: 1 }) ? 'active' : ''}`}
                        title="Heading 1"
                    >
                        <Heading1 size={18} />
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        disabled={!editor}
                        className={`secondary icon-only ${editor?.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                        title="Heading 2"
                    >
                        <Heading2 size={18} />
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        disabled={!editor}
                        className={`secondary icon-only ${editor?.isActive('bulletList') ? 'active' : ''}`}
                        title="Bullet List"
                    >
                        <List size={18} />
                    </button>
                    <div style={{ width: '1px', backgroundColor: 'var(--border)', margin: '0 0.25rem' }} />
                    <button
                        onClick={uploadImage}
                        disabled={!editor}
                        className="secondary icon-only"
                        title="Insert Image"
                    >
                        <ImageIcon size={18} />
                    </button>
                    <button
                        onClick={addTextBox}
                        disabled={!editor}
                        className="secondary icon-only"
                        title="Add Text Box"
                    >
                        <Type size={18} />
                    </button>
                    <div style={{ width: '1px', backgroundColor: 'var(--border)', margin: '0 0.25rem' }} />
                    <button
                        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                        disabled={!editor}
                        className={`secondary icon-only ${editor?.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
                        title="Align Left"
                    >
                        <AlignLeft size={18} />
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                        disabled={!editor}
                        className={`secondary icon-only ${editor?.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
                        title="Align Center"
                    >
                        <AlignCenter size={18} />
                    </button>
                    <button
                        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                        disabled={!editor}
                        className={`secondary icon-only ${editor?.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
                        title="Align Right"
                    >
                        <AlignRight size={18} />
                    </button>
                </div>

                <div style={{
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    flex: 1,
                    overflowY: 'auto',
                    backgroundColor: '#f5f5f5',
                    position: 'relative'
                }}>
                    {/* Horizontal Ruler */}
                    <div style={{
                        position: 'sticky',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '30px',
                        backgroundColor: '#e8e8e8',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        zIndex: 100
                    }}>
                        {Array.from({ length: 21 }).map((_, i) => {
                            const position = i * 50
                            return (
                                <div key={i} style={{
                                    position: 'absolute',
                                    left: `${position}px`,
                                    height: i % 2 === 0 ? '12px' : '8px',
                                    width: '1px',
                                    backgroundColor: '#666',
                                    bottom: 0
                                }}>
                                    {i % 2 === 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '2px',
                                            left: '3px',
                                            fontSize: '9px',
                                            color: '#666'
                                        }}>
                                            {position}
                                        </span>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Vertical Ruler */}
                    <div style={{
                        position: 'absolute',
                        top: '30px',
                        left: 0,
                        bottom: 0,
                        width: '30px',
                        backgroundColor: '#e8e8e8',
                        borderRight: '1px solid var(--border)',
                        zIndex: 99
                    }}>
                        {Array.from({ length: 30 }).map((_, i) => {
                            const position = i * 50
                            return (
                                <div key={i} style={{
                                    position: 'absolute',
                                    top: `${position}px`,
                                    width: i % 2 === 0 ? '12px' : '8px',
                                    height: '1px',
                                    backgroundColor: '#666',
                                    right: 0
                                }}>
                                    {i % 2 === 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            left: '2px',
                                            top: '3px',
                                            fontSize: '9px',
                                            color: '#666',
                                            transform: 'rotate(-90deg)',
                                            transformOrigin: 'left top'
                                        }}>
                                            {position}
                                        </span>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Editor Content with Padding */}
                    <div style={{
                        marginLeft: '30px',
                        marginTop: '30px',
                        padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
                        backgroundColor: 'white',
                        minHeight: 'calc(100% - 30px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </div>
        </div>
    )
}
