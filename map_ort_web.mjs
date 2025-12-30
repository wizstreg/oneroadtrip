// map_ort_web.mjs
// Génère une cartographie détaillée (HTML + JSON), ouvre le HTML et propose un bouton "Télécharger le JSON".

import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(exec);

// ---- Config & CLI ----
const ROOT = process.argv[2] || "C:/OneRoadTrip";     // Chemin passé en argument possible
const OUT_HTML = "mapping.html";
const OUT_JSON = "mapping.json";
const IGNORES = ["node_modules", ".git", ".vscode", "dist", "build", ".cache", ".turbo", ".vercel", ".netlify"];

// ---- Helpers ----
function humanSize(bytes) {
  if (!bytes && bytes !== 0) return "n/a";
  const u = ["B","KB","MB","GB","TB"];
  const i = Math.floor(Math.log(Math.max(bytes,1)) / Math.log(1024));
  return `${(bytes/Math.pow(1024,i)).toFixed(1)} ${u[i]}`;
}

function guessExplain(name) {
  const n = name.toLowerCase();
  if (n === "server.mjs") return "Point d’entrée : lance un mini-serveur (souvent Express).";
  if (n.includes("cache")) return "Gestion/sauvegarde du cache (JSON/FS).";
  if (n.includes("bulk_fix")) return "Outil de correction en masse (ex. codes régions ISO).";
  if (n.includes("check_caches")) return "Diagnostic des caches villes/régions.";
  if (n.includes("interest-poi")) return "Service score d’intérêt pour POI.";
  if (n.includes("interest-city")) return "Service score d’intérêt pour une ville.";
  if (n.includes("top30")) return "Classement des 30 villes principales d’une région/unité.";
  if (n.includes("airport")) return "Fonctions aéroports (nearest/check/datasets).";
  if (n.endsWith(".html")) return "Page web de l’interface (UI).";
  if (n.endsWith(".css")) return "Feuille de style (CSS).";
  if (n.endsWith(".json")) return "Données ou configuration JSON.";
  if (n.endsWith(".md")) return "Documentation/notes Markdown.";
  if (n.endsWith(".csv")) return "Données tabulaires CSV.";
  if (n.endsWith(".geojson")) return "Données géographiques (GeoJSON).";
  if (n.endsWith(".bat") || n.endsWith(".cmd")) return "Script batch Windows.";
  return "Rôle à préciser.";
}

async function readHead(fp, maxBytes = 512) {
  try {
    const fh = await fs.open(fp, "r");
    const { size } = await fh.stat();
    const len = Math.min(size, maxBytes);
    const buf = Buffer.alloc(len);
    await fh.read(buf, 0, len, 0);
    await fh.close();
    // Nettoyage simple d’affichage
    return buf.toString("utf8").replace(/\r/g,"").split("\n").slice(0,2).join(" · ");
  } catch {
    return "";
  }
}

async function walk(dir) {
  const out = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (e) {
    return [{ type: "error", name: path.basename(dir), path: dir, error: e.message }];
  }

  for (const e of entries) {
    if (IGNORES.includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const subtree = await walk(full);
      out.push({
        type: "dir",
        name: e.name,
        path: full,
        children: subtree,
      });
    } else if (e.isFile()) {
      let size = 0;
      try {
        const st = await fs.stat(full);
        size = st.size;
      } catch {}
      out.push({
        type: "file",
        name: e.name,
        path: full,
        size,
        sizeHuman: humanSize(size),
        explain: guessExplain(e.name),
        head: await readHead(full) // aperçu 1-2 lignes
      });
    }
  }

  // tri: dossiers puis fichiers
  out.sort((a,b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));
  return out;
}

function countStats(tree, stats = { files:0, dirs:0, bytes:0 }) {
  for (const n of tree) {
    if (n.type === "dir") {
      stats.dirs++;
      countStats(n.children || [], stats);
    } else if (n.type === "file") {
      stats.files++;
      stats.bytes += n.size || 0;
    }
  }
  return stats;
}

// Rendu HTML avec JSON embarqué + bouton download
function renderHTML(rootPath, data, stats) {
  const jsonInline = JSON.stringify(data); // embarqué dans la page
  const total = `${stats.files} fichier(s), ${stats.dirs} dossier(s), ${humanSize(stats.bytes)}`;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Cartographie OneRoadTrip</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { --fg:#1f2937; --muted:#6b7280; --bg:#f8fafc; --card:#ffffff; --border:#e5e7eb; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: var(--fg); background: var(--bg); margin: 24px; }
  header { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
  .badge { background:#eef2ff; border:1px solid #e0e7ff; color:#3730a3; padding:6px 10px; border-radius:9999px; font-size:12px; }
  .toolbar { display:flex; gap:8px; margin: 8px 0 20px; }
  button { border:1px solid var(--border); background: var(--card); padding:8px 12px; border-radius:8px; cursor:pointer; }
  button:hover { background:#f3f4f6; }
  .tree { background: var(--card); border:1px solid var(--border); border-radius:12px; padding:14px; }
  ul { list-style:none; padding-left:20px; margin:0; }
  li { margin:2px 0; }
  details summary { cursor:pointer; padding:4px 0; }
  .file { display:flex; gap:8px; align-items:baseline; }
  .muted { color: var(--muted); font-size: 12px; }
  .pill { font-size:11px; border:1px solid var(--border); border-radius:9999px; padding:2px 6px; }
  .head { color:#475569; font-size:12px; }
  .path { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:12px; color:#475569; }
  .stats { color:#334155; font-size:13px; }
</style>
</head>
<body>
<header>
  <h1 style="margin:0;">Cartographie de <span class="path">${rootPath}</span></h1>
</header>

<div class="toolbar">
  <button id="downloadJson">Télécharger le JSON</button>
  <span class="stats">${total}</span>
</div>

<div class="tree" id="treeRoot"></div>

<p class="muted" style="margin-top:16px">Généré le ${new Date().toLocaleString()}</p>

<script id="mapping-data" type="application/json">${jsonInline}</script>
<script>
  // Parse des données embarquées
  const data = JSON.parse(document.getElementById('mapping-data').textContent);

  function el(tag, attrs={}, ...kids){
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if (k === 'class') e.className = v; else e.setAttribute(k, v);
    });
    for (const k of kids) e.append(k);
    return e;
  }

  function render(nodes){
    const ul = el('ul');
    for (const n of nodes){
      if(n.type === 'dir'){
        const li = el('li');
        const det = el('details', {open:''});
        const sum = el('summary', {}, '📁 ', el('b', {}, n.name));
        det.append(sum, render(n.children||[]));
        li.append(det);
        ul.append(li);
      } else if(n.type === 'file'){
        const li = el('li');
        const row = el('div', {class:'file'});
        row.append('📄 ', el('span', {}, n.name),
          el('span', {class:'pill'}, n.sizeHuman || 'n/a'),
          el('span', {class:'muted'}, '— ', n.explain || 'Rôle à préciser.'));
        if (n.head) row.append(el('span', {class:'head'}, ' · ', n.head));
        li.append(row);
        ul.append(li);
      } else if(n.type === 'error'){
        ul.append(el('li', {}, '⚠️ ', n.path, ' — ', n.error || 'Erreur'));
      }
    }
    return ul;
  }

  document.getElementById('treeRoot').append(render(data));

  // Bouton: télécharger le JSON (depuis les données embarquées)
  document.getElementById('downloadJson').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mapping.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
  });
</script>
</body>
</html>`;
}

async function main() {
  console.log(`📂 Cartographie de : ${ROOT}`);
  const tree = await walk(ROOT);
  const stats = countStats(tree);

  // mapping.json (utilitaire/share direct)
  await fs.writeFile(OUT_JSON, JSON.stringify(tree, null, 2), "utf8");

  // mapping.html (avec JSON embarqué + bouton)
  const html = renderHTML(ROOT, tree, stats);
  await fs.writeFile(OUT_HTML, html, "utf8");

  console.log(`✅ Fichiers générés : ${OUT_HTML}, ${OUT_JSON}`);

  // Ouvre automatiquement le HTML
  try {
    if (process.platform === "win32") {
      await run(`start "" "${OUT_HTML}"`, { shell: true });
    } else if (process.platform === "darwin") {
      await run(`open "${OUT_HTML}"`);
    } else {
      await run(`xdg-open "${OUT_HTML}"`);
    }
    console.log("🌐 Navigateur ouvert sur la cartographie");
  } catch {
    console.log(`ℹ️ Ouvre manuellement ${OUT_HTML} si besoin.`);
  }
}

main();
