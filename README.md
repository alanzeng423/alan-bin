# alan-bin

Personal file bin hosted at **[bin.alanzeng.com](https://bin.alanzeng.com)** — a simple GitHub-backed file storage site for config files, cfgs, notes, scripts, and miscellaneous stuff.

## Architecture

- **Storage:** GitHub repo (`alanzeng423/alan-bin`), `files/` directory
- **Runtime:** Cloudflare Worker with KV caching
- **Domain:** `bin.alanzeng.com` (custom domain via Cloudflare)
- **Design:** Simple directory browser with text file viewer, image preview, and raw file download

## How to add files

1. Add files under `files/` directory in this repo (can be organized in subdirectories)
2. Update `files/index.json` to register files/directories — or run the helper script:
   ```bash
   bash scripts/generate-index.sh
   ```
   This scans `files/` and regenerates `files/index.json` automatically.
3. Commit and push to `main`:
   ```bash
   git add files/
   git commit -m "add: <description>"
   git push
   ```
4. Changes appear within 5 minutes (KV cache TTL). To see them immediately, clear the cache:
   ```bash
   npx wrangler kv key delete bin:index --binding BIN_CACHE --remote
   ```

## File types supported

- **Text/code files** (viewed inline with monospace font): `.cfg`, `.txt`, `.md`, `.json`, `.js`, `.ts`, `.py`, `.sh`, `.yaml`, `.yml`, `.toml`, `.ini`, `.conf`, `.xml`, `.html`, `.css`, `.cpp`, `.c`, `.h`, `.rs`, `.go`, `.java`, `.sql`, `.log`, `.env`, and more
- **Images** (displayed inline): `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.ico`
- **Binary files** (download link): `.zip`, `.tar`, `.gz`, `.pdf`, `.mp3`, `.mp4`, and others

## URLs

- Web UI: `https://bin.alanzeng.com/`
- Raw file: `https://bin.alanzeng.com/<path>?raw=1`
- API listing: `https://bin.alanzeng.com/api`
- Health check: `https://bin.alanzeng.com/health`
- GitHub source: https://github.com/alanzeng423/alan-bin
- "Edit on GitHub" links appear on every file page for quick edits.

## index.json format

```json
{
  "updated_at": "2026-08-25T00:00:00Z",
  "files": [
    { "name": "dirname", "path": "dirname", "type": "dir" },
    { "name": "dirname/subdir", "path": "dirname/subdir", "type": "dir" },
    { "name": "dirname/file.txt", "path": "dirname/file.txt", "type": "file", "size": 1234 }
  ]
}
```

All paths are relative to `files/`. Directories must have an entry; file entries must include `size` in bytes.
