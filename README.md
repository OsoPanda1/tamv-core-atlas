# TAMV Core Kodex / Atlas

Repositorio monorepo para la app web SSR **TAMV Core Kodex**, el pipeline auxiliar **tamv-core-atlas** y el snapshot/plataforma **tamv-atlas-nextgen**.

## Mapa rápido

| Ruta | Rol | Comandos principales |
| --- | --- | --- |
| `src/` | Aplicación web TanStack Start/React SSR. | `bun run dev`, `bun run typecheck`, `bun run build` |
| `tamv-core-atlas/` | Workspace Node/TypeScript para descubrir, ingerir, normalizar, clasificar, redactar y publicar artefactos Atlas. | `npm --workspace tamv-core-atlas run build`, `npm --workspace tamv-core-atlas run validate` |
| `tamv-atlas-nextgen/` | Plataforma/snapshot fusionado con frontend, backend Node, Supabase opcional y scripts de federación. | Revisar su `README.md` antes de ejecutar comandos dentro del subárbol. |
| `.github/workflows/deploy.yml` | Pipeline de build/push GHCR y deploy SSH opcional. | Se activa en `main` o manualmente. |
| `Dockerfile` / `docker-compose.yml` | Build self-host: compila con Bun y ejecuta Node 22 Alpine; incluye perfil opcional de ingesta Atlas. | `docker compose up -d --build` |

## Documentos operativos

- [Deployment self-host / CI](DEPLOYMENT.md)
- [Auditoría técnica corregida](docs/repository-audit.md)
- [README del pipeline Atlas](tamv-core-atlas/README.md)
- [README de NextGen](tamv-atlas-nextgen/README.md)

## Gate local mínimo

```bash
bun run typecheck
bun run build
```

> Nota actual: `bun run lint` existe, pero en este snapshot falla por errores de formato/Prettier preexistentes a través de varios subárboles. Ver la auditoría técnica corregida para el diagnóstico y plan de saneamiento.
