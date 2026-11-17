#!/usr/bin/env bash
set -euo pipefail
cd "$1"
npm test
node --check app.js
node --test rpg/tests/*.test.js
find rpg -maxdepth 1 -name '*.js' -exec node --check '{}' ';'
cd 3D
npm ci --ignore-scripts --no-audit --no-fund
node scripts/vendor-three.mjs
node --test tests/*.test.js
node --check app.js
