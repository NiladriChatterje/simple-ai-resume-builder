import './App.css'
import ResumeBuilder from './ResumeBuilder.tsx'
import { FileText } from 'lucide-react'

function App() {
  return (
    <div style={{
      height: '100vh',
      backgroundColor: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <header style={{
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '1rem 2rem',
        boxShadow: 'var(--shadow-sm)',
        flexShrink: 0
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <FileText size={28} color="var(--primary-color)" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
              AI Resume Builder
            </h1>
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontWeight: 400
            }}>
              Create professional, ATS-friendly resumes with AI assistance
            </p>
          </div>
        </div>
      </header>
      <main style={{
        flex: 1,
        overflow: 'hidden',
        padding: '1rem'
      }}>
        <ResumeBuilder />
      </main>
      <footer style={{
        textAlign: 'center',
        padding: '0.75rem 1rem',
        color: 'var(--text-secondary)',
        fontSize: '0.75rem',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        flexShrink: 0
      }}>
        <p style={{ margin: 0 }}>Powered by LangChain + Ollama | Built with React + TypeScript</p>
      </footer>
    </div>
  )
}

export default App
