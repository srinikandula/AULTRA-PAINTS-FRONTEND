# Aultra Paints — Web Portal

Admin / SuperUser / SalesExecutive interface to the Aultra Paints backend.

## Stack

React 18 · Vite 5 · TypeScript 5.5 · Tailwind 3 · shadcn/ui · TanStack Query · Zustand · React Router v6 · react-hook-form + zod · Recharts · sonner · lucide-react.

## Getting started

~~~
npm install
npm run dev      # http://localhost:4200
~~~

Set `VITE_API_URL` in a `.env.development` / `.env.production` / `.env.qa` file pointing at the backend (default: `http://localhost:4300/api/`).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server on :4200 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the `dist/` build locally |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Layout

~~~
src/
├── App.tsx
├── routes.tsx           # route table + guards
├── lib/                 # api client, JWT helpers, cn() util
├── stores/              # zustand stores (auth)
├── components/
│   ├── ui/              # shadcn primitives
│   └── layout/          # AppLayout, Sidebar, Header, ProtectedRoute, RoleGate
├── features/            # one folder per feature area
└── types/               # shared types
~~~

See `AGENTS.md` for conventions and `CLAUDE.md` for Claude-Code-specific guidance.
