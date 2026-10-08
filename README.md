# TAMV Core Atlas

**TAMV Core Atlas** es el runtime operativo y atlas semántico del ecosistema TAMV. Este monorepo reúne la aplicación SSR **TAMV Core Kodex**, el pipeline de ingestión **tamv-core-atlas** y el runtime federado **tamv-atlas-nextgen**.

La arquitectura actual converge los componentes cognitivos y operativos en un único núcleo ejecutable: **Atlas Core Runtime**.

## Arquitectura canónica

```text
                         TAMV CORE ATLAS
                               │
              ┌────────────────┴────────────────┐
              │                                 │
        Core Kodex UI                    Atlas Core Runtime
      TanStack Start / SSR                       │
              │                    ┌─────────────┼─────────────┐
              │                    │             │             │
              │                Modules        Skills       Protocols
              │                    │             │             │
              │                    └─────────────┼─────────────┘
              │                                  │
              │                 ┌────────────────┼────────────────┐
              │                 │                │                │
              │             Isabella           Atlas            BookPI
              │             cognition         runtime           ledger
              │                 │                │                │
              │                 └────────────────┼────────────────┘
              │                                  │
              └────────────── API / telemetry ───┴──── Observability
                                                 │
                                      Supabase / XR / WebRTC
                                      (persistencia opcional)
```

### Principio de convergencia

Existe **un solo runtime canónico**. Los antiguos módulos `AtlasKernelRuntime`, `IsabellaEngine` y `OmniKernelGateway` se mantienen como adaptadores de compatibilidad que reexportan el núcleo común; no contienen una segunda implementación.

Esto evita divergencia de estado, doble ledger, doble motor cognitivo y decisiones diferentes según la ruta HTTP utilizada.

## Componentes del monorepo

| Componente | Responsabilidad | Runtime |
|---|---|---|
| `src/` | UI/SSR, navegación, consola y superficies Atlas | TanStack Start + React |
| `tamv-core-atlas/` | Descubrimiento, ingestión, normalización, clasificación, relaciones y publicación de artefactos | Node/TypeScript |
| `tamv-atlas-nextgen/backend/` | Runtime operativo, API, cognición, protocolos y persistencia | Node.js |
| `tamv-atlas-nextgen/federation/` | Federaciones y superficies experimentales heredadas | React/Vite |
| `docs/` | Contratos, especificaciones y auditorías | JSON/Markdown |

## Atlas Core Runtime

Archivo canónico:

`tamv-atlas-nextgen/backend/src/tamvCoreRuntime.js`

El runtime contiene:

### Modules

Los módulos representan dominios funcionales registrados y versionados.

Módulos incluidos:

- `atlas.ingestion`
- `isabella.cognition`
- `governance.runtime`
- `observability.runtime`

Cada módulo declara dominio, versión y capacidades.

### Skills

Las skills son unidades ejecutables de capacidad.

Skills incluidas:

- `skill.isabella.chat`
- `skill.isabella.entropy`
- `skill.atlas.protocol`

Las skills se ejecutan mediante el registro canónico y quedan medidas por el monitor de runtime.

### Protocols

Los protocolos son secuencias gobernadas de skills.

Protocolos incluidos:

- `protocol.isabella.audit`
- `protocol.atlas.execute`

Un protocolo no ejecuta código arbitrario: resuelve únicamente skills previamente registradas.

## Isabella

Isabella es el motor cognitivo/epistémico integrado en Atlas Core.

Perfiles soportados:

- `general`
- `contra-auditoria`
- `simulacion`
- `secretaria`
- `gobernanza`
- `auditoria-ecosistema`

Capacidades:

- contra-auditoría cognitiva
- simulación epistemológica
- análisis de entropía de Shannon
- validación heptafederada determinista
- auditoría de claims
- auditoría de dossier/ecosistema
- ledger de eventos cognitivos
- adaptadores de visión, audio y háptica

### Importante sobre la evidencia

Los scores heptafederados y el factor OOD incluidos en el runtime son **heurísticas deterministas**. No constituyen validación externa, embeddings de un modelo fundacional ni prueba criptográfica de una afirmación.

Para elevar el nivel de evidencia deben conectarse proveedores externos de evidencia/embeddings bajo interfaces gobernadas, sin convertir esos proveedores en autoridad implícita.

## Atlas Kernel

El runtime Atlas conserva:

- usuarios
- ledger económico
- ejecución de protocolos
- auditoría
- estados de ejecución

La selección de rutas de protocolo considera score y riesgo ético:

`utility = score - 2 × ethicalRisk`

El runtime rechaza protocolos sin rutas válidas.

## BookPI

BookPI proporciona un ledger local encadenado:

- hash SHA-256
- firma HMAC-SHA-256
- referencia al bloque anterior
- eventos de protocolo
- eventos de fallo

BookPI local es una capa de integridad del runtime. No debe confundirse con una blockchain pública ni con una prueba externa de autenticidad.

## Observabilidad y latencia

Cada skill y protocolo registra duración, éxito/error y timestamp.

El monitor mantiene una ventana acotada de muestras y calcula:

- p50
- p95
- p99
- error rate
- solicitudes totales
- éxitos
- fallos

El objetivo es **latencia baja y medible**, no la afirmación artificial de «latencia cero». La persistencia externa no debe bloquear el camino crítico cuando pueda proyectarse de forma asíncrona.

## API del Core

### Estado

`GET /v1/core/status`

Devuelve módulos, skills, protocolos, estado del runtime, monitor y número de bloques BookPI.

### Catálogos

`GET /v1/core/modules`

`GET /v1/core/skills`

`GET /v1/core/protocols`

### Ejecución

`POST /v1/core/skills/execute`

Payload mínimo:

```json
{
  "skillId": "skill.isabella.entropy",
  "context": {
    "probabilities": [0.1, 0.9]
  }
}
```

`POST /v1/core/protocols/execute`

Payload mínimo:

```json
{
  "protocolId": "protocol.isabella.audit",
  "context": {
    "input": "Premisa A\\n---\\nPremisa B",
    "profile": "contra-auditoria"
  }
}
```

Las rutas devuelven también el estado de monitorización posterior a la operación.

## API Isabella compatible

Se mantienen rutas existentes para no romper clientes:

- `POST /api/v1/chat`
- `POST /api/v1/vision`
- `POST /api/v1/audio`
- `POST /api/v1/haptics`
- `POST /api/v1/ledger/events`
- `GET /api/v1/ledger/events/:id`
- `GET /api/v1/plugins`
- `POST /api/v1/plugins/install`

Estas rutas utilizan la misma instancia de Isabella perteneciente al Atlas Core Runtime.

## Persistencia e infraestructura

La persistencia Atlas/Supabase continúa siendo opcional.

Cuando están disponibles:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

el servidor puede proyectar usuarios, ejecuciones, ledger, eventos XR y señales WebRTC hacia AtlasStore.

La persistencia no redefine el runtime cognitivo: es una capa de almacenamiento/proyección.

## Pipeline Atlas

El workspace `tamv-core-atlas` conserva el pipeline:

```text
discover
   ↓
fetch
   ↓
extract
   ↓
normalize
   ↓
classify
   ↓
relate
   ↓
redact
   ↓
publish
```

El pipeline no ejecuta código absorbido.

Controles documentados:

- allow-list de archivos
- rechazo de symlinks
- protección contra path traversal
- límites de tamaño
- redacción de secretos
- validación Zod
- retries/backoff
- manejo de rate limits
- permisos mínimos de workflows

## Seguridad

El runtime aplica separación entre:

1. entrada HTTP
2. módulos
3. skills
4. protocolos
5. persistencia
6. observabilidad

No se permite convertir una ruta HTTP en un bypass del catálogo de capacidades.

Las capacidades deben existir en el registro antes de ser ejecutables.

## Validación

Desde `tamv-atlas-nextgen`:

```bash
npm run core:test
npm run core:check
```

Para la aplicación federada:

```bash
npm run typecheck
npm run build
```

Para el pipeline Atlas:

```bash
npm --workspace tamv-core-atlas run validate
npm --workspace tamv-core-atlas run build
```

El estado de CI remoto debe considerarse evidencia independiente; un comando documentado no equivale a una ejecución exitosa.

## Documentación técnica

- `ARCHITECTURE.md` — límites y dependencias del monorepo.
- `docs/atlas-kernel-spec.json` — especificación conceptual del Atlas Kernel.
- `DEPLOYMENT.md` — despliegue.
- `docs/repository-audit.md` — auditoría del repositorio.
- `tamv-core-atlas/README.md` — pipeline de ingestión.
- `tamv-atlas-nextgen/README.md` — runtime federado.

## Estado real

La convergencia implementada elimina el problema más importante del backend heredado: archivos con extensión `.js` que contenían sintaxis TypeScript y, por tanto, no podían considerarse un runtime Node válido.

La arquitectura queda preparada para evolucionar hacia:

- proveedores reales de embeddings
- evidencia externa heptafederada
- colas y backpressure
- persistencia de ledger
- OpenTelemetry
- almacenamiento vectorial
- grafo semántico
- políticas de autorización más estrictas

Esas integraciones deben añadirse como proveedores detrás de contratos explícitos. No deben introducir otro runtime paralelo.
