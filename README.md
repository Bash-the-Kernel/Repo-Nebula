# Repo-Nebula: AI Codebase Visualizer

Initial full-stack scaffold for an AI-powered codebase architecture visualizer.

## What is implemented

- Monorepo workspace with `frontend`, `backend`, and `shared` packages
- Backend repository ingestion from GitHub URL (clone to local storage)
- Basic JavaScript/TypeScript dependency graph generation using AST parsing
- REST endpoints for graph, insights, and summary retrieval
- Frontend Next.js UI to submit repository URL and navigate analysis flow
- React Flow architecture viewer page
- Insights page with metrics and summary panel

## Workspace structure

```text
.
|-- backend/
|   |-- src/
|   |   |-- analysis/
|   |   |-- models/
|   |   |-- routes/
|   |   `-- services/
|-- frontend/
|   |-- components/
|   |-- lib/
|   |-- pages/
|   `-- styles/
|-- shared/
|   `-- src/
`-- package.json
```

## API endpoints

- `POST /api/repositories` submit `{ repoUrl }`
- `GET /api/repositories/:id` get repository metadata
- `POST /api/analyze/:id` trigger analysis for repository
- `GET /api/graph/:id` get dependency graph JSON
- `GET /api/insights/:id` get analysis metrics
- `GET /api/summary/:id` get generated architecture summary

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start backend in one terminal:

```bash
npm run dev:backend
```

3. Start frontend in another terminal:

```bash
npm run dev:frontend
```

4. Open `http://localhost:3000`

The frontend points to `http://localhost:4000` by default. Override with `NEXT_PUBLIC_API_BASE_URL` if needed.

## Notes

- Analysis currently focuses on JavaScript/TypeScript imports and CommonJS requires.
- Repository and analysis metadata are stored in memory in this initial scaffold.
- AI summary endpoint currently returns a generated heuristic summary and is ready for OpenAI integration.
