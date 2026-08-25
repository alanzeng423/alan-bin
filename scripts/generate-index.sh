#!/bin/bash
# Generate files/index.json by scanning the files/ directory
# Run this after adding/removing files in the files/ directory, then commit and push.
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FILES_DIR="$SCRIPT_DIR/../files"
OUT="$FILES_DIR/index.json"

entries=()

# Add directories and files
while IFS= read -r -d '' f; do
  rel="${f#$FILES_DIR/}"
  if [ "$rel" = "index.json" ]; then continue; fi
  if [ -d "$f" ]; then
    entries+=("{\"name\":\"$rel\",\"path\":\"$rel\",\"type\":\"dir\"}")
  else
    size=$(wc -c < "$f" | tr -d ' ')
    entries+=("{\"name\":\"$rel\",\"path\":\"$rel\",\"type\":\"file\",\"size\":$size}")
  fi
done < <(find "$FILES_DIR" -mindepth 1 -not -path '*/.*' -print0 | sort -z)

{
  echo "{"
  echo "  \"updated_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"files\": ["
  total=${#entries[@]}
  for i in "${!entries[@]}"; do
    comma=","
    if [ $i -eq $((total - 1)) ]; then comma=""; fi
    echo "    ${entries[$i]}$comma"
  done
  echo "  ]"
  echo "}"
} > "$OUT"

echo "Generated $OUT with $total entries."
