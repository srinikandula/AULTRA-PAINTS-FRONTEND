# Repository Guidelines

This is the React + Vite + TypeScript + Tailwind + shadcn web portal for Aultra Paints. It was migrated from Angular 18 on 2026-04-26; see the spec at `docs/superpowers/specs/2026-04-26-frontend-react-vite-migration-design.md` in the parent `aultra_paints/` directory for context.

## Stack
- React 18 · Vite 5 · TypeScript 5.5 (strict)
- Tailwind 3 · shadcn/ui (Radix primitives)
- TanStack Query v5 (all server state)
- Zustand (auth + persisted client state)
- React Router v6 (eager-loaded routes — no lazy())
- react-hook-form + zod (every form)
- Recharts (charts)
- sonner (toasts) · lucide-react (icons)
- Native `fetch` wrapped by `src/lib/api.ts`

## Project Structure
- `src/App.tsx` mounts the providers (QueryClient, BrowserRouter, Toaster).
- `src/routes.tsx` holds the entire route table. Add new routes here.
- `src/lib/`: `api.ts` (fetch wrapper + JWT header injection + 401 redirect), `auth.ts` (JWT decode + expiry), `utils.ts` (shadcn `cn` helper).
- `src/stores/`: zustand stores. Currently only `auth-store.ts`.
- `src/components/ui/`: shadcn primitives — owned by the repo (not a dep). Add new ones with `npx shadcn@latest add <component>`.
- `src/components/layout/`: AppLayout, Sidebar, Header, ProtectedRoute, RoleGate, NoAuthRoute.
- `src/features/<area>/`: one folder per feature. Contents typically: `<screen>.tsx`, `hooks.ts` (TanStack Query hooks), feature-specific types if not shared.
- `src/types/`: types shared across >=2 features.

## Conventions
- 2-space indent, single quotes, semicolons, trailing commas (Prettier defaults + `prettier-plugin-tailwindcss` for class sorting).
- Path alias: `@/` resolves to `src/`. Use it everywhere.
- TS strict mode; no `any` in new code (prefer `unknown` + narrowing).
- File names: `kebab-case.tsx`. Component names: `PascalCase`. Hook names: `camelCase` starting with `use`.
- Query keys: `[feature, resource, params?]`. Example: `['products', 'list', { page, limit }]`.
- Mutations: invalidate the relevant list query in `onSuccess`. Never call `refetch()` from a component manually.
- Forms: react-hook-form + zod, paired with shadcn `<Form>`. One schema per form, defined adjacent to the component.
- API errors: thrown by `api()` as `{ status, code?, message }`. Render via `toast.error(e.message)`.
- Image uploads: file inputs go through `compressImage()` from `@/lib/compress-image` before being sent. Target ceiling is **6 MB** of resulting base64 data URI (~5 MB original photo) to stay under the backend's `8mb` JSON body limit. If you change the target, sync the backend's `bodyParser.json({ limit })` value too.

## Build, Test, and Development
- `npm install` (no flags required — `.npmrc` with `legacy-peer-deps` was removed after the Angular cutover).
- `npm run dev`: dev server on :4200.
- `npm run typecheck`: zero-error baseline. Run before every PR.
- `npm run lint`: ESLint clean.
- `npm run build && npm run preview`: production build smoke test.

## Conventions for new features
- One feature folder per Angular feature area or new business area.
- Reuse shadcn primitives from `src/components/ui/`. If a needed primitive isn't installed, `npx shadcn@latest add <name>` and commit `components.json` + the new file under `src/components/ui/`.
- Stay role-aware: route guards live in `src/components/layout/role-gate.tsx`. Add new role-gated routes via `<RoleGate roles={[...]}>` inside `routes.tsx`.

## Commit & Pull Request Guidelines
- Conventional commit prefixes: `feat(area): ...`, `fix(area): ...`, `chore: ...`, `docs: ...`, `refactor: ...`.
- One PR per feature area or per cross-cutting change. Don't bundle unrelated edits.
- PR description: list affected routes, screenshot of any UI change, evidence of `npm run typecheck && npm run lint && npm run build` passing.

## Out of scope (as of 2026-04-26)
- Unit / e2e tests — establish a testing pattern as a separate follow-up.
- Internationalization — `@angular/localize` was removed; reintroduce only when required.
- Lazy loading / route-level code splitting — possible later via `React.lazy()` + `Suspense`.
- SSR.
