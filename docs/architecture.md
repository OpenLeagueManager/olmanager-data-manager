# Architecture Baseline

## Purpose

OLManager Data Manager is a separate web application that supports OLManager's community-maintained database. Its core purpose is to let contributors create structured, reviewable data proposals before maintainers approve changes for inclusion in the game.

## Domain Model

Contributors do not edit raw JSON. They create typed proposals that capture intent, validation rules, and reviewable diffs.

Initial proposal types:

- `AddPlayer`
- `EditPlayerAttributes`
- `EditPlayerBio`
- `TransferPlayer`
- `AddTeam`
- `EditTeam`
- `AddCompetition`
- `EditCompetitionSchedule`
- `UploadPlayerPhoto`
- `UploadTeamLogo`

Future staff-related proposals should follow the same typed-proposal model once the staff data contract is defined.

## Identity And Governance

The app will use Discord OAuth and Discord roles for contributor identity and authorization. It will not provide first-party accounts.

Repository operations will be performed by a GitHub App or bot, not by storing contributor GitHub credentials.

The app should store only the minimum data needed for governance and auditability:

- Discord user identifiers needed to associate proposals with contributors.
- Proposal identifiers and timestamps.
- Review, approval, and rejection metadata.
- Branch, pull request, commit, or export metadata produced by the GitHub App flow.

Privacy and retention implications must be documented before implementing persistence. The system should define how long Discord identifiers, proposal history, review metadata, and uploaded assets are retained.

## Integration Target

Approved data must remain compatible with OLManager's existing data and import architecture:

- `data/competitions/*/manifest.json`
- `data/players/*_players.json`
- `data/teams/*_teams.json`
- `public/player-photos`
- `public/teams-icons`
- `OLMDBManager` ZIP import/export flow

The web app should validate proposed changes against those target shapes before any branch, pull request, commit, or export is produced.

## Proposal Flow

1. A contributor authenticates with Discord.
2. The contributor creates a typed proposal through guided forms.
3. The app runs schema and business validation.
4. The app generates a human-readable diff.
5. Maintainers or directors with the required Discord roles review the proposal.
6. On approval, a GitHub App creates a branch and pull request, or commits through an approved path.
7. CI validates the resulting OLManager data.
8. A ZIP export is generated for the OLManager importer.

## First-Slice MVP Boundary

The first implementation slice should prove the proposal workflow without building every integration at once.

Included in the first slice:

- Next.js App Router foundation with TypeScript, ESLint, Tailwind, and a `src` directory.
- Typed proposal definitions for a small subset, starting with `AddPlayer`, `EditPlayerAttributes`, and `TransferPlayer`.
- Form-driven proposal creation with schema validation.
- Human-readable diff generation against fixture data that mirrors OLManager's current data shape.
- Review states for draft, submitted, approved, and rejected proposals.
- Architecture and privacy documentation before real persistence is introduced.

Excluded from the first slice:

- Discord OAuth implementation.
- Discord role synchronization.
- GitHub App installation or repository writes.
- Production persistence.
- Asset upload storage.
- ZIP export generation.

These exclusions are intentional. The first slice should validate the typed-proposal model and review experience before integrating external identity, repository automation, or import/export tooling.
