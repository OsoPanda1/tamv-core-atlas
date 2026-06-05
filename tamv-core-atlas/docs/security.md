# Security model

`tamv-core-atlas` is a read-only crawler over public repositories. It MUST
NOT execute or import code from the repos it absorbs. This document lists
the controls in place and the invariants the pipeline relies on.

## Invariants

1. **No code execution.** Only string parsing of README and `package.json`.
   No `npm install`, no `node`, no shell from absorbed content.
2. **Allow-list filesystem reads.** See `ingestion/safe-fs.ts`:
   `ALLOWED_TOP_FILES` and `ALLOWED_TOP_DIRS`.
3. **No symlinks.** `readTextFileSafe` rejects symlinks via `lstat`.
4. **No path traversal.** `assertContained` ensures every written file is
   strictly under its expected parent.
5. **Per-file and per-repo size caps.** `LIMITS.maxFileBytes` (1 MB) and
   `LIMITS.maxRepoBytes` (8 MB) in `ingestion/config.ts`.
6. **Validated I/O.** Every `meta.json` is parsed through Zod
   (`RepoMetaSchema`) on write AND on read.
7. **Atomic writes.** `writeJsonAtomic` / `writeTextAtomic` write to a
   `.tmp` file and `rename`, preventing partial writes.
8. **Secret redaction.** `ingestion/redact.ts` runs before publish and
   replaces matches with `[REDACTED:<name>]`.
9. **Hard timeouts and bounded retries.** `ingestion/http.ts` enforces a
   15s timeout and exponential backoff for transient errors.
10. **Audit log.** Every operation appends to `atlas/audit.log` as JSONL.

## Secrets

- The only secret used is `GITHUB_TOKEN`, a personal access token with
  `public_repo` (read-only) scope. Store it in `.env` (gitignored) or as a
  GitHub Actions secret.
- The token is never written to disk in absorbed artifacts.
- `.env` is in `.gitignore`. Do NOT commit it.

## Reporting

If you find a vulnerability, do NOT open a public issue. Contact the
custodian via private channel.
