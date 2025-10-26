import express from 'express'
import cors from 'cors'

// LangChain (JS) imports
import { Ollama } from 'langchain/llms/ollama'
import { PromptTemplate } from 'langchain/prompts'
import { LLMChain } from 'langchain/chains'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3001
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2'

// Create an Ollama LLM instance via LangChain
const llm = new Ollama({ baseUrl: OLLAMA_URL, model: OLLAMA_MODEL })

const prompt = new PromptTemplate({
    inputVariables: ['profile', 'instructions'],
    template: `You are professional resume builder.
{instructions}

Profile:
{profile}

Please produce a clean, ATS-friendly resume in markdown. Use sections for Summary, Experience, Skills, and Education. Prioritize clarity and achievements.`,
})

const chain = new LLMChain({ llm, prompt })

app.get('/', (_req, res) => res.send('Resume Builder backend running'))

app.post('/api/generate', async (req, res) => {
    try {
        const { profile, instructions } = req.body
        console.log('Received payload:', JSON.stringify(req.body, null, 2))
        const profileText = typeof profile === 'string' ? profile : JSON.stringify(profile, null, 2)

        const result = await chain.call({ profile: profileText, instructions: instructions || '' })

        // LangChain LLMChain result usually has a `text` property (or `text` inside result)
        const text = result?.text ?? result?.output_text ?? JSON.stringify(result)
        res.json({ success: true, text })
    } catch (err) {
        console.error('generate error', err)
        res.status(500).json({ success: false, error: String(err) })
    }
})

app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`))
