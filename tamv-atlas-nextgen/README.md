# TAMV Atlas — Runtime federado

Este subárbol contiene la superficie federada/nextgen del Atlas y su backend operativo.

## Runtime canónico

El backend converge en:

`backend/src/tamvCoreRuntime.js`

El núcleo único registra y ejecuta:

- **Modules:** `atlas.ingestion`, `isabella.cognition`, `governance.runtime`, `observability.runtime`
- **Skills:** `skill.isabella.chat`, `skill.isabella.entropy`, `skill.atlas.protocol`
- **Protocols:** `protocol.isabella.audit`, `protocol.atlas.execute`
- **Cognition:** Isabella heptafederada, contra-auditoría, simulación, entropía y auditoría de claims.
- **Integrity:** BookPI con SHA-256 + HMAC-SHA-256.
- **Monitoring:** p50/p95/p99, error rate y contadores operativos.

Los archivos históricos `isabellaEngine.js`, `atlasKernelRuntime.js` y `omniKernelGateway.js` son adaptadores de compatibilidad. No son runtimes alternativos.

## API Core

- `GET /v1/core/status`
- `GET /v1/core/modules`
- `GET /v1/core/skills`
- `GET /v1/core/protocols`
- `POST /v1/core/skills/execute`
- `POST /v1/core/protocols/execute`

Las rutas heredadas de Isabella continúan disponibles para compatibilidad.

## Validación rápida

```bash
npm run core:test
```

## Persistencia

AtlasStore/Supabase, XR y WebRTC permanecen como infraestructura de proyección opcional. No sustituyen al runtime canónico.

## Limitaciones epistemológicas

Los scores federados y OOD son heurísticas deterministas. Para afirmaciones de producción deben incorporarse proveedores externos de evidencia, embeddings y verificación bajo contratos explícitos.

## Seguridad

El pipeline de ingestión no ejecuta código absorbido. Las nuevas capacidades deben entrar como modules, skills o protocols registrados; no se permite crear un segundo núcleo de decisión.
