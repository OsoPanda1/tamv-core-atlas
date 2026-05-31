# tamv-core-atlas

Atlas vivo para absorber, clasificar y conectar los 224+ repos del ecosistema
TAMV (perfil REDACTED). Diseñado como un pipeline endurecido: ingesta,
normalización, clasificación, relación y publicación, sin ejecutar nada del
código absorbido y con redacción automática de secretos.

## Capas

1. **Ingesta** — descubre repos vía GitHub API, lee solo metadatos seguros.
2. **Normalización** — convierte todo a un esquema común validado con Zod.
3. **Indexado** — guarda `meta.json` y `summary.md` por repo, construye
   `index.json` global y `graph.json` de relaciones.
4. **Publicación** — wiki navegable con búsqueda por tag, stack y dominio.

## Flujo

```
discover → fetch → extract → normalize → classify → relate → redact → publish
```

## Quick start

```bash
cp .env.example .env
# edita .env y agrega tu GITHUB_TOKEN (scope public_repo, read-only)
npm install
npm run build
npm run validate
```

## Salidas

- `atlas/index.json` — índice global con stats por categoría y tag.
- `atlas/graph.json` — grafo de relaciones entre repos.
- `atlas/taxonomy.json` — taxonomía de categorías y dominios.
- `atlas/repos/<slug>/meta.json` — metadatos canónicos validados.
- `atlas/repos/<slug>/summary.md` — wiki por repo (redactada).
- `atlas/audit.log` — auditoría append-only de cada operación.

## Seguridad

Ver [`docs/security.md`](docs/security.md) y
[`docs/threat-model.md`](docs/threat-model.md). Reglas clave:

- nunca se ejecuta código de los repos absorbidos
- solo se leen archivos en allow-list (README, package.json, docs/, etc.)
- límite de tamaño por archivo (1 MB) y por repo
- rechazo de symlinks y path traversal
- redacción de secretos (tokens GitHub/AWS, llaves privadas, API keys)
- validación estricta con Zod antes de publicar
- timeouts, retries con backoff y rate-limit handling para GitHub API
- workflows con `permissions:` mínimos

## Escala

Probado conceptualmente para 224+ repos. Procesa en lotes con `p-limit`,
caché por SHA del default branch para reingesta incremental, y continúa ante
fallos individuales registrando cada error en `atlas/audit.log`.