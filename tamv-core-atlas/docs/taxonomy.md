# Taxonomy

The taxonomy lives in [`atlas/taxonomy.json`](../atlas/taxonomy.json) and is
the single source of truth for categories, domains, and signal vocabularies.

## Categories

frontend, backend, fullstack, mobile, infra, cli, library, docs,
automation, ai, experiment.

## Domains

auth, payments, content, analytics, admin, ecommerce, devtools, ai, data,
workflow, governance, sovereignty.

Adding a category requires:

1. Updating `atlas/taxonomy.json`.
2. Adding at least one rule to `ingestion/classify.ts`.
3. Documenting the rationale here.
