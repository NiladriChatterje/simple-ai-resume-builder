# AI Resume Builder

A real-time AI-powered resume builder using LangChain and Ollama. Generate professional resumes with AI assistance and manually edit them as needed.

## Features

- **AI-Powered Generation**: Uses LangChain with Ollama to generate professional, ATS-friendly resumes
- **Real-time Processing**: Generates resumes instantly based on your profile input
- **Manual Editing**: Full editing capability for the generated resume in markdown format
- **Professional Prompt**: Uses "You are professional resume builder" template for optimal results
- **Download Support**: Export your resume as a markdown file
- **Customizable Instructions**: Provide specific instructions to tailor the resume generation

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Ollama** - Install from [ollama.ai](https://ollama.ai)
3. **Ollama Model** - Pull a model (e.g., `ollama pull llama2` or `ollama pull llama3.2`)

## Setup

### 1. Install Ollama and Pull a Model

```powershell
# Install Ollama from https://ollama.ai
# Then pull a model
ollama pull llama2
```

### 2. Backend Setup

```powershell
cd backend
npm install
npm start
```

The backend will run on `http://localhost:3001`

**Environment Variables** (optional):
- `OLLAMA_URL` - Ollama API URL (default: `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` - Model name (default: `llama2`)
- `PORT` - Backend port (default: `3001`)

### 3. Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. **Fill in Profile Information**:
   - Name, Title, Summary
   - Experience (bullet points or detailed description)
   - Skills (comma-separated)
   - Education

2. **Customize Prompt Instructions**:
   - Modify the default instruction to tailor the resume style
   - Example: "Create a technical resume focused on software development"

3. **Generate Resume**:
   - Click "Generate" to create an AI-powered resume
   - Or click "Start Blank" to manually write from scratch

4. **Edit Manually**:
   - The generated resume appears in the right panel
   - Edit directly in the textarea to refine the content

5. **Download**:
   - Click "Download .md" to save your resume as a markdown file

## Architecture

### Backend ([`backend/server.js`](backend/server.js))
- Express server with CORS support
- LangChain integration with Ollama LLM
- Professional prompt template for resume generation
- POST `/api/generate` endpoint for resume generation

### Frontend ([`frontend/src/ResumeBuilder.tsx`](frontend/src/ResumeBuilder.tsx))
- React + TypeScript with Vite
- Two-panel layout: Profile input and Resume preview/editor
- Real-time generation with loading states
- Editable textarea for manual adjustments
- Download functionality for markdown export

## API Endpoint

### POST `/api/generate`

**Request Body**:
```json
{
  "profile": {
    "name": "John Doe",
    "title": "Software Engineer",
    "summary": "Experienced developer...",
    "experience": "- 5 years at Company X...",
    "skills": "JavaScript, React, Node.js",
    "education": "BS Computer Science"
  },
  "instructions": "Create a clear, concise resume tailored to the target job."
}
```

**Response**:
```json
{
  "success": true,
  "text": "# John Doe\n\n## Software Engineer\n\n..."
}
```

## Project Structure

```
resume-builder/
├── backend/
│   ├── server.js          # Express server with LangChain + Ollama
│   ├── package.json       # Backend dependencies
│   └── README.md          # Backend documentation
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # Main application component
│   │   ├── ResumeBuilder.tsx  # Resume builder component
│   │   └── main.tsx       # Entry point
│   ├── package.json       # Frontend dependencies
│   └── vite.config.ts     # Vite configuration
└── README.md              # This file
```

## Technologies Used

- **Backend**: Express.js, LangChain, Ollama
- **Frontend**: React, TypeScript, Vite
- **AI**: Ollama (local LLM inference)

## Troubleshooting

### Ollama Connection Issues
- Ensure Ollama is running: `ollama serve`
- Verify the model is pulled: `ollama list`
- Check the backend logs for connection errors

### Frontend Cannot Connect to Backend
- Verify backend is running on port 3001
- Check CORS configuration in [`backend/server.js`](backend/server.js)
- Update `VITE_BACKEND_URL` if using a different backend URL

### Model Not Found
- Pull the model: `ollama pull llama2`
- Or set `OLLAMA_MODEL` environment variable to your installed model

## License

MIT