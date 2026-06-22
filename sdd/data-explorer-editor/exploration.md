# Exploration: Data Explorer / Editor First

## Current State

`olmanager-data-manager` is a Next.js 16 + React 19 + Tailwind 4 app that today does **exactly one thing well**: capture typed proposals in a session-only store and render deterministic diffs. After the `game-parity-data-manager` chained PR (PR1 visual foundation → PR2 data/domain alignment → PR3 real catalogs), the data the proposals describe is now sitting raw at `src/data/`, but the **only** way to encounter that data is to fill out a proposal form that points at a hidden `getEmbeddedCompetition()` / `getEmbeddedSocialCatalog()` helper.

### App shape

- `src/app/page.tsx` — landing. One CTA to `/proposals`, one to a hardcoded `AddPlayer` link. Pure proposal framing.
- `src/app/(proposals)/` — route group with the `Shell` (sidebar + topbar) layout.
  - `proposals/page.tsx` — choice grid of the 11 supported `ProposalType`s + session review queue.
  - `proposals/new/[type]/page.tsx` — typed new-proposal form. Uses `parseProposalType` as a guard.
  - `proposals/[id]/page.tsx` — proposal detail, deterministic diff, submit/approve/reject stub controls.
- `src/features/proposals/` — `proposal-routes.tsx`, `proposal-form.tsx` (~1000 LOC, 11 form variants), `proposal-presenters.tsx`, `session-proposal-store.tsx` (sessionStorage-backed, `olmanager.typed-proposals.non-production-session.v2`).
- `src/domain/proposals/` — `types.ts`, `metadata.ts`, `validation.ts` (1070 LOC, all 11 types), `diff.ts`, `review-state.ts`.
- `src/components/` — `layout/{Shell,Sidebar,Topbar,FixtureIdRail}.tsx` and `ui/{button,card,field,select,badge,role-chip}.tsx`. The sidebar currently has two nav items: Home and Proposal workbench.
- `src/data/` — the raw game data lives here, flat under entity folders:
  - `competitions/{id}/manifest.json` (43 folders, one per league including legacy).
  - `teams/{slug}_teams.json` (43 files).
  - `players/{slug}_players.json` (32 files + `free_agents.json`).
  - `staffs/{slug}_staffs.json` (18 files + `free_agents.json`).
  - `social/{accounts,match_texts,templates}.json`.
  - `news/{editorial/*,season_preview/*}.json` (4 files).
  - `messages/{senders/*,triggers/**}/*.json` (9 senders + 17 trigger categories).

### Critical finding (the project currently does not build)

Commit `ba7ea9d` ("refactor: move game data to `src/data/` and remove loader abstractions") deleted:

- `src/data/olmanager/types.ts` (297 lines — the canonical `Player`, `Team`, `Staff`, `SocialAccountData`, `SocialTemplateData`, `NewsTemplate`, `PlayerAttributes`, `StaffAttributes`, `LoLRole`, etc.)
- `src/data/olmanager/embedded.ts` (`getEmbeddedCompetition()`, `getEmbeddedSocialCatalog()` — the only bridge between the proposal form's `<Select>` options and real data).
- `src/data/olmanager/rating.ts` (`calculateLolOvr`, `PLAYER_RATING_*` constants).
- `src/data/embedded/lec/**` and `src/data/embedded/social/**` and `src/data/embedded/messages/**` (small fixtures used by diffs/validation).

…but the proposal system still imports from all three:

- `src/domain/proposals/types.ts:3-15` — `Player`, `Team`, `Staff`, `CompetitionManifest`, `NewPlayerInput`, `NewStaffInput`, `NewsTemplate`, `SocialAccountData`, `SocialTemplateData`, `PlayerAttributes`, `StaffAttributes` from `@/data/olmanager/types`.
- `src/domain/proposals/validation.ts:1-15` — `getEmbeddedCompetition`, `getEmbeddedSocialCatalog`, `PLAYER_RATING_*`, `LOL_ROLES`, `PLAYER_ATTRIBUTE_KEYS`, `STAFF_ATTRIBUTE_KEYS`, `SOCIAL_AUTHOR_TYPES`, `LoLRole`, `PlayerAttributes`, `StaffAttributes`.
- `src/domain/proposals/diff.ts:1-3` — same trio.
- `src/domain/proposals/proposals.test.ts:2` — `calculateLolOvr`.
- `src/features/proposals/proposal-form.tsx:7-14` — same trio.
- `src/components/ui/role-chip.tsx:2` — `LoLRole`.

`npx tsc --noEmit` returns 30+ errors. The earlier `embedded-check.ts` (144 lines) that the loader and tests depended on is also gone. None of the existing proposal forms, diffs, validations, or the new PR3 editorial/social proposal types work today.

So the user's "tool needs to become a data explorer/editor first" is not just a UX priority — the underlying data wiring was already broken by the data refactor and is asking to be **rebuilt from the raw `src/data/` JSON** as the new source of truth.

### What the raw data actually looks like

Each competition has a 1:1 manifest with cross-file pointers (`teams_file`, `players_file`, `staff_file` — strings, not actual references). The team/player/staff JSON files are self-describing envelopes: `{ name, description, teams|players|staff: [...] }`. The shapes match OLManager runtime directly (full `Player` record with `attributes`, `career`, `injury`, `morale_core`, `transfer_offers`, `champion_mastery`, etc.). Social/news/messages have their own ad-hoc structures with `translations` and `i18n` keys inline.

The "competition → team → player/staff" drill-down is the only relationship the data itself expresses explicitly. Social accounts and templates are flat global lists. News/messages are also flat per-folder. There is no `team_id → players` reverse index, no `competition_id → teams` reverse index, no roster join — the explorer has to build them in-memory.

## Affected Areas

- `src/app/page.tsx` — landing currently frames proposals as the headline. Re-frames to "browse, then propose."
- `src/app/layout.tsx` — root layout. Probably keeps `--font-inter` / `--font-oswald` heading.
- `src/app/(proposals)/` — current route group is misnamed for the new direction; the explorer should not live behind a "proposals" URL prefix.
- `src/app/(proposals)/layout.tsx` + `src/components/layout/Shell.tsx`, `Sidebar.tsx`, `Topbar.tsx`, `FixtureIdRail.tsx` — `Sidebar.tsx` is the primary surface for new nav. Hardcodes a 2-item `NAV` array.
- `src/components/ui/{button,card,field,select,badge,role-chip}.tsx` — existing primitives are proposal-form-shaped. Need a list-row, table-cell, breadcrumb, search-input, and probably a `Tabs` primitive for `Squad / Staff / Schedule / Social / News` style navigation.
- `src/data/olmanager/**` (recreate) — `types.ts`, `embedded.ts`, `rating.ts`. Either reintroduced as a thin re-export from raw JSON, or replaced by a new `src/data/catalog.ts` / `src/data/types.ts` that derives types from the on-disk JSON.
- `src/data/embedded/**` (recreate or drop) — fixtures used by `diff.ts` and `validation.ts`. The diff/validation code currently calls `getEmbeddedCompetition()` to resolve before/after values for `EditPlayer` / `EditTeam` / `EditCompetition` / `EditStaff` / `EditSocialTemplate` / `AddNewsTemplate` payloads. A new explorer-driven diff source must replace this.
- `src/domain/proposals/{types,diff,validation}.ts` — currently 1000+ LOC, all gated by the missing modules. Must be rewired to the new explorer-aware data source.
- `src/features/proposals/{proposal-form,proposal-routes,session-proposal-store,proposal-presenters,review-controls}.tsx` — form/queue/review are intact and reusable; the form just needs to receive an `entity` context (which player, which team, which template) to be contextually useful.
- `src/lib/cn.ts` — the only lib file. Will need a `src/lib/data/{competitions,teams,players,staffs,social,news,messages}.ts` index module layer.
- `docs/architecture.md` — section 4 ("Data Model") lists stale proposal types (`AddPlayer`, `EditPlayerAttributes`, `EditPlayerBio`, `TransferPlayer`, `AddTeam`, `EditTeam`, `AddCompetition`, `EditCompetitionSchedule`, `UploadPlayerPhoto`, `UploadTeamLogo`); the actual `PROPOSAL_TYPE_METADATA` is now 11 types. Architecture doc must be updated to reflect the new explorer-first surface and the data source.

## Approaches

### 1. **Read-only explorer, with contextual "Propose change" entry points** (recommended)

Reintroduce `src/data/olmanager/{types,embedded,rating}.ts` as a **thin loader** over the raw `src/data/**` JSON. Add new routes under a new `(data)` route group:

- `/data` — competition browser (cards/grid grouped by tier, region, active).
- `/data/competitions/[id]` — competition detail: header (manifest), teams table, players table (joined from the manifest's `players_file`), staff table.
- `/data/teams/[id]` — team detail: identity, finance, tactics, roster (players joined on `team_id`), staff joined on `team_id`.
- `/data/players/[id]` — player detail: identity, attributes grid, career, market value, contract, transfer/loan flags. **"Propose change"** and **"Propose transfer"** buttons in the hero.
- `/data/staff/[id]` — staff detail: identity, role, attributes. **"Propose change"** and **"Propose release"** buttons.
- `/data/social` — list of accounts and templates, with filter by slot/language/tags/active.
- `/data/social/templates/[id]` — template detail with variants, translations, tags, conditions. **"Propose change"** button.
- `/data/social/accounts/[id]` — account detail. **"Propose change"** button.
- `/data/news` — list of news templates grouped by category (Editorial / SeasonPreview). **"Propose new"** button per category.
- `/data/news/templates/[id]` — template detail with headlines/body/sources/translations. **"Propose change"** button.
- `/data/messages` — list of senders and triggers grouped by sender. **Read-only by default** (no proposal type exists for messages today, so this is observation only).

The contextual "Propose change" buttons reuse the existing `proposal-routes.tsx` form by deep-linking `/proposals/new/EditPlayer?entityId=…` (or by lifting `entityId` through the form via search params). The new explorer is a **read harness over the same JSON the proposals describe** — it is a sibling of `/proposals`, not a replacement. Proposals remain the only way to mutate.

- **Pros**
  - Honors the existing MVP boundary (read-only data, no production persistence, no GitHub writes, no Discord auth) verbatim.
  - Reuses the entire proposal form, session store, diff, review pipeline. Zero changes to validation/diff logic besides rewiring the `embedded` data source.
  - The "competition → team → player/staff" drill-down is a single URL hierarchy that's easy to bookmark, share, and test.
  - Clear scope boundary: the explorer shows **only** entities that the current 11 proposal types can address. Messages and `free_agents` are observation-only by default, which keeps the surface bounded.
  - The `embedded` shim can be reintroduced mechanically: it just `import.meta.glob` or statically imports the raw JSON, normalizes to the same `Player[]` / `Team[]` / `CompetitionManifest` shape, and exposes the same `getEmbeddedCompetition()` / `getEmbeddedSocialCatalog()` API. Diff and validation tests light back up with minimal changes.
  - The 800-line review budget fits comfortably: 1 PR for the catalog rehydration + new route group, 1 PR for the per-entity detail pages with contextual proposal buttons.
- **Cons**
  - The full data surface is large (43 competitions, hundreds of teams, thousands of players). A naive list dumps are unusable; the explorer needs search/filter/pagination from day one.
  - The current `Sidebar` is a 2-link `NAV` array; rebuilding it into a hierarchical "Competitions / Teams / Players / Staff / Social / News / Messages" navigation requires reworking the layout and is itself a meaningful design surface.
  - Reintroducing `src/data/olmanager/**` is technically a reversal of the previous refactor. It must be clear (in code comments + ADR) that this is a **thin loader** over the raw JSON, not a re-introduction of abstractions. The simplest way is to make `embedded.ts` a one-stop `import.meta.glob` aggregator and `types.ts` a `z.infer`-free type alias file, so there is no "loader" class.
  - Free agents exist in `players/free_agents.json` and `staffs/free_agents.json` but are not addressable by any `Edit*` proposal (the proposal form requires `team_id`). The explorer must surface that gap.
- **Effort**: **Medium**. 1.5 PRs: (a) rehydrate `data/olmanager/{types,embedded,rating}.ts` as a thin loader + add a `/data` route group with the competition browser and team/player/staff drill-down + write integration tests. (b) extend with social, news, and messages browser + contextual proposal entry points wired through search params.

### 2. **In-page side panel: a `proposals/[id]`-adjacent data inspector**

Keep the current `/proposals` workbench as the main entry, but add a side panel that opens when the user is on a new-proposal form. The side panel shows the relevant entity (the team, the player, the social template) live, with a "Pick another" search picker, so the contributor can confirm what exists before submitting.

- **Pros**
  - Smallest delta. No new routes, no sidebar rework.
  - The proposal form already has a `<Select>` for `team_id` / `competitionId` / `templateId`; the side panel can be the **result** of that selection, not a separate picker.
  - Fits the 800-line review budget in a single PR.
- **Cons**
  - The user cannot browse without a pending proposal. They still must know what they want to change before opening the workbench, which is exactly the friction the user complained about.
  - Does not surface competitions that the user has never proposed on, nor social/news/messages, nor free agents.
  - Side-panel UX in the current `narrowPage` layout (`src/features/proposals/proposal-routes.tsx:117`) is cramped; reflowing the form to make room is a real cost.
  - Does not produce shareable URLs like `/data/teams/lec-g2-esports` that can be linked in GitHub issues.
- **Effort**: **Low**. ~1 PR.

### 3. **Build a full read/write dashboard (out of scope)**

Add a `/dashboard` route group with all entity CRUD, role-based views, real auth, etc. The studio's full OLManager.

- **Pros**: future-proof.
- **Cons**: explicit scope violation. The architecture doc and the home page make the MVP boundary unambiguous: "no Discord OAuth, no production persistence, no GitHub writes, no asset uploads, no ZIP export." This approach blows past all of that and grows the surface beyond the review budget.
- **Effort**: **High** and explicitly **not what the user asked for**.

## Recommendation

**Approach 1: read-only explorer with contextual proposal entry points.** Reasons:

1. It directly maps to the user's words: "data explorer/editor first, proposal system second." A new `/data` route group is the literal implementation of "first." The proposal workbench becomes the "second" thing you reach for, opened by clicking "Propose change" from the explorer.
2. It **repairs the broken proposal code path** at the same time. Reintroducing a thin `data/olmanager/{types,embedded,rating}.ts` rehydrates the diff and validation pipelines that were orphaned by the previous refactor. The proposal system comes back online as a side effect of building the explorer, not as a separate fix-it PR.
3. The existing primitives (`Shell`, `Sidebar`, `Topbar`, `Card`, `Button`, `Field`, `Select`, `RoleChip`, `Badge`) cover most of the explorer's needs. The missing primitive is a **list/table** with row-level drill-down links; that fits inside the 800-line review budget.
4. The scope is bounded by the existing 11 proposal types. Anything the explorer shows must be addressable by a proposal; this is a natural anti-creep constraint.
5. The hierarchy "competitions → teams → players/staff" is the same hierarchy OLManager's `PlayerProfileV2`, `TeamProfileV2`, and `StaffProfileV2` pages use. Studying those references gives the explorer design cues without copying the desktop UX.

**Concrete sequencing:**

- **PR1 (this change, ~600-700 LOC):** Reintroduce `data/olmanager/{types,embedded,rating}.ts` as a thin loader over the raw JSON. Add `src/lib/data/{competitions,teams,players,staffs,social,news,messages}.ts` for direct, typed accessors used by the explorer routes. Add `/data` (competition browser) and `/data/competitions/[id]` (competition detail) and `/data/teams/[id]` (team detail with roster). Add `DataTable` and `Breadcrumbs` primitives. Update `Sidebar` to expose a hierarchical "Browse" section. Re-run `tsc --noEmit` and `vitest run`; expect PR2's diff/validation tests to light up as a bonus.
- **PR2 (~500-600 LOC):** Add `/data/players/[id]` and `/data/staff/[id]` with full attribute grids, career, contract, transfer/loan flags. Add the contextual **"Propose change"** / **"Propose transfer"** / **"Propose release"** buttons that deep-link to `/proposals/new/EditPlayer?entityId=…`. Wire the new-proposal form to prefill `entityId` from search params.
- **PR3 (if needed, defer or skip):** Add `/data/social`, `/data/news`, `/data/messages` browsers. Messages are observation-only because no proposal type exists for them; this is a clear MVP boundary, not a missing feature.

**Design direction (frontend-design skill lens):**

- **Subject pinned:** A contributor curating an esports database. The page's job is "show me what is in the data, then let me point at a thing to change." Subject's own world: 43 leagues, regional flags, team logos, player portraits, OVR ratings, OVR radar charts, contract end dates, market value.
- **Hero is a thesis:** The `/data` landing is **not** a card grid of all 43 leagues. It's a single headline stat — "43 active leagues · 12 legacy · 322 teams · ~5,000 players · 18 staff catalogs" — over a compact active-league grid that lets the eye land somewhere. No hero illustration; the data is the illustration.
- **Typography:** Keep `Oswald` (already loaded) for section headings and entity names; lean on tabular numbers (Oswald's strong suit) for OVR/wage/market-value. For dense comparison rows, fall back to the `Inter` body face with `font-feature-settings: "tnum"` for aligned columns.
- **Layout signature:** The single memorable thing this page should be remembered for is the **breadcrumbs as a topology** — `LEC › Natus Vincere › Supa`. The hierarchy is the navigation. The breadcrumbs double as a typographic anchor and the only persistent piece of chrome across all detail pages.
- **Risk taken deliberately:** The competition browser is a **map-anchored grid**, not a card grid. Each competition card uses its **logo's primary color as a left border** and its tier as a small Roman numeral. This is unusual for a "browse all data" page but it carries real information (the actual primary color of the league's brand) and avoids the templated "card grid" look. This is consistent with the existing `globals.css` `primary-500: #f97316` orange and the `navy-` palette already defined; we extend, we do not re-skin.
- **Restraint:** No "fuzzy search" modal in the hero. Search lives in the topbar only when there are > 10 results in a table; the competition browser's 43-item list is small enough to render all of it.
- **Reduced motion:** No scroll-triggered reveals; the only motion is a `200ms` color transition on hover for table rows.
- **Vercel React best practices to honor (relevant to this surface):**
  - The `/data` landing is mostly static (43 competition cards). Use a server component for the index and the per-competition detail; only the contextual "Propose change" button (which opens a new tab to `/proposals/new/…?entityId=…`) is a client link. This is a free `bundle-dynamic-imports` win.
  - The data loader is a `import.meta.glob` returning `Promise<>` arrays; a top-level `cache()` (React server cache) dedupes per request. If the loader runs in the client (for the contextual proposal entry), use `useSyncExternalStore` against an in-memory `Map<competitionId, CompetitionManifest>` to keep the existing session-store pattern consistent.
  - For long roster tables (LEC alone has 60+ players), prefer `content-visibility: auto` on each row container (`rendering-content-visibility`) and a stable key (`row-${player.id}`).
  - The drill-down `Link` components use `prefetch={false}` for `/proposals/new/…?entityId=…` because the proposal form is a heavy client component (`bundle-dynamic-imports`).

## Risks

- **Repatriating `src/data/olmanager/**` is a behavioral reversal of the previous refactor.** If we reintroduce a "loader" abstraction in the same place it was just removed, future readers will rightly ask why. The mitigation is to make the file contents a single `import.meta.glob('./**/*.json', { eager: true })` call wrapped in memoized getters — no class, no strategy, no interface. If the file ever grows past a screenful, the abstraction is back; until then, it is a 50-line index of typed imports.
- **The proposal form's `<Select>` options for `team_id`, `competitionId`, `templateId` are currently built from `getEmbeddedCompetition()` / `getEmbeddedSocialCatalog()`.** When we rehydrate, we must re-point those to the same catalog the explorer reads from; otherwise the form and the explorer will disagree on which entities exist. Lock this down with a shared `src/lib/data/` accessor module.
- **Data volume.** LEC alone has 60+ players, 10+ teams; the full dataset is in the thousands. The competition landing and the team detail page can render eagerly; the player/staff tables need a list/table primitive that virtualizes or paginates. Out-of-scope for PR1: virtualized rendering. PR1 paginates by `?page=1&size=20`. Virtualization is a follow-up.
- **Photos and logos are root-relative paths** (`/teams-icons/natus-vincere.webp`, `/player-photos/103536968833612789.webp`). The current `next.config.ts` is empty; the explorer should serve them via `next/image` with a small wrapper that adds a `width`/`height` placeholder to avoid CLS. This is a `next/image` config concern, not a data concern.
- **The proposal form requires `entityId` to be searchable across pages, but `entityId` is currently the `Player.id` like `lec-player-103536968833612789` or the `Team.id` like `lec-movistar-koi` — these are not stable across `competitionId` namespaces (a player in `lec` and a player in `lck` can share the numeric tail).** The contextual proposal link must use the fully-qualified `id`, not just the local slug. Verify this in PR2.
- **Free agents.** `players/free_agents.json` and `staffs/free_agents.json` exist but no `Edit*` proposal type targets a free agent (`team_id` is required). The explorer should surface free agents in their own page (`/data/players/free-agents`) with a clear "no proposal available" badge; do not invent a new proposal type for this slice.
- **i18n is not in scope.** The data has `translations` blocks but the explorer's UI copy is English-only (per the project's existing `lang="en"` root layout). Do not add a language switcher in this slice.
- **Out of MVP scope, must remain so:** Discord OAuth, Discord role sync, GitHub App writes, production persistence, asset upload storage, ZIP export generation. The explorer's "Propose change" buttons must open `/proposals/new/…` in the same tab and **not** ship a "Submit to GitHub" or "Open PR" button. The existing `MvpExclusions()` aside in `proposal-routes.tsx:227-233` is the model.

## Ready for Proposal

**Yes.** The orchestrator should tell the user:

> Exploración lista. El proyecto está en un estado roto por el refactor anterior (`ba7ea9d`): `src/data/olmanager/{types,embedded,rating}.ts` ya no existe, pero `src/domain/proposals/{types,diff,validation}.ts` y `src/features/proposals/proposal-form.tsx` los siguen importando. `tsc --noEmit` falla con 30+ errores. La propuesta de explorador/editor puede **reparar esto como efecto colateral** reintroduciendo un loader delgado de 50-80 LOC sobre los JSON crudos en `src/data/`. La superficie del explorador se acota naturalmente a las 11 entidades que los tipos de propuesta ya entienden; todo lo demás (mensajes, free agents) queda como observación.
>
> Recomendación: 1 PR de ~600-700 LOC para (a) reintroducir el loader delgado, (b) crear el grupo de rutas `/data` con navegador de competiciones + detalle de competición + detalle de equipo con roster, y (c) actualizar `Sidebar` con una sección "Browse" jerárquica. 1 PR posterior de ~500-600 LOC para detalle de jugador/staff con atributos y los botones contextuales "Propose change/transfer/release" que prefillean `entityId` en `/proposals/new/…`.
>
> Si querés, avanzo a propuesta con scope y tasks para PR1. Si preferís cambiar el alcance (ej.: un único PR más pequeño con panel lateral en el workbench, Approach 2), decime y reformulo.
