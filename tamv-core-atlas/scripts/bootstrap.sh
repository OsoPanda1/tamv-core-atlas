#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit it and set GITHUB_TOKEN."
fi

npm install
echo "bootstrap complete. Next: edit .env, then run ./scripts/sync-all.sh"