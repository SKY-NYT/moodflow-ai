# MoodFlow AI

A polished mood journal app built with Vite, React, TypeScript, Tailwind CSS, and Zustand.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS via the Vite plugin
- Zustand for state management
- Vercel Functions for the backend endpoint
- OpenRouter API for AI reflections

## Run locally (frontend only)

```bash
npm install
npm run dev
```

## Run backend locally with Vercel

Use this in a second terminal so your API works on port `3000`.

```bash
npm run backend:dev
```

### Recommended: run the full app (frontend + backend)

```bash
npm run dev:full
```

Notes:

- `npm run dev` starts frontend at `localhost:5173`.
- `npm run backend:dev` starts Vercel Functions at `localhost:3000`.
- The Vite proxy forwards `/api/*` from `:5173` to `:3000`.
- Check backend health at `http://localhost:3000/api/health`.

## Environment variables

Create a local `.env` file for Vercel Functions development:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
# optional
OPENROUTER_MODEL=openrouter/auto
```

## Deploy to Vercel

1. Push the project to GitHub.
2. Import the repo into Vercel.
3. Add `OPENROUTER_API_KEY` in Project Settings -> Environment Variables.
4. Redeploy the project.

Vercel will automatically deploy files inside the root `api/` directory as serverless functions.
The frontend calls `/api/reflect`, which keeps your provider key off the client.

## AI flow

- Frontend sends recent journal entries to `/api/reflect`
- Vercel Function calls OpenRouter
- The function returns a concise reflection back to the UI

## Notes

- Do not use `VITE_OPENROUTER_API_KEY` for production. That would expose your key in the browser bundle.
- The current UI is preserved; only the AI wiring was changed so it works safely for a Vercel deployment.
