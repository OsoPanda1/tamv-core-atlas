# Arquitectura canónica de tamv-core-atlas

Este monorepo contiene tres superficies coordinadas, pero un solo runtime operativo para el dominio Atlas.

## Fronteras

| Ruta | Función | Regla |
|---|---|---|
| /src | UI/SSR TAMV Core Kodex | consume datos y APIs; no ejecuta pipelines de ingestión en navegador |
| /tamv-core-atlas | ingestión/publicación Atlas | produce artefactos; no depende de React |
| /tamv-atlas-nextgen/backend | runtime Atlas Core y API | concentra módulos, skills, protocolos, Isabella, BookPI y observabilidad |
| /tamv-atlas-nextgen/federation | superficies federadas heredadas | puede evolucionar sin crear un runtime backend paralelo |
| /docs | contratos y especificaciones | no contiene lógica ejecutable |

## Runtime único

El punto de convergencia es:

`tamv-atlas-nextgen/backend/src/tamvCoreRuntime.js`

El runtime contiene:

- ModuleRegistry
- SkillRegistry
- ProtocolRegistry
- RuntimeMonitor
- BookPIChain
- IsabellaEngine
- AtlasKernelRuntime
- AtlasCoreRuntime

Los archivos históricos `isabellaEngine.js`, `atlasKernelRuntime.js` y `omniKernelGateway.js` son adaptadores de compatibilidad. Reexportan implementaciones del núcleo y no deben volver a convertirse en runtimes independientes.

## Flujo operativo

```text
HTTP
  ↓
server.js
  ↓
AtlasCoreRuntime
  ├── ModuleRegistry
  ├── SkillRegistry
  ├── ProtocolRegistry
  ├── Isabella
  ├── Atlas
  ├── BookPI
  └── RuntimeMonitor
        ↓
  AtlasStore / Supabase / XR / WebRTC
  (proyección opcional)
```

## Protocolos y skills

Una ruta de ejecución válida sigue:

`request → protocol → skill → module/engine → result → telemetry → ledger`

Una skill debe estar registrada antes de ser ejecutable. Un protocolo solo puede invocar skills registradas.

## Rendimiento

El monitor conserva una ventana acotada de muestras y expone p50/p95/p99/error rate. Las operaciones de persistencia externa deben permanecer fuera del camino crítico cuando no sean necesarias para decidir la operación.

No se declara latencia cero; se mide latencia real.

## Seguridad

El runtime no ejecuta código absorbido por el pipeline Atlas.

El pipeline mantiene:

- allow-list
- protección contra symlinks
- path traversal defense
- secret redaction
- límites de tamaño
- validación estructural
- retries/backoff
- permisos mínimos

Las futuras integraciones de embeddings, Neo4j, Qdrant, Redis, colas u OpenTelemetry deben entrar como proveedores explícitos. Ninguna debe crear otro núcleo de decisión.
