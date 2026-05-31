# Ingestion rules

## What we read

- `README.md` / `readme.md`
- `package.json` (only `name`, `description`, `keywords`, `scripts`,
  `dependencies`, `devDependencies`)
- `tsconfig.json` (presence only)
- `Dockerfile` (presence only)

## What we never read

- Anything outside the repo allow-list.
- Files larger than 1 MB.
- Symlinks.
- Binary files.

## How we classify

Rule-based, deterministic, with a confidence score in `[0, 1]`. See
`ingestion/classify.ts`. Rules are weighted; if no rule matches the repo
is tagged `experiment` at confidence `0.3`.

## How we relate

Pairwise comparison of `tags` and `stack.frameworks`. An edge is emitted
only when the combined weight ≥ `EDGE_THRESHOLD` (default 2). This avoids
the O(n²) noise that would otherwise dominate at 224 repos.

## How we update

- `discover` always refreshes `repos.json`.
- `fetch` is idempotent per repo; existing evidence is overwritten.
- `extract`, `normalize`, `classify` are pure functions over local
  evidence.
- `publish` validates every `meta.json` and exits non-zero on errors so CI
  fails loudly.