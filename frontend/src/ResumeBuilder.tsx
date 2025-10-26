import { useState } from 'react'

type Profile = {
    name?: string
    title?: string
    summary?: string
    experience?: string
    skills?: string
    education?: string
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

    function downloadResume() {
        const blob = new Blob([generated], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${profile.name || 'resume'}.md`
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
                        setGenerated(`# ${profile.name || 'Name'}\n\n`)
                    }}>Start Blank</button>
                </div>
            </section>

            <section style={{ padding: '1rem', border: '1px solid #eee', borderRadius: 8 }}>
                <h2>Generated Resume (editable)</h2>
                <div style={{ marginBottom: '0.5rem' }}>
                    <button onClick={downloadResume} disabled={!generated}>Download .md</button>
                </div>
                <textarea value={generated} onChange={(e) => setGenerated(e.target.value)} style={{ width: '100%', height: '70vh' }} />
            </section>
        </div>
    )
}
