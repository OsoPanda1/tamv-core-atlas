# Auditoría técnica corregida — `tamv-core-atlas`

> Objetivo: reemplazar un análisis superficial/sesgado por una lectura verificable del repositorio local. Este documento separa **hechos observables**, **inferencias justificadas** y **riesgos que requieren verificación externa**.

## 1. Correcciones a sesgos y errores del análisis previo

| Afirmación previa | Corrección profesional | Evidencia local |
| --- | --- | --- |
| “Bun runtime” | Bun es el package manager y la imagen de build, pero el runtime productivo del contenedor es Node 22 Alpine. | `package.json` usa scripts compatibles con npm/bun; `Dockerfile` compila con `oven/bun:1.3` y ejecuta con `node:22-alpine`. |
| “TanStack Start detectado por template” | TanStack Start no solo se infiere por `.lovable`; es dependencia directa de producción y se configura en `vite.config.ts`. | `@tanstack/react-start`, `@tanstack/react-router` y `@lovable.dev/vite-tanstack-config` están declarados en raíz. |
| “PLpgSQL/PostgreSQL como backend” | En este snapshot no hay backend PostgreSQL/PLpgSQL en la app raíz ni en `tamv-core-atlas`; `tamv-atlas-nextgen` sí documenta Supabase opcional. No debe asumirse Postgres como backend principal de este repositorio. | `tamv-core-atlas` depende de Octokit/Zod/marked/Handlebars y ejecuta un pipeline de ingesta; `tamv-atlas-nextgen/README.md` declara Supabase como persistencia opcional. |
| “FastAPI/Python posible” | No hay evidencia local de FastAPI ni de un backend Python operativo en la raíz. | Los scripts principales son TypeScript/Node; `tamv-atlas-nextgen/backend/package.json` define backend Node. |
| “Monorepo sin estructura clara” | Sí hay ambigüedad de naming, pero también hay separación funcional: app SSR en `src/`, workspace de ingesta en `tamv-core-atlas/` y snapshot/plataforma fusionada en `tamv-atlas-nextgen/`. El problema real es falta de mapa raíz y límites de mantenimiento, no ausencia total de estructura. | `package.json` declara workspace `tamv-core-atlas`; `DEPLOYMENT.md` describe app TanStack SSR + pipeline auxiliar; `tamv-atlas-nextgen/README.md` describe plataforma full-stack importada. |
| “CI/CD failure por commit específico” | El estado remoto de GitHub Actions no es verificable desde el árbol local. Localmente, `bun run typecheck && bun run build` pasa; `bun run lint` falla por formato/Prettier preexistente. | Pruebas locales ejecutadas el 2026-06-05 en esta rama. |
| “0 releases implica falta de estabilidad” | Es una señal de proceso, no una conclusión técnica. La madurez debe evaluarse por build reproducible, tests, lint, despliegue, versionado y contratos. | Hay build Docker/SSR documentado, pero no hay script `test` en raíz y lint no está verde. |
| “Dependencia de AI codegen = riesgo” | La presencia de Lovable/bots no prueba mala calidad. El riesgo profesional es trazabilidad/revisión: ownership, tests, format gates y documentación de decisiones. | `.lovable` y dependencias Lovable existen; la calidad debe medirse con checks automatizados y revisión de código. |

## 2. Arquitectura real observada

```text
repo root
├── src/                         # Aplicación web TanStack Start/React SSR
├── tamv-core-atlas/             # Workspace Node/TypeScript de ingesta y publicación Atlas
├── tamv-atlas-nextgen/          # Plataforma/snapshot fusionado con frontend, backend Node y federación
├── .github/workflows/deploy.yml # Build/push de imagen GHCR + deploy SSH opcional
├── Dockerfile                   # Build con Bun; runtime final Node 22 Alpine
└── DEPLOYMENT.md                # Guía de self-host y pipeline Atlas opcional
```

### 2.1 Aplicación raíz (`src/`)

- Frontend/SSR con TanStack Start, React 19, Vite y Tailwind.
- Contenido y datos semilla viven principalmente en `src/lib/*` y rutas TanStack en `src/routes/*`.
- La configuración de Vite delega en `@lovable.dev/vite-tanstack-config` y solo añade el entry server custom.

### 2.2 Workspace de ingesta (`tamv-core-atlas/`)

- Es un paquete privado Node/TypeScript cuyo propósito es descubrir, extraer, normalizar, clasificar, relacionar, redactar y publicar artefactos Atlas.
- No ejecuta código de repos absorbidos; su README enfatiza allow-list de archivos, límites de tamaño, rechazo de traversal/symlinks, redacción de secretos y validación Zod.
- Sus artefactos esperados son `atlas/index.json`, `atlas/graph.json`, `atlas/taxonomy.json`, summaries por repo y `atlas/audit.log`.

### 2.3 Snapshot/plataforma `tamv-atlas-nextgen/`

- No debe confundirse con la app raíz ni con el workspace de ingesta.
- Su README declara una plataforma full-stack con frontend React/Vite, backend Node HTTP nativo, Supabase opcional, firma/identidad y scripts de federación.
- Riesgo principal: al estar dentro del repo raíz, `eslint .` también lo recorre y multiplica fallos de formato/Prettier si no hay ignores o formato uniforme.

### 2.4 Deploy y runtime

- Docker usa Bun para instalar y compilar, pero la imagen final ejecuta Node 22 Alpine.
- GitHub Actions construye y publica imagen en GHCR; el deploy SSH solo corre si existe `vars.DEPLOY_HOST`.
- `docker-compose.yml` define dos servicios: `kodex` para la app SSR y `atlas` como perfil opcional de ingesta.

## 3. Hallazgos críticos priorizados

| Prioridad | Hallazgo | Impacto | Recomendación |
| --- | --- | --- | --- |
| P0 | `bun run lint` falla masivamente por Prettier/formato en raíz, `src/`, `tamv-core-atlas/` y `tamv-atlas-nextgen/`. | Un quality gate de CI basado en lint bloquearía merges/deploys. Además oculta errores reales entre miles de avisos de formato. | Ejecutar una campaña controlada de `prettier --write` o acotar `eslint` por workspace; después separar warnings de errores. |
| P0 | No hay script `test` en el `package.json` raíz. | No existe gate estándar de regresión funcional/unitaria para la app raíz. | Añadir `test`/`test:ci` o documentar explícitamente que el gate mínimo es `typecheck + build + lint`. |
| P1 | Naming ambiguo: repo `tamv-core-atlas`, paquete raíz `tamv-core-kodex`, workspace `tamv-core-atlas` y carpeta `tamv-atlas-nextgen`. | Onboarding difícil, riesgo de operar el paquete equivocado y de aplicar checks a scopes no deseados. | Crear un mapa de ownership y scopes de comandos en README/ARCHITECTURE; considerar renombrado gradual o aliases claros. |
| P1 | `tamv-atlas-nextgen/` parece una fusión grande dentro del repo raíz. | Aumenta superficie de build/lint, duplicación de stack y deuda de mantenimiento. | Decidir si será subproyecto mantenido, snapshot de referencia o candidato a subtree/submodule; configurar lint/build por scope. |
| P1 | La ingesta depende de GitHub API/token y artefactos locales. | Reproducibilidad variable por rate limits, permisos y estado remoto. | Mantener fixtures offline mínimos y modo `--validate` sin red como gate de CI. |
| P2 | No hay releases/tags en el snapshot local. | Falta una línea clara de versionado y rollback semántico. | Definir `v0.x` con changelog y criterios de promoción. |

## 4. Lectura profesional de madurez

| Dimensión | Estado real | Riesgo |
| --- | --- | --- |
| Build SSR | Sano localmente: typecheck y build completan. | Bundle principal grande; revisar code-splitting si afecta performance. |
| Lint/Formato | No sano: miles de errores Prettier. | Alto si lint es gate de CI. |
| Tests | No estandarizados en raíz. | Alto para regresiones. |
| Deploy | Docker + GHCR + SSH opcional documentado. | Medio: requiere variables/secrets y validación real de runtime. |
| Seguridad de ingesta | Buenas intenciones documentadas y módulos dedicados (`safe-fs`, `redact`, schemas). | Medio: requiere pruebas automatizadas de traversal, symlinks, secretos y límites. |
| Observabilidad | Documentada como stdout/OpenTelemetry-ready, no como stack instrumentado completo. | Medio. |
| Gobernanza del monorepo | Parcial. | Medio-alto por scopes ambiguos. |

## 5. Conclusión corregida

El repositorio no es simplemente “un proyecto Bun/TanStack con CI fallando”. Es una composición de tres piezas:

1. **App SSR raíz** (`src/`) que sí compila y typecheckea.
2. **Pipeline Atlas** (`tamv-core-atlas/`) orientado a ingesta segura y publicación de conocimiento.
3. **Plataforma NextGen fusionada** (`tamv-atlas-nextgen/`) que introduce backend Node, Supabase opcional y federación, pero también expande la deuda de mantenimiento.

La deuda técnica prioritaria no es “usar Lovable” ni “no tener releases” por sí solo. La deuda prioritaria verificable es: **lint roto por formato, ausencia de test gate raíz, límites de ownership poco claros y alcance excesivo de checks sobre subárboles fusionados**.

## 6. Siguiente plan recomendado

1. **Higiene de calidad:** corregir o aislar lint por workspace hasta tener `bun run lint` verde.
2. **Gates mínimos:** definir `typecheck`, `build`, `lint` y `test:ci` como contratos explícitos.
3. **Mapa de arquitectura:** añadir README raíz o `ARCHITECTURE.md` con ownership de `src/`, `tamv-core-atlas/` y `tamv-atlas-nextgen/`.
4. **Pruebas del pipeline Atlas:** fixtures offline para redacción de secretos, path traversal, symlinks, límites de tamaño y validación de schemas.
5. **Versionado:** tag `v0.1.0` cuando build/lint/tests mínimos estén verdes y documentados.
