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
    template: `You are a professional resume builder with expertise in creating visually appealing, ATS-friendly resumes.

{instructions}

Profile Data:
{profile}

CRITICAL RULES:
1. Generate ONLY the resume content - NO notes, conclusions, explanations, or meta-commentary
2. Do NOT add phrases like "Note:", "Conclusion:", "Here is", or any other explanatory text
3. Start directly with the person's name as the main header
4. End with the last section of the resume - do NOT add any closing remarks

FORMATTING REQUIREMENTS:
1. Use proper markdown formatting with headers (# for main title, ## for sections, ### for subsections)
2. Use **bold** for important items like job titles, company names, and key achievements
3. Use bullet points (- ) for listing responsibilities and achievements
4. Include appropriate spacing between sections for readability
5. Format dates clearly (e.g., "Jan 2020 - Present" or "Jan 2020 - Dec 2022")
6. Use *italics* for emphasis where appropriate
7. Create a professional structure with clear sections

REQUIRED SECTIONS (if data is available):
- # [Full Name] (as main header)
- Contact information (email, phone, location, LinkedIn, GitHub, website)
- ## Professional Summary
- ## Work Experience (with company, position, dates, and bullet points for achievements)
- ## Education (with institution, degree, dates)
- ## Skills (organized by category if possible)
- ## Projects (if applicable)
- ## Certifications (if applicable)
- ## Languages (if applicable)

Generate ONLY the resume content - nothing else.`,
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

app.post('/api/enhance-text', async (req, res) => {
    try {
        const { text, context } = req.body

        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, error: 'Text is required' })
        }

        console.log('Enhancing text:', text)

        const enhancePrompt = new PromptTemplate({
            inputVariables: ['text', 'context'],
            template: `You are a professional resume writer. Transform the following text into a professional, concise, and impactful statement suitable for a resume.

Context: {context}
Original text: {text}

Requirements:
1. Make it professional and achievement-oriented
2. Use strong action verbs
3. Keep it concise (1-3 sentences)
4. Quantify achievements when possible
5. Focus on impact and results
6. Use industry-standard terminology

Return ONLY the enhanced text without any explanations, additional commentary, or formatting markers.`
        })

        const enhanceChain = new LLMChain({ llm, prompt: enhancePrompt })
        const result = await enhanceChain.call({ text, context: context || 'resume description' })

        let enhancedText = result?.text ?? result?.output_text ?? text

        // Clean up the response - remove any markdown code blocks or extra formatting
        enhancedText = enhancedText.trim()
            .replace(/^```.*\n?/gm, '')  // Remove code block markers
            .replace(/```$/gm, '')         // Remove closing code blocks
            .replace(/^\s*["']|["']\s*$/g, '')  // Remove surrounding quotes

        console.log('Enhanced text result:', enhancedText)

        res.json({ success: true, text: enhancedText })
    } catch (err) {
        console.error('enhance-text error', err)
        res.status(500).json({ success: false, error: String(err.message || err) })
    }
})

app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`))
