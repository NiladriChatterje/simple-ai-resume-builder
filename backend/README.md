# Resume Builder Backend

This backend exposes a single endpoint POST `/api/generate` that calls an Ollama model through LangChain to generate a resume.

Setup

1. Install dependencies

```powershell
cd backend
npm install
```

2. Run the server

```powershell
npm start
```

Environment

- `OLLAMA_URL` - URL of your running Ollama API (defaults to `http://127.0.0.1:11434`).
- `OLLAMA_MODEL` - Ollama model name to use (defaults to `llama2`). You can use any Ollama model like `llama2`, `llama3.2`, `mistral`, etc.

Request

POST /api/generate

JSON body: { profile: { name, title, summary, experience, skills, education }, instructions }

Response: { success: true, text: "<generated markdown>" }

Notes

- This uses the `langchain` Ollama LLM binding. If you prefer to call the Ollama HTTP API directly, swap the implementation in `server.js`.
