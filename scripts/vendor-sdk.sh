#!/usr/bin/env bash
# Copies the Supertext TypeScript SDK (built JavaScript and types) into vendor/supertext-sdk.
# Source: https://github.com/Supertext/Supertext-API-SDK-and-Guide (sdk/typescript).
#
#   scripts/vendor-sdk.sh [commit-or-branch]        (default: main)
#   SDK_DIR=/path/to/clone scripts/vendor-sdk.sh    (use a local clone as it is)
#
# It is a dependency of the app ("supertext-sdk": "file:vendor/supertext-sdk"); the Docker
# image copies vendor/ before npm ci. Same script as the other Supertext plugins (e.g. Directus).
set -euo pipefail
cd "$(dirname "$0")/.."
ref="${1:-main}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
if [ -n "${SDK_DIR:-}" ]; then
  src="$(cd "$SDK_DIR" && pwd)"
else
  git clone -q https://github.com/Supertext/Supertext-API-SDK-and-Guide "$work/sdk"
  git -C "$work/sdk" checkout -q "$ref"
  src="$work/sdk"
fi
commit="$(git -C "$src" rev-parse HEAD)"
version="$(node -p "require('$src/sdk/typescript/package.json').version")"
cp -R "$src/sdk/typescript" "$work/ts"
(cd "$work/ts" && npm ci --no-audit --no-fund --silent && npm run --silent build)
rm -rf vendor/supertext-sdk
mkdir -p vendor/supertext-sdk
cp "$work"/ts/dist/*.js "$work"/ts/dist/*.d.ts vendor/supertext-sdk/
cp "$src/sdk/typescript/LICENSE" vendor/supertext-sdk/LICENSE
printf '{\n  "name": "supertext-sdk",\n  "version": "%s",\n  "private": true,\n  "type": "module",\n  "main": "./index.js",\n  "types": "./index.d.ts",\n  "license": "MIT"\n}\n' "$version" > vendor/supertext-sdk/package.json
printf '%s\n' "$commit" > vendor/supertext-sdk/COMMIT
printf '%s\n' "$version" > vendor/supertext-sdk/VERSION
printf '# Supertext SDK (bundled copy)\n\nBuilt JavaScript of the TypeScript part of the [Supertext SDK](https://github.com/Supertext/Supertext-API-SDK-and-Guide),\nversion %s, commit `%s`.\n\nDon'"'"'t edit these files: fix the SDK in its own repository, then run `scripts/vendor-sdk.sh`.\n' "$version" "$commit" > vendor/supertext-sdk/README.md
echo "vendor/supertext-sdk: Supertext SDK (TypeScript) $version from commit $commit"
