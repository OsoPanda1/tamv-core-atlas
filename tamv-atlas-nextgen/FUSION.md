# Fusión en monorepo Lovable / Plataforma Territorial LTOS Real del Monte

Este directorio (`tamv-atlas-nextgen/`) contiene el repo completo
`OsoPanda1/Plataforma-Territorial-LTOS-REAL-DEL-MONTE` (snapshot
`tamv-atlas-nextgen-main`) fusionado como paquete auxiliar del monorepo Lovable.

## Estructura fusionada

- `backend/` — API Node (AtlasKernel, Isabella, PID connectors, OmniKernel Gateway).
- `federation/` — Federaciones TAMV (`tamv-digital-nexus`, `tamv-the-federated-frontier`).
- `frontier/` — Módulos de la federación frontier.
- `docs/` — RFCs, playbooks y documentos UNIFIED (también surfaceados como wikis en la app).
- `schemas/`, `infra/`, `supabase/`, `scripts/` — Esquemas, infra y automatización.
- `data/` — Snapshots de bookpi, federación, knowledge y ops.

## Cómo se conecta con la app TanStack

- Los documentos canónicos `UNIFIED_01..03`, `RFC-0001`, `REPO_UNIFICATION_PLAYBOOK`,
  `TAMV-MD-X4-INTEGRACION-SCHEDRA` y `README` están copiados en
  `src/content/wikis/atlasng-*.md` y aparecen en `/wikis` con metadata
  registrada en `src/lib/wikis.ts`.
- El backend Node de `backend/` puede levantarse independientemente
  (`cd tamv-atlas-nextgen/backend && bun install && bun src/server.js`) y la
  app puede apuntar a él vía `VITE_TAMV_BACKEND_URL`.
- El `Dockerfile` y `docker-compose.yml` raíz del monorepo Lovable empaquetan
  la app TanStack; para self-host del backend NextGen usar
  `tamv-atlas-nextgen/backend/Dockerfile`.

## Despliegue conjunto sugerido

1. App Lovable (TanStack Start) → contenedor `kodex` (Dockerfile raíz).
2. Backend NextGen → contenedor adicional usando `tamv-atlas-nextgen/backend/Dockerfile`.
3. Ingesta de repos OsoPanda1 → `tamv-core-atlas/` (pipeline hardened ya existente).

Los tres paquetes comparten el ecosistema TAMV y pueden federarse vía el
AtlasKernel + EventStream sin conflicto de stack.
