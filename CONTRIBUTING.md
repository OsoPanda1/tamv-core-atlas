# Guía de contribución

## Antes de cambiar código

1. Lee `ARCHITECTURE.md` para confirmar el límite de contexto afectado.
2. Identifica si el cambio toca la app raíz (`/src`), el pipeline
   (`/tamv-core-atlas`) o el árbol nextgen (`/tamv-atlas-nextgen`).
3. Evita mezclar cambios de infraestructura, UI y kernel en el mismo PR salvo
   que exista una razón explícita.

## Comandos de validación raíz

```bash
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun run build
```

El lint raíz está intencionalmente acotado al contenedor Kodex y al workspace
`tamv-core-atlas`. El árbol `/tamv-atlas-nextgen` se valida con su propio
`package.json` y no participa en el CI raíz hasta que sea migrado formalmente.

## Cambios en `/src`

- Usa TypeScript estricto y componentes React funcionales.
- Mantén imports con alias `@/` cuando apunten a código de `src`.
- No importes código ejecutable desde `/tamv-atlas-nextgen`.
- Si la UI consume datos del pipeline Atlas, crea un loader explícito y documenta
  el contrato JSON usado.

## Cambios en `/tamv-core-atlas`

- No ejecutes código de repos ingeridos; solo leer metadatos/documentación
  permitida.
- Valida esquemas con Zod antes de publicar artefactos.
- Mantén redacción de secretos y defensa contra path traversal.
- Si cambian salidas en `atlas/*`, documenta el cambio de contrato.

## Cambios en `/tamv-atlas-nextgen`

Este árbol es una referencia federada/nextgen con backend y Supabase propios.
Antes de editarlo:

- Revisa su README local.
- Ejecuta sus scripts locales (`npm run lint`, `npm run test`, `npm run build`)
  desde esa carpeta cuando sea posible.
- No asumas que sus versiones de React, Vite o ESLint coinciden con la app raíz.

## Pull requests

Incluye siempre:

- Resumen de cambios.
- Boundary afectado.
- Comandos ejecutados y resultado.
- Riesgos conocidos o validaciones pendientes.
