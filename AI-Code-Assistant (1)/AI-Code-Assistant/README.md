# AI Code Assistant

An AI-powered programming companion: chat, code generation, debugging,
explanation, optimization, complexity analysis, language conversion,
documentation generation, and security scanning — behind a cyberpunk-styled
dashboard.

This is a **scaffold**: the full UI and API surface are built and wired
together, and every endpoint runs out of the box with clearly-labeled mock
responses. Point it at a real AI provider (Gemini, OpenAI, or a local Ollama
model) by adding one API key — no code changes needed for that step.

## Project structure

```
AI-Code-Assistant/
├── backend/
│   ├── main.py              # FastAPI app + CORS + router registration
│   ├── database.py          # SQLAlchemy engine/session, init_db()
│   ├── routes/               # /chat, /generate-code, /debug-code, /history ...
│   ├── services/
│   │   └── ai_service.py    # Provider-agnostic ask_ai() — Gemini/OpenAI/Ollama/mock
│   ├── models/               # User, Chat, Project, History (SQLAlchemy)
│   ├── utils/                 # helpers (code-fence stripping, language guess)
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── index.html            # Dashboard shell: sidebar, top nav, all module views
│   ├── css/style.css         # Visual identity (see below)
│   ├── js/
│   │   ├── api.js            # fetch wrapper for the backend
│   │   ├── editor.js         # Monaco editor bootstrap
│   │   ├── app.js            # navigation, module actions, chat, history
│   │   └── particles.js      # ambient particle background
│   ├── assets/
│   └── components/           # placeholder if you later split into a framework
│
├── database/                 # app.db (SQLite) is created here at runtime
└── uploads/
```

## Running it

**Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # optional — add a real API key to go live
uvicorn main:app --reload --port 8000
```
Visit `http://localhost:8000/docs` for interactive API docs (Swagger UI).

**Frontend**
Just open `frontend/index.html` in a browser, or serve it statically:
```bash
cd frontend
python3 -m http.server 5500
```
Then visit `http://localhost:5500`. The frontend defaults to
`http://localhost:8000` for the API — change this in **Settings** inside the
app if your backend runs elsewhere (it's saved to `localStorage`).

## Connecting a real AI provider

Everything routes through `backend/services/ai_service.py::ask_ai()`. Set
**one** of these in `backend/.env` and restart the server:

| Provider | Env vars |
|---|---|
| Google Gemini | `GEMINI_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| Ollama (local) | `OLLAMA_HOST` |

With none set, every endpoint still returns a clearly labeled mock response,
so the UI, database, and API contract are fully testable without a key.

## API endpoints

```
POST   /chat
POST   /generate-code
POST   /explain-code
POST   /debug-code
POST   /optimize-code
POST   /complexity
POST   /convert-code
POST   /generate-docs
POST   /security-scan
POST   /generate-project
GET    /history
DELETE /history
GET    /            (status/health check)
```

## Design identity

- **Palette** — near-black navy background, glass panels, blue/cyan/purple neon accents.
- **Type** — Chakra Petch for headings and UI labels, Inter for body copy, JetBrains Mono for code.
- **Signature element** — a slow rotating conic-gradient "scan" ring around the editor/response panels, paired with a drifting particle field and soft aurora background.

## What's stubbed vs. real

- ✅ Real: FastAPI routing, SQLAlchemy models + SQLite persistence, Monaco editor, all 12 dashboard modules wired end-to-end, history logging, CORS, settings.
- 🧩 Stubbed (by design, until you add a key): the actual LLM call. `ask_ai()`
  auto-detects a configured provider; until then it returns a mock so you can
  build/test the rest of the product.
- 🚧 Not built in this pass: user auth, voice commands, ZIP export, drag-reorder
  favorites — noted in the spec but left as follow-ups so the core flows ship
  solid first.
