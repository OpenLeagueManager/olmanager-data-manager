# OLManager Data Manager

A Next.js web application for browsing, exploring, and proposing changes to OLManager game data. Built with Next.js 16, React 19, Tailwind CSS 4, and TypeScript.

## What it does

- **Browse** 43 competitions, 345+ teams, 1,600+ players, and staff across all LoL leagues
- **Search and filter** with text search, column filters (position, tier, nationality, competition), and multi-column sort
- **Explore** player attributes, OVR ratings, natural vs current positions, market values, and contracts
- **Propose changes** via typed, validated proposal forms with pre-filled current data
- **Review diffs** deterministically computed between current state and proposed changes
- **Dark mode** toggle with system preference detection and localStorage persistence

## Quick start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Authentication

Sign-in uses **Discord OAuth** via [Auth.js](https://authjs.dev). Contributors log in with their Discord account to identify themselves. A separate **GitHub App** handles bot actions (creating issues and PRs in the data repository).

To enable Discord auth locally:

1. Create a **Discord Application** at https://discord.com/developers/applications
   - Redirect URL: `http://localhost:3000/api/auth/callback/discord`
2. Copy `.env.local.example` to `.env.local` and fill in:
   ```bash
   AUTH_DISCORD_ID=your_client_id
   AUTH_DISCORD_SECRET=your_client_secret
   ```
3. The `AUTH_SECRET` is auto-generated. Regenerate with `openssl rand -base64 32`.
4. Restart the dev server — the Topbar will show "Sign in with Discord".

Without Discord credentials, the app works fully for local data exploration. Auth is only needed for the upcoming proposal persistence / GitHub integration.

## Available commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run test:run` | Run all tests (vitest) |
| `npm run lint` | Run ESLint |

## Data sources

Game data is stored in the **[olmanager-data](https://github.com/OpenLeagueManager/olmanager-data)** repository and linked as a git submodule at `src/data/`. To update data after cloning:

```bash
git submodule update --init --remote
```

Each competition manifest declares its `teams_file` and `players_file` for automatic association. Data is loaded at build time via `fs` + React `cache()`.

## Architecture

The app follows a clean layered architecture:

```
src/
├── app/              # Next.js App Router pages and layouts
│   ├── (data)/       # Data explorer routes (/data/*)
│   └── (proposals)/  # Proposal workbench routes (/proposals/*)
├── components/       # UI primitives (DataTable, Badge, Button, Select, etc.)
│   └── layout/       # Shell, Sidebar, Topbar, ThemeToggle
├── domain/proposals/ # Domain logic (types, validation, diff, review state)
├── features/proposals/ # Proposal UI (forms, routes, session store)
├── lib/              # Shared utilities
│   ├── data/         # Data accessors (competitions, teams, players, etc.)
│   └── olmanager/    # Data loader layer (fs-based JSON reader, types, rating)
└── types/            # TypeScript declaration files
```

### Data repository

Game data lives in a **separate repository** — [OpenLeagueManager/olmanager-data](https://github.com/OpenLeagueManager/olmanager-data) — linked as a git submodule at `src/data/`. This separation means:

- **Data changes don't redeploy the app** — the app is deployed independently
- **Data has its own audit trail** — `git log` in the data repo shows every change
- **OLManager consumes the same data** — the game can link the same submodule
- **Permissions are separate** — data maintainers don't need app code access

To clone with data:
```bash
git clone --recurse-submodules git@github.com:OpenLeagueManager/olmanager-data-manager.git
```

### Key patterns

- **Server Components** handle data fetching. **Client Components** handle interactivity (DataTable, forms, theme toggle). Pre-computed data is passed across the boundary as serializable props.
- **DataTable** supports text search, column filters (dropdowns auto-extracted from data), and three-state sort (asc → desc → none).
- **Proposal validation** uses a typed validator factory that closes over game data for domain-specific checks (entity existence, attribute ranges, role validation).
- **Theme** uses Tailwind CSS 4 with `@custom-variant dark` and `next-themes` for the toggle.

## Proposal types

| Type | Description |
|------|-------------|
| AddPlayer | Create a new player record |
| EditPlayer | Modify an existing player's profile or attributes |
| TransferPlayer | Move a player between teams |
| ReleasePlayer | Record a player release with reason and severance |
| AddStaff | Create a new staff member |
| EditStaff | Modify a staff member's role, wage, or attributes |
| ReleaseStaff | Record a staff release |
| EditTeam | Modify team budget, focus, or identity |
| RemoveTeam | Record a team removal |
| EditCompetition | Modify competition name, logo, tier, or active state |
| RemoveCompetition | Record a competition removal |
| AddSocialAccount | Create a social media account |
| EditSocialTemplate | Modify a social post template |
| AddNewsTemplate | Create a news storyline template |

All proposals are validated against the current game data. Diffs are computed deterministically between the current state and the proposed changes.

## Current limitations

This is a **local data exploration and proposal drafting tool**. The following are intentionally not implemented:

- **No authentication** — Discord OAuth and role checks are not wired
- **No persistence** — proposals live in `sessionStorage` (browser tab only, cleared on close)
- **No backend** — no database, no API, no GitHub integration
- **No production workflow** — review decisions are stubs; approving a proposal does not write data back

The MVP boundary is clearly marked in the UI. This app is designed for maintainers to draft, validate, and review data changes locally before manually applying them to the upstream data repository.

## Adding or updating game data

1. Add or update JSON files in `src/data/` following the existing schema
2. If adding a new competition, create `src/data/competitions/<id>/manifest.json` with `teams_file` and `players_file` fields
3. Rebuild: `npm run build`
4. The data explorer will automatically pick up new files

## Tech stack

- **Framework**: Next.js 16.2 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS 4
- **Language**: TypeScript
- **Testing**: Vitest + Testing Library
- **Theme**: next-themes (class strategy)
- **Data**: Local JSON files loaded via `fs` + React `cache()`
