# CI/CD y contribución operacional

Los workflows de esta carpeta pertenecen al contenedor raíz **TAMV Core Kodex**.
No deben validar implícitamente `/tamv-atlas-nextgen` porque ese árbol tiene
runtime y configuración propios.

## Workflow `deploy.yml`

- En `push` a `main` construye la imagen Docker y la publica en GHCR.
- En `workflow_dispatch` permite ejecutar el mismo proceso manualmente.
- El job de despliegue remoto solo debe usarse cuando existan las variables y
  secretos documentados en `DEPLOYMENT.md`.

## Troubleshooting rápido

1. Fallo en build Docker: ejecutar `bun run build` localmente y revisar Nitro.
2. Fallo en login/push GHCR: revisar permisos `packages: write` y visibilidad
   del repositorio.
3. Fallo SSH: confirmar `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH` y
   `DEPLOY_SSH_KEY`.
4. Fallo de lint: confirmar que el cambio pertenece al boundary raíz; si es
   nextgen, validarlo desde `/tamv-atlas-nextgen`.
