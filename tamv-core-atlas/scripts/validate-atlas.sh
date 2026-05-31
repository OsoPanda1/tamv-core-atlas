#!/usr/bin/env bash
set -euo pipefail

test -f atlas/index.json    || { echo "missing atlas/index.json"; exit 1; }
test -f atlas/graph.json    || { echo "missing atlas/graph.json"; exit 1; }
test -f atlas/taxonomy.json || { echo "missing atlas/taxonomy.json"; exit 1; }

npm run validate
npm run security:scan -- --validate

echo "atlas OK"