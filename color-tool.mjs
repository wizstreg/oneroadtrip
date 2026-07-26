// color-tool.mjs
// Node >=18, aucun package requis.
// Lance un mini serveur qui scanne ton repo, liste les couleurs et permet de les remplacer.
// Ex: node color-tool.mjs --root "C:\\OneRoadTrip\\appli roadstrip\\V26\\web" --ext ".html,.css,.js,.jsx,.ts,.tsx,.svg" --port 4040

import { createServer } from 'http';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

// --- args robustes: --key=value OU --key value ---
const argv = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  let a = argv[i];
  if (!a.startsWith('--')) continue;
  a = a.slice(2);
  const eq = a.indexOf('=');
  if (eq >= 0) {
    const k = a.slice(0, eq);
    const v = a.slice(eq + 1);
    args[k] = v;
  } else {
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) { args[a] = next; i++; }
    else { args[a] = true; }
  }
}

const ROOT = (typeof args.root === 'string' ? args.root : process.cwd()).replace(/\\/g,'/');
const PORT = Number(args.port || 4040);
const EXT_LIST = (args.ext ? String(args.ext) : '.html,.css,.js,.jsx,.ts,.tsx,.svg').split(',').map(s=>s.trim().toLowerCase());
const EXCLUDES = ['node_modules', '.git', '.next', 'dist', 'build', '.cache'];

const COLOR_REGEX = new RegExp(
  [
    // #RGB, #RGBA, #RRGGBB, #RRGGBBAA
    '#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b',
    // rgb() / rgba()
    'rgba?\\(\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*,\\s*\\d{1,3}(?:\\s*,\\s*(?:0?\\.\\d+|1|0))?\\s*\\)',
    // hsl() / hsla()
    'hsla?\\(\\s*\\d{1,3}(?:\\.\\d+)?(?:deg|rad|turn)?\\s*,\\s*\\d{1,3}%\\s*,\\s*\\d{1,3}%(?:\\s*,\\s*(?:0?\\.\\d+|1|0))?\\s*\\)'
  ].join('|'),
  'g'
);

const state = {
  colors: new Map(), // colorString -> { count, files: Set }
  files: [],         // { path, rel }
  scanned: false
};

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (EXCLUDES.includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...await walk(p));
    } else {
      const ext = extname(e.name).toLowerCase();
      if (EXT_LIST.includes(ext)) out.push(p);
    }
  }
  return out;
}

async function scan() {
  state.colors.clear();
  state.files = await walk(ROOT);
  for (const file of state.files) {
    const rel = file.replace(ROOT, '').replace(/^[/\\]/,'');
    let content = '';
    try { content = await fs.readFile(file, 'utf8'); }
    catch { continue; }
    const found = content.match(COLOR_REGEX);
    if (!found) continue;
    for (const col of found) {
      const key = col; // on garde la casse telle quelle pour remplacements exacts
      if (!state.colors.has(key)) state.colors.set(key, { count: 0, files: new Set() });
      const entry = state.colors.get(key);
      entry.count++;
      entry.files.add(rel);
    }
  }
  state.scanned = true;
}

function htmlPage() {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>Color Tool</title>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body{font:14px/1.4 system-ui,Segoe UI,Roboto,Arial,sans-serif;margin:24px;max-width:1100px}
    header{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
    code.k{background:#f3f3f3;padding:2px 6px;border-radius:6px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th,td{border-bottom:1px solid #eee;padding:8px;vertical-align:middle}
    .swatch{width:36px;height:24px;border-radius:4px;border:1px solid #ccc}
    .files{max-width:520px;max-height:80px;overflow:auto;font-size:12px;color:#666}
    .row{display:flex;gap:8px;align-items:center}
    .actions{display:flex;gap:6px;flex-wrap:wrap}
    .btn{padding:6px 10px;border:1px solid #ddd;border-radius:8px;cursor:pointer;background:#fff}
    .btn.primary{background:#0b5; color:#fff; border-color:#0b5}
    .btn.warn{background:#e33; color:#fff; border-color:#e33}
    .sticky{position:sticky;top:0;background:#fff;padding:10px 0;margin:-10px 0 10px 0;border-bottom:1px solid #eee}
    input[type=text]{padding:6px 8px;border:1px solid #ccc;border-radius:6px;min-width:120px}
    .muted{color:#777}
  </style>
</head>
<body>
  <header class="sticky">
    <h1 style="margin:0">Color Tool</h1>
    <div>Racine: <code class="k">${ROOT}</code></div>
    <div>Extensions: <code class="k">${EXT_LIST.join(', ')}</code></div>
    <div class="actions">
      <button class="btn" onclick="refresh()">Rescanner</button>
      <button class="btn primary" onclick="applyAll()">Appliquer tout</button>
    </div>
  </header>

  <p class="muted">Astuce: tu peux remplir la colonne “Nouveau” puis cliquer “Appliquer tout”. Les remplacements sont <b>exact-match</b> par sécurité (casse incluse).</p>

  <table id="t">
    <thead>
      <tr>
        <th>Couleur</th>
        <th>Aperçu</th>
        <th>Occurrences</th>
        <th>Fichiers</th>
        <th>Nouveau</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>

<script>
const T = document.querySelector('#t tbody');
let DATA = [];

function cToCss(c){
  // si c est #rgb / #rrggbb etc → ok, sinon laisse tel quel (rgb(), hsl(), …)
  return c;
}

async function load(){
  const r = await fetch('/api/colors');
  const j = await r.json();
  DATA = j.colors;
  render();
}

function render(){
  T.innerHTML = '';
  for(const row of DATA){
    const tr = document.createElement('tr');
    const filesList = row.files.slice(0,50).join(', ') + (row.files.length>50 ? '…' : '');
    tr.innerHTML = \`
      <td><code class="k">\${row.color}</code></td>
      <td><div class="swatch" style="background:\${cToCss(row.color)}"></div></td>
      <td>\${row.count}</td>
      <td class="files">\${filesList}</td>
      <td><input type="text" value="\${row.color}" data-old="\${row.color}" placeholder="#afbcf0 ou rgb(...)" /></td>
      <td class="actions">
        <button class="btn" data-do="one">Remplacer</button>
      </td>\`;
    T.appendChild(tr);
  }
  T.querySelectorAll('button[data-do="one"]').forEach(btn=>{
    btn.addEventListener('click', async (e)=>{
      const tr = e.target.closest('tr');
      const inp = tr.querySelector('input[type="text"]');
      const oldC = inp.dataset.old;
      const newC = inp.value.trim();
      if(!newC || newC===oldC) { alert('Choisis une nouvelle couleur.'); return; }
      if(!confirm(\`Remplacer \${oldC} par \${newC} ?\`)) return;
      await fetch('/api/replace', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ map: { [oldC]: newC } })});
      await load();
    });
  });
}

async function refresh(){
  await fetch('/api/rescan', {method:'POST'});
  await load();
}

async function applyAll(){
  // Construit la map à partir des inputs modifiés
  const map = {};
  document.querySelectorAll('input[type="text"]').forEach(inp=>{
    const oldC = inp.dataset.old, newC = inp.value.trim();
    if(newC && newC !== oldC) map[oldC] = newC;
  });
  if(Object.keys(map).length===0){ alert('Aucun changement.'); return; }
  if(!confirm('Appliquer tous les remplacements ?')) return;
  await fetch('/api/replace', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ map })});
  await load();
}

load();
</script>
</body>
</html>`;
}

async function applyReplacements(map) {
  // map: { "oldColor": "newColor", ... } — remplacements exacts (sensibles à la casse)
  for (const file of state.files) {
    let content = '';
    try { content = await fs.readFile(file, 'utf8'); }
    catch { continue; }
    let changed = false;
    for (const [oldC, newC] of Object.entries(map)) {
      if (content.includes(oldC)) {
        const before = content;
        content = content.split(oldC).join(newC);
        if (content !== before) changed = true;
      }
    }
    if (changed) {
      // Sauvegarde
      await fs.writeFile(file, content, 'utf8');
    }
  }
}

const server = createServer(async (req, res) => {
  try {
    if (!state.scanned) await scan();

    if (req.method === 'GET' && req.url === '/') {
      const html = htmlPage();
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && req.url === '/api/colors') {
      const colors = [...state.colors.entries()]
        .sort((a,b)=> b[1].count - a[1].count)
        .map(([color, info]) => ({
          color, count: info.count, files: [...info.files]
        }));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ root: ROOT, extensions: EXT_LIST, colors }));
      return;
    }

    if (req.method === 'POST' && req.url === '/api/rescan') {
      await scan();
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok:true, files: state.files.length, colors: state.colors.size }));
      return;
    }

  if (req.method === 'POST' && req.url === '/api/replace') {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  const map = body.map || {};
  // Sécurité basique : on n'autorise que des remplacements de chaînes reconnues comme "couleurs"
 // Sécurité basique : on n'autorise que des remplacements de chaînes reconnues comme "couleurs"
for (const [k,v] of Object.entries(map)) {
  if (!k || typeof v !== 'string') { delete map[k]; continue; }
  if (!k.match(COLOR_REGEX)) { delete map[k]; continue; }
  if (!/^(var\(|rgb\(|hsl\(|#)/.test(v)) { // autorise aussi var(--brand), rgb(...), hsl(...), ou #...
    delete map[k];
  }
}

  await applyReplacements(map);
  await scan();
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ ok:true, replaced: Object.keys(map).length }));
  return;
}

    res.writeHead(404); res.end('Not found');
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Erreur: ' + e.message);
  }
});

server.listen(PORT, () => {
  console.log(`🔎 Color Tool prêt sur http://localhost:${PORT}`);
  console.log(`📂 Racine: ${ROOT}`);
  console.log(`🧩 Extensions: ${EXT_LIST.join(', ')}`);
});
