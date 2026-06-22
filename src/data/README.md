# OLManager Data

Canonical game data for [OLManager](https://github.com/OpenLeagueManager/OLManager) — competitions, teams, players, staff, and content catalogs.

## Structure

```
competitions/    # 43 league manifests (LEC, LCK, LCS, etc.)
teams/           # 345+ team rosters
players/         # 1,600+ player profiles
staffs/          # Coaching and support staff
social/          # Social media accounts and templates
news/            # News storyline templates
messages/        # In-game message triggers
```

## How it works

- This repo is a **git submodule** of [olmanager-data-manager](https://github.com/OpenLeagueManager/olmanager-data-manager) and [OLManager](https://github.com/OpenLeagueManager/OLManager)
- Data changes are proposed via the data manager, reviewed as GitHub Issues, and merged as PRs
- The game consumes data via `git submodule update --remote`
- Every merged PR is an audit trail entry: `git log -- <file>` shows who changed what and when

## Contributing

1. Use the [OLManager Data Manager](https://github.com/OpenLeagueManager/olmanager-data-manager) to browse and propose changes
2. Proposals are reviewed as GitHub Issues with deterministic diffs
3. Approved changes become PRs in this repo
4. A maintainer merges the PR → data is live

## Schema

See the companion repo [olmanager-data-manager](https://github.com/OpenLeagueManager/olmanager-data-manager) for TypeScript type definitions.
