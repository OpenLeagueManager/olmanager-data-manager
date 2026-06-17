# OLManager Data Manager

OLManager Data Manager is a Next.js web app for managing community-maintained OLManager database contributions.

The app will let Discord-authenticated contributors create typed data proposals for players, teams, competitions, staff, and assets. Maintainers and directors will review validated proposals before they are merged into OLManager's game data repository.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run checks:

```bash
npm run lint
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Architecture

The initial architecture baseline and first-slice MVP boundary are documented in [docs/architecture.md](docs/architecture.md).

## Current Scope

This repository currently contains the Next.js scaffold and architecture documentation only. Discord OAuth, Discord role checks, GitHub App operations, proposal persistence, and OLManager ZIP export integration are intentionally not implemented yet.
