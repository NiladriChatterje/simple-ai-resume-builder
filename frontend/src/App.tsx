import './App.css'
import ResumeBuilder from './ResumeBuilder.tsx'

function App() {
  return (
    <div className="App">
      <header style={{ padding: '1rem' }}>
        <h1>AI Resume Builder</h1>
        <p style={{ marginTop: 0 }}>Generate resumes using LangChain + Ollama. Edit the result manually below.</p>
      </header>
      <main style={{ padding: '1rem' }}>
        <ResumeBuilder />
      </main>
    </div>
  )
}

export default App
