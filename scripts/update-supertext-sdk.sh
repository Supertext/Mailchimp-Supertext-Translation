#!/usr/bin/env bash
# Copies the TypeScript Supertext SDK (https://github.com/Supertext/Supertext-API-SDK-and-Guide,
# sdk/typescript/src) into src/vendor/supertext-sdk/ and records the commit in its VERSION file.
#
#   scripts/update-supertext-sdk.sh [ref]     ref: tag, branch or commit (default: main)
#   scripts/update-supertext-sdk.sh --check   CI: fails if the copy differs from the recorded commit
#
# The SDK isn't on npm yet, so the app ships a copy, compiled with the app. Never edit
# src/vendor/supertext-sdk by hand: fix the SDK repository and run this script.
set -euo pipefail

REPO=https://github.com/Supertext/Supertext-API-SDK-and-Guide
ROOT=$(cd "$(dirname "$0")/.." && pwd)
DEST="$ROOT/src/vendor/supertext-sdk"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

if [ "${1:-}" = "--check" ]; then
	ref=$(sed -n 's/^commit: //p' "$DEST/VERSION")
else
	ref=${1:-main}
fi

git -c advice.detachedHead=false clone -q --filter=blob:none --no-checkout "$REPO" "$TMP/sdk"
git -C "$TMP/sdk" checkout -q "$ref" -- sdk/typescript/src sdk/typescript/LICENSE
commit=$(git -C "$TMP/sdk" rev-parse "$ref^{commit}")

mkdir -p "$TMP/out"
cp "$TMP"/sdk/sdk/typescript/src/*.ts "$TMP/out/"
cp "$TMP/sdk/sdk/typescript/LICENSE" "$TMP/out/"
printf 'Supertext SDK for TypeScript, copied from %s (sdk/typescript/src)\ncommit: %s\n' "$REPO" "$commit" > "$TMP/out/VERSION"

if [ "${1:-}" = "--check" ]; then
	if ! diff -r "$TMP/out" "$DEST"; then
		echo "src/vendor/supertext-sdk differs from SDK commit $commit: run scripts/update-supertext-sdk.sh $commit" >&2
		exit 1
	fi
	echo "src/vendor/supertext-sdk matches SDK commit $commit"
	exit 0
fi

rm -rf "$DEST"
mkdir -p "$(dirname "$DEST")"
cp -R "$TMP/out" "$DEST"
echo "src/vendor/supertext-sdk updated to SDK commit $commit"
