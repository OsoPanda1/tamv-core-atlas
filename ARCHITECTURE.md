# Arquitectura de `tamv-core-atlas`

Este repositorio es un **contenedor operativo** para tres dominios distintos. La
regla principal es no mezclar responsabilidades: cada carpeta tiene un dueño,
un runtime y un ciclo de cambio propio.

## Mapa de carpetas y límites de contexto

| Ruta                  | Rol canónico                                                                                 | Runtime / stack                                        | Estado                               | Regla de frontera                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `/src`                | Aplicación web principal **TAMV Core Kodex**                                                 | TanStack Start, Vite, React, TypeScript, shadcn/ui     | Activo                               | Puede leer datos estáticos del repo y llamar APIs externas, pero no debe ejecutar el pipeline Atlas directamente en el navegador. |
| `/tamv-core-atlas`    | Pipeline de ingestión y publicación del **Atlas vivo**                                       | Node 22+, TypeScript, Octokit, Zod                     | Activo como workspace npm/Bun        | Produce artefactos en `tamv-core-atlas/atlas/*`; no importa componentes React ni depende de la UI.                                |
| `/tamv-atlas-nextgen` | Aplicación federada/nextgen importada para referencia, backend Node, Supabase y experimentos | Vite/React, Node HTTP, Supabase, scripts de federación | Congelado para integración selectiva | No forma parte del workspace raíz ni del lint/build raíz. Sus cambios deben validarse con sus propios scripts.                    |
| `/.github/workflows`  | Automatización CI/CD del contenedor                                                          | GitHub Actions, Docker Buildx, GHCR                    | Activo                               | Debe compilar la app raíz y publicar imagen; no debe asumir secretos de despliegue salvo que estén documentados.                  |
| `/docs`               | Especificaciones y contratos compartidos                                                     | JSON/Markdown                                          | Activo                               | Contiene documentos consumibles por la UI o por revisión humana; no es runtime.                                                   |

## Diagrama de componentes

```text
┌───────────────────────────────────────────────────────────────────┐
│ Repo raíz: TAMV Core Kodex                                         │
│                                                                   │
│  ┌──────────────────────┐         lee/expone docs y seeds         │
│  │ /src Web SSR         │ ───────────────────────────────────────┐ │
│  │ TanStack Start       │                                       │ │
│  └──────────┬───────────┘                                       │ │
│             │ build Docker/Nitro                                │ │
│             v                                                   │ │
│  ┌──────────────────────┐                                       │ │
│  │ Docker image runtime │                                       │ │
│  └──────────────────────┘                                       │ │
│                                                                   │
│  ┌──────────────────────┐     produce JSON/Markdown               │
│  │ /tamv-core-atlas     │ ────────────────────────> atlas/*       │
│  │ ingestion pipeline   │                                         │
│  └──────────────────────┘                                         │
│                                                                   │
│  ┌──────────────────────┐                                         │
│  │ /tamv-atlas-nextgen  │  referencia federada; validación propia │
│  └──────────────────────┘                                         │
└───────────────────────────────────────────────────────────────────┘
```

## Flujo de dependencias permitido

```text
.github/workflows ──builds──> Dockerfile ──runs──> /src
/src              ──reads────> /docs and static wiki content
/src              ──may read─> /tamv-core-atlas/atlas/* generated artifacts
/tamv-core-atlas  ──writes───> /tamv-core-atlas/atlas/*
/tamv-atlas-nextgen ──no implicit dependency──> root build/lint
```

Dependencias prohibidas:

- `/tamv-core-atlas` no debe importar `src/components/*` ni rutas TanStack.
- `/src` no debe importar código ejecutable de `tamv-atlas-nextgen`.
- La CI raíz no debe lintar ni compilar `tamv-atlas-nextgen` como efecto
  colateral; ese árbol tiene `package.json`, tests y workflows propios.

## Backend y datos

- El runtime raíz actual es una app SSR TanStack Start; no hay un backend API
  raíz separado.
- El backend Node/Supabase detectado vive en `/tamv-atlas-nextgen/backend` y es
  parte del dominio nextgen congelado.
- El pipeline `/tamv-core-atlas` usa GitHub API para descubrimiento e ingesta y
  publica artefactos JSON/Markdown; esos artefactos pueden ser consumidos por la
  UI raíz cuando se agregue un loader explícito.

## Decisiones operativas

1. **Bun se conserva** para la app raíz por velocidad y lockfile existente.
2. **npm workspace se conserva** para `tamv-core-atlas` porque sus scripts ya
   están declarados como workspace en el `package.json` raíz.
3. **`tamv-atlas-nextgen` queda fuera del workspace raíz** hasta que exista una
   migración planificada; esto evita que formatos, versiones React/Vite o reglas
   ESLint de esa app rompan el CI de Kodex.
4. **La documentación raíz es la fuente de verdad** para boundaries; los README
   internos describen cada subdominio.

## Convención para nuevas features

- UI/SSR: agregar en `/src` y validar con `bun run typecheck`, `bun run lint` y
  `bun run build`.
- Ingestión Atlas: agregar en `/tamv-core-atlas/ingestion` y validar con
  `bun run atlas:validate` o scripts workspace equivalentes.
- Nextgen/federación: trabajar dentro de `/tamv-atlas-nextgen` y ejecutar sus
  scripts locales; no introducir dependencias implícitas hacia la app raíz.
