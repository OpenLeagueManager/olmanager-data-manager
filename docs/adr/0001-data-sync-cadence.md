# ADR 0001: OpenLeagueManager Data Sync Cadence

## Status

Accepted

## Context

`olmanager-data-manager` mirrors OpenLeagueManager (OLManager) domain shapes so contributors can review data proposals against the real game runtime. The canonical source lives under `data/` and is tracked in this repository. OLManager continues to evolve, so we need an explicit cadence for keeping the data manager aligned without creating hidden drift.

## Decision

We will check the following OLManager source files quarterly:

- `OLManager/src/store/types.ts` — runtime TypeScript contracts for teams, players, staff, social, news, and messages.
- `OLManager/src-tauri/crates/olm_core/src/generator/definitions.rs` — Rust source of truth for competition/team/player/staff file shapes.

### Blocking drift

A quarterly review is **blocking** when it touches shape-bearing fields for the types we serialize:

- `PlayerAttributes` (the nine LoL player attributes)
- `LoLRole` (Top, Jungle, Mid, Adc, Support)
- `StaffAttributes` (coaching, physiotherapy, judging_ability, judging_potential)
- `CompetitionManifest` (id, name, full_name, region, country, tier, logo, active, teams_file, players_file, staff_file)
- `Team` budget/identity fields consumed by `EditTeam`
- `SocialAccountData`, `SocialTemplateData`, and `NewsTemplate` fields consumed by PR3 proposal types

If any of these shapes change, we must update `src/data/olmanager/types.ts`, the relevant loaders, embedded subsets, and proposal validation/diff before the next release.

### Non-blocking drift

Changes that are non-shape-bearing are **non-blocking**:

- Adding new optional fields that the workbench does not consume.
- Renaming fields we do not use.
- Changing narrative text, translations, or template variants.

These may be absorbed opportunistically but do not block a release.

## Consequences

- Contributors can rely on `data/` as a stable, reviewable baseline.
- The embedded LEC subset in `src/data/embedded/lec/` and the content-catalog subsets in `src/data/embedded/social/`, `src/data/embedded/news/`, and `src/data/embedded/messages/` act as CI-visible parity anchors.
- `assertEmbeddedInSyncWithData()` guards the LEC competition subset; social/news/message embedded subsets are kept in sync manually during the quarterly review.
- The workbench does not import full catalogs into client bundles; it uses small embedded subsets for synchronous validation and diffing.
