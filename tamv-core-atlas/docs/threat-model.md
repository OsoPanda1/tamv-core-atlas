# Threat model

| Threat                              | Mitigation                                      |
| ----------------------------------- | ----------------------------------------------- |
| Malicious README executes code      | We never `eval` or `require` repo content       |
| Symlink escape on local read        | `lstat` + reject `isSymbolicLink`               |
| Path traversal via crafted filename | `safeSlug` + `assertContained`                  |
| Oversized files DoS                 | `maxFileBytes` + `maxRepoBytes`                 |
| GitHub API rate limit               | `fetchWithRetry` + `p-limit` concurrency cap    |
| Leaked secrets in committed atlas/  | `redact.ts` runs before publish; CI gate        |
| Corrupted JSON between runs         | Atomic writes + Zod re-validation on read       |
| Supply-chain attack via deps        | Pinned versions; `npm ci` in CI; `npm audit`    |
| Unbounded repo discovery            | `MAX_REPOS` cap (default 500)                   |
| Stuck/hung HTTP request             | 15s timeout per request                         |
| Forks polluting the index           | Excluded by default; opt-in via `INCLUDE_FORKS` |
| Archived repos noise                | Always excluded                                 |
| Type confusion on inputs            | Zod parse at every boundary                     |

## Out of scope

- Auditing the contents of absorbed repos for malware (use a dedicated SAST).
- Identity / signing of generated artifacts (planned: sigstore + provenance).
- Semantic search over repo content (planned: pgvector + embeddings).
