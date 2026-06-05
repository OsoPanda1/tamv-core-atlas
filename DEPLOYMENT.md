# TAMV Core Kodex — Deployment Guide

Despliegue unificado de la plataforma (TanStack Start SSR) y el pipeline
auxiliar `tamv-core-atlas` (ingestión de repositorios). Tres rutas soportadas:

1. **Lovable Cloud** (recomendado): pulsar **Publish** en el editor.
2. **Self-host con Docker** (este documento).
3. **CI/CD a un servidor** vía GitHub Actions (`.github/workflows/deploy.yml`).

---

## 0. Contexto de versión y alcance

- **Versión operativa actual:** `0.1.0-mvp` para el contenedor raíz Kodex.
- **Boundary desplegado:** `/src` + `Dockerfile` + configuración raíz.
- **Boundary auxiliar:** `/tamv-core-atlas` se ejecuta bajo demanda para generar
  artefactos `atlas/*`; no queda levantado como servicio permanente.
- **Boundary excluido:** `/tamv-atlas-nextgen` no participa en este despliegue
  raíz hasta que exista una migración formal documentada en `ARCHITECTURE.md`.

## 1. Requisitos

- Docker 24+ y Docker Compose v2
- Puerto `3000/tcp` abierto (o detrás de un reverse proxy como Caddy/Traefik/Nginx)
- (Opcional) Token GitHub `public_repo` para el pipeline `atlas`

## 2. Build local

```bash
docker compose build kodex
docker compose up -d kodex
# verificar
curl -fsS http://localhost:3000/ | head
docker compose logs -f kodex
```

La app queda disponible en `http://<host>:3000`. SSR renderiza todas las rutas
(`/`, `/console`, `/nexus`, `/atlas`, `/csp/*`, `/docs`, `/wikis/*`, `/eoct`,
`/korima`, `/mdx5`, `/events`, `/auth`).

## 3. Ingestión Atlas (opcional)

```bash
cp tamv-core-atlas/.env.example tamv-core-atlas/.env
# editar GITHUB_TOKEN
docker compose --profile ingest run --rm atlas
# artefactos en ./tamv-core-atlas/atlas/
```

Los artefactos generados (`atlas/index.json`, `atlas/graph.json`,
`atlas/repos/*`) se pueden montar en la UI sustituyendo el seed estático
`src/lib/csp-data.ts` por un loader que lea esos JSON.

## 4. CI/CD con GitHub Actions

`.github/workflows/deploy.yml` construye la imagen en GHCR y, si están
definidos los siguientes valores en el repo, hace SSH al host objetivo y
ejecuta `docker compose pull && up -d`:

| Tipo                | Nombre           | Ejemplo                 |
| ------------------- | ---------------- | ----------------------- |
| Repository variable | `DEPLOY_HOST`    | `kodex.tamv.org`        |
| Repository variable | `DEPLOY_USER`    | `deploy`                |
| Repository variable | `DEPLOY_PATH`    | `/srv/tamv-kodex`       |
| Repository secret   | `DEPLOY_SSH_KEY` | clave privada SSH (PEM) |

En el host objetivo coloca `docker-compose.yml` y un `.env` con el tag de
imagen a usar (`image: ghcr.io/<owner>/tamv-core-kodex:latest`).

## 5. Reverse proxy + HTTPS (ejemplo Caddy)

```caddyfile
kodex.tamv.org {
  encode zstd gzip
  reverse_proxy localhost:3000
}
```

## 6. Variables de entorno (runtime)

La app no requiere secretos para arrancar. Si conectas Lovable Cloud o
integraciones externas, expón las claves vía `environment:` en
`docker-compose.yml` o secret manager. Nunca commitees `.env`.

## 7. Healthcheck

- Endpoint base `GET /` responde 200 OK con HTML SSR.
- Healthcheck Docker integrado (`wget` cada 30 s).

## 8. Observabilidad

- Logs estructurados a stdout (capturables por Docker / journald / Loki).
- OpenTelemetry-ready: el runtime de Nitro admite `OTEL_*` env vars.

## 9. Rollback

```bash
docker compose pull kodex
docker tag ghcr.io/<owner>/tamv-core-kodex:<sha-anterior> ghcr.io/<owner>/tamv-core-kodex:latest
docker compose up -d kodex
```

## 10. Troubleshooting CI/CD

| Síntoma                                         | Verificación                              | Acción recomendada                                                              |
| ----------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| `bun install --frozen-lockfile` falla en Docker | `bun.lock` no coincide con `package.json` | Regenerar lockfile con Bun y commitearlo.                                       |
| `vite build`/Nitro falla                        | `bun run build` local                     | Revisar rutas TanStack, imports de servidor y `NITRO_PRESET=node-server`.       |
| Push a GHCR falla                               | Permisos del workflow                     | Confirmar `packages: write` y que el token `GITHUB_TOKEN` tenga acceso al repo. |
| SSH deploy falla                                | Variables/secrets                         | Confirmar `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH` y `DEPLOY_SSH_KEY`.       |
| Lint raíz falla por código nextgen              | Boundary incorrecto                       | Validar nextgen desde `/tamv-atlas-nextgen`; no incluirlo en el lint raíz.      |

---

**Custodio canónico:** Edwin O. Castillo Trejo · ORCID 0009-0008-5050-1539
**DOI canon:** 10.5281/zenodo.19436662
