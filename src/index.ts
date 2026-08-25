interface Env {
  BIN_CACHE: KVNamespace;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  FILES_PATH: string;
}

interface GHContent {
  name: string;
  path: string;
  type: "file" | "dir";
  size: number;
  download_url: string | null;
}

const CACHE_TTL = 300;
const CACHE_TTL_LONG = 1800;
const ICONS: Record<string, string> = {
  dir: "\u{1F4C1}",
  cfg: "\u{2699}\uFE0F",
  txt: "\u{1F4C4}",
  md: "\u{1F4DD}",
  json: "\u{1F4CB}",
  js: "\u{1F4DC}",
  ts: "\u{1F4DC}",
  py: "\u{1F40D}",
  sh: "\u{1F4BB}",
  yaml: "\u{2699}\uFE0F", yml: "\u{2699}\uFE0F",
  png: "\u{1F5BC}\uFE0F", jpg: "\u{1F5BC}\uFE0F", jpeg: "\u{1F5BC}\uFE0F", gif: "\u{1F5BC}\uFE0F", svg: "\u{1F5BC}\uFE0F", webp: "\u{1F5BC}\uFE0F",
  zip: "\u{1F4E6}", tar: "\u{1F4E6}", gz: "\u{1F4E6}",
  pdf: "\u{1F4D5}",
  mp3: "\u{1F3B5}", wav: "\u{1F3B5}", flac: "\u{1F3B5}",
  mp4: "\u{1F3AC}", mov: "\u{1F3AC}", mkv: "\u{1F3AC}",
  default: "\u{1F4C4}",
};
const TEXT_EXTS = new Set(["txt","md","cfg","ini","conf","json","js","ts","jsx","tsx","py","sh","bash","zsh","yaml","yml","toml","xml","html","css","scss","less","c","cpp","h","hpp","rs","go","java","rb","php","sql","log","env","gitignore","dockerfile","makefile","csv","tsv","vue","svelte","autoexec",""]);

function escapeHtml(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function isText(name: string): boolean {
  const ext = name.split(".").pop()!.toLowerCase();
  return TEXT_EXTS.has(ext);
}

function iconFor(name: string, type: "file" | "dir"): string {
  if (type === "dir") return ICONS.dir;
  const ext = name.split(".").pop()!.toLowerCase();
  return ICONS[ext] ?? ICONS.default;
}

function fileSize(n: number): string {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}

async function ghFetch(url: string): Promise<Response> {
  return fetch(url, { headers: { "User-Agent": "alan-bin-worker", "Accept": "application/vnd.github.v3+json" } });
}

async function listDir(path: string, env: Env): Promise<GHContent[] | null> {
  const key = `dir:${path || "_root"}`;
  const cached = await env.BIN_CACHE.get<string[]>(key, "json");
  if (cached) return cached as unknown as GHContent[];
  const apiPath = path ? `${env.FILES_PATH}/${path}` : env.FILES_PATH;
  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${apiPath}?ref=${env.GITHUB_BRANCH}`;
  const res = await ghFetch(url);
  if (!res.ok) return null;
  const data = await res.json() as GHContent[];
  if (!Array.isArray(data)) return null;
  const sorted = data.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  await env.BIN_CACHE.put(key, JSON.stringify(sorted), { expirationTtl: CACHE_TTL });
  return sorted;
}

async function getRaw(path: string, env: Env): Promise<string | null> {
  const key = `raw:${path}`;
  const cached = await env.BIN_CACHE.get(key);
  if (cached !== null) return cached;
  const url = `https://raw.githubusercontent.com/${env.GITHUB_REPO}/${env.GITHUB_BRANCH}/${env.FILES_PATH}/${path}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  await env.BIN_CACHE.put(key, text, { expirationTtl: CACHE_TTL_LONG });
  return text;
}

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#fff;--bg2:#f6f8fa;--bg3:#eaeef2;
  --border:#d0d7de;--border2:#d8dee4;
  --fg:#1f2328;--fg2:#656d76;--fg3:#8c959f;
  --link:#0969da;--link-hover:#0550ae;
  --red:#cf222e;--green:#1a7f37;
  --radius:6px;--font:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC",Helvetica,Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
}
@media(prefers-color-scheme:dark){
  :root{
    --bg:#0d1117;--bg2:#161b22;--bg3:#21262d;
    --border:#30363d;--border2:#30363d;
    --fg:#e6edf3;--fg2:#8b949e;--fg3:#6e7681;
    --link:#2f81f7;--link-hover:#58a6ff;
    --red:#f85149;--green:#3fb950;
  }
}
html{font-size:14px;line-height:1.5}
body{font-family:var(--font);background:var(--bg);color:var(--fg);-webkit-font-smoothing:antialiased}
a{color:var(--link);text-decoration:none}
a:hover{color:var(--link-hover);text-decoration:underline}
code,pre{font-family:var(--mono)}
.container{max-width:1012px;margin:0 auto;padding:0 16px}
.site-header{background:var(--bg2);border-bottom:1px solid var(--border);padding:12px 0}
.site-header .container{display:flex;align-items:center;gap:12px}
.brand{font-size:16px;font-weight:700;color:var(--red);white-space:nowrap;display:flex;align-items:center;gap:6px}
.brand:hover{color:var(--red);text-decoration:none;opacity:.9}
.brand-dot{width:8px;height:8px;border-radius:50%;background:var(--red);display:inline-block}
.brand-sub{color:var(--fg2);font-weight:400;font-size:13px}
.header-nav{display:flex;gap:16px;margin-left:auto}
.header-nav a{color:var(--fg2);font-size:14px}
.header-nav a:hover{color:var(--link);text-decoration:none}

/* Breadcrumb */
.crumbs{padding:16px 0;font-size:14px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.crumbs a{color:var(--fg2)}
.crumbs a:hover{color:var(--link)}
.crumbs .sep{color:var(--fg3)}
.crumbs .cur{color:var(--fg);font-weight:500}

/* File list */
.file-list{border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:24px}
.file-row{display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;padding:8px 16px;border-bottom:1px solid var(--border);font-size:14px}
.file-row:last-child{border-bottom:none}
.file-row:nth-child(even){background:var(--bg2)}
.file-row:hover{background:var(--bg3)}
.file-name{display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.file-name a{color:var(--fg);font-weight:500}
.file-name a:hover{color:var(--link)}
.file-size{color:var(--fg3);font-size:12px;font-family:var(--mono);white-space:nowrap}
.file-raw{font-size:12px;color:var(--fg2);white-space:nowrap}
.file-raw a{color:var(--fg3)}

/* File viewer */
.file-view{border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:24px}
.file-head{background:var(--bg2);padding:8px 16px;border-bottom:1px solid var(--border);font-size:13px;color:var(--fg2);display:flex;justify-content:space-between;align-items:center;gap:8px}
.file-head .fname{font-family:var(--mono);font-weight:600;color:var(--fg);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.file-head .actions{display:flex;gap:8px;flex-shrink:0}
.file-head a{color:var(--fg2);font-size:12px}
pre.file-code{background:var(--bg);padding:16px;overflow-x:auto;font-size:13px;line-height:1.5;tab-size:4;-moz-tab-size:4;max-height:70vh;overflow-y:auto}
pre.file-code code{font-family:var(--mono);color:var(--fg);white-space:pre}
.file-binary{padding:48px 16px;text-align:center;color:var(--fg2)}
.file-binary .bi{font-size:48px;margin-bottom:12px}
.img-preview{text-align:center;padding:16px;background:var(--bg2)}
.img-preview img{max-width:100%;max-height:70vh;border-radius:var(--radius)}

/* Empty */
.empty{padding:64px 16px;text-align:center;color:var(--fg2)}
.empty .icon{font-size:48px;margin-bottom:12px}

/* Footer */
.site-footer{margin-top:48px;padding:24px 0;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--fg3);flex-wrap:wrap;gap:8px}
.site-footer a{color:var(--fg2)}

/* Back link */
.back-link{display:inline-flex;align-items:center;gap:4px;padding:4px 0;margin-bottom:8px;font-size:13px;color:var(--fg2)}
.back-link:hover{color:var(--link)}
`;

function renderLayout(title: string, body: string, repoUrl: string): string {
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#cf222e"/><text x="50" y="68" font-size="52" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="700">B</text></svg>`;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="icon" href="data:image/svg+xml,${favicon.replace(/"/g,"'").replace(/#/g,"%23")}">
<style>${CSS}</style>
</head>
<body>
<header class="site-header"><div class="container">
  <a href="/" class="brand"><span class="brand-dot"></span>alan-bin <span class="brand-sub">/ misc files</span></a>
  <nav class="header-nav">
    <a href="${repoUrl}" target="_blank" rel="noopener">GitHub</a>
  </nav>
</div></header>
<main class="container">
${body}
<footer class="site-footer">
  <span>&copy; 2026 Alan Zeng</span>
  <a href="${repoUrl}" target="_blank" rel="noopener">github.com/${escapeHtml(repoUrl.split("github.com/")[1] ?? "alanzeng423/alan-bin")}</a>
</footer>
</main>
</body></html>`;
}

function renderBreadcrumbs(path: string): string {
  const parts = path.split("/").filter(Boolean);
  let html = `<nav class="crumbs"><a href="/">${ICONS.dir} files</a>`;
  let cur = "";
  for (const p of parts) {
    cur += "/" + p;
    html += `<span class="sep">/</span>`;
    if (p === parts[parts.length - 1]) {
      html += `<span class="cur">${escapeHtml(p)}</span>`;
    } else {
      html += `<a href="${cur}">${escapeHtml(p)}</a>`;
    }
  }
  html += `</nav>`;
  return html;
}

function renderDir(path: string, items: GHContent[], repoUrl: string): string {
  const rows = items.map(item => {
    const href = path ? `/${path}/${item.name}` : `/${item.name}`;
    const size = item.type === "file" ? `<span class="file-size">${fileSize(item.size)}</span>` : "";
    const rawLink = item.type === "file"
      ? `<span class="file-raw"><a href="${href}?raw=1" target="_blank">raw</a></span>`
      : "";
    return `<div class="file-row">
  <span class="file-name">${iconFor(item.name, item.type)} <a href="${href}">${escapeHtml(item.name)}</a></span>
  ${size}
  ${rawLink}
</div>`;
  }).join("");

  const body = `
${renderBreadcrumbs(path)}
<div class="file-list">
  ${rows || `<div class="empty"><div class="icon">${ICONS.dir}</div><p>This directory is empty.</p></div>`}
</div>`;

  const dirName = path ? path.split("/").pop() : "files";
  return renderLayout(`${dirName} · alan-bin`, body, repoUrl);
}

function renderFile(path: string, name: string, content: string | ArrayBuffer, isImage: boolean, repoUrl: string): string {
  const ext = name.split(".").pop()!.toLowerCase();
  const rawHref = `/${path}?raw=1`;
  const editHref = `${repoUrl}/edit/main/${path}`;

  let viewer: string;
  if (isImage) {
    viewer = `<div class="img-preview"><img src="${rawHref}" alt="${escapeHtml(name)}"></div>`;
  } else if (typeof content === "string") {
    viewer = `<pre class="file-code"><code>${escapeHtml(content)}</code></pre>`;
  } else {
    viewer = `<div class="file-binary"><div class="bi">${ICONS[ext] ?? ICONS.default}</div><p>Binary file (${fileSize((content as ArrayBuffer).byteLength)})</p><p style="margin-top:8px"><a href="${rawHref}" download="${escapeHtml(name)}">Download</a></p></div>`;
  }

  const body = `
${renderBreadcrumbs(path)}
<a class="back-link" href="/${path.split("/").slice(0,-1).join("/")}">&larr; Back</a>
<div class="file-view">
  <div class="file-head">
    <span class="fname">${iconFor(name,"file")} ${escapeHtml(name)}</span>
    <span class="actions">
      <a href="${rawHref}" target="_blank">Raw</a>
      <a href="${editHref}" target="_blank" rel="noopener">Edit on GitHub</a>
    </span>
  </div>
  ${viewer}
</div>`;

  return renderLayout(`${name} · alan-bin`, body, repoUrl);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let path = url.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
    const repoUrl = `https://github.com/${env.GITHUB_REPO}`;

    try {
      // Favicon
      if (path === "favicon.ico") {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#cf222e"/><text x="50" y="68" font-size="52" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="700">B</text></svg>`;
        return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } });
      }

      // Health
      if (path === "health" || path === "healthz") {
        return new Response(JSON.stringify({ status: "ok" }), { headers: { "Content-Type": "application/json" } });
      }

      // Root API listing
      if (path === "api" || path === "api/") {
        const items = await listDir("", env);
        if (!items) return new Response("Error listing files", { status: 500 });
        return new Response(JSON.stringify({ repo: repoUrl, files: items }, null, 2), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      // Determine if file or directory
      // First try to list as directory
      const dirItems = await listDir(path, env);
      if (dirItems) {
        return new Response(renderDir(path, dirItems, repoUrl), {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" },
        });
      }

      // Try as file
      // Check if it's an image/binary first
      const name = path.split("/").pop()!;
      const ext = name.split(".").pop()!.toLowerCase();
      const imgExts = new Set(["png","jpg","jpeg","gif","svg","webp","ico","bmp"]);

      if (url.searchParams.get("raw") === "1" || imgExts.has(ext) || !isText(name)) {
        // Fetch raw binary
        const rawUrl = `https://raw.githubusercontent.com/${env.GITHUB_REPO}/${env.GITHUB_BRANCH}/${env.FILES_PATH}/${path}`;
        const res = await fetch(rawUrl);
        if (!res.ok) return new Response("Not found", { status: 404 });

        if (imgExts.has(ext)) {
          const ct: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", svg: "image/svg+xml", webp: "image/webp", ico: "image/x-icon", bmp: "image/bmp" };
          // If ?raw=1 on image, serve directly; otherwise show viewer page
          if (url.searchParams.get("raw") === "1") {
            return new Response(res.body, { headers: { "Content-Type": ct[ext] ?? "image/png", "Cache-Control": "public, max-age=3600" } });
          }
          // Show image viewer page
          return new Response(renderFile(path, name, null, true, repoUrl), {
            headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" },
          });
        }

        // Binary download or non-text
        const ct: Record<string, string> = {
          zip: "application/zip", tar: "application/x-tar", gz: "application/gzip",
          pdf: "application/pdf", mp3: "audio/mpeg", wav: "audio/wav", flac: "audio/flac",
          mp4: "video/mp4", mov: "video/quicktime", mkv: "video/x-matroska",
        };
        if (url.searchParams.get("raw") === "1" || !isText(name)) {
          // Serve binary for raw; for non-raw show binary viewer page
          if (url.searchParams.get("raw") === "1") {
            const body = await res.arrayBuffer();
            return new Response(body, { headers: { "Content-Type": ct[ext] ?? "application/octet-stream", "Cache-Control": "public, max-age=3600" } });
          }
          const body = await res.arrayBuffer();
          return new Response(renderFile(path, name, body, false, repoUrl), {
            headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" },
          });
        }
      }

      // Text file viewer
      const text = await getRaw(path, env);
      if (text === null) return new Response("Not found", { status: 404 });

      if (url.searchParams.get("raw") === "1") {
        const ct: Record<string, string> = {
          md: "text/markdown", json: "application/json", js: "application/javascript",
          ts: "application/typescript", py: "text/x-python", sh: "text/x-sh",
          yaml: "text/yaml", yml: "text/yaml", txt: "text/plain", html: "text/html",
          css: "text/css", xml: "application/xml", cfg: "text/plain", ini: "text/plain",
        };
        return new Response(text, {
          headers: { "Content-Type": `${ct[ext] ?? "text/plain"}; charset=utf-8`, "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" },
        });
      }

      return new Response(renderFile(path, name, text, false, repoUrl), {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" },
      });
    } catch (err) {
      return new Response(`<pre>${escapeHtml(String(err))}</pre>`, { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
  },
};
