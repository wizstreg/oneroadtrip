#!/usr/bin/env node
/**
 * merge-places-v2.mjs
 * 
 * Reconstruit les fichiers places.master-{lang}.json à partir des itins.modules-{lang}.json
 * SANS mélanger les langues.
 * 
 * Fonctionnalités:
 * - PASSE 0: Nettoie les place_id (retire -centre, -ville, -airport, etc.)
 *            + Renomme dans les Excel photos et JSON photos
 * - PASSE 1: Extrait les places de chaque langue isolément
 * - PASSE 2: Détecte les doublons (mode interactif pour choisir)
 * - PASSE 3: Génère les masters propres par langue
 * - Persiste les choix dans merge-config.json
 * - Crée des backups automatiques
 * 
 * Usage:
 *   node merge-places-v2.mjs --country=FR --rebuild --interactive
 *   node merge-places-v2.mjs --all --rebuild
 *   node merge-places-v2.mjs --country=MA --apply-only
 *   node merge-places-v2.mjs --all --no-clean   # sans nettoyage place_id
 */

import fs from "fs/promises";
import path from "path";
import readline from "readline";
import ExcelJS from "exceljs";

// ============================================
// CONFIGURATION
// ============================================
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, ...rest] = a.replace(/^--/, "").split("=");
    return [k, rest.join("=") || true];
  })
);

const DEFAULT_BASE = "C:\\OneRoadTrip\\data\\Roadtripsprefabriques";
const BASE = (args.base || DEFAULT_BASE).replace(/\//g, path.sep).replace(/\\\\/g, "\\");
const COUNTRIES_DIR = path.join(BASE, "countries");
const CONFIG_FILE = path.join(BASE, "merge-config.json");

// Chemins photos (parallèles à Roadtripsprefabriques)
const PHOTOS_DIR = path.join(BASE, "..", "photos");
const PHOTOS_JSON_DIR = path.join(BASE, "..", "photos-json");
const PHOTOS_JSON_FILE = path.join(PHOTOS_JSON_DIR, "photos_lieux.json");

// Fichier durées (dans countries/)
const DURATIONS_FILE = path.join(COUNTRIES_DIR, "places_durations_COMPLETE.json");

const LANGS = ["fr", "en", "es", "it", "pt", "ar"];
const SIMILARITY_THRESHOLD = 0.7; // 70% pour les places (plus strict)
const VISIT_SIMILARITY_THRESHOLD = 0.6; // 60% pour les visites/activités

// ============================================
// CONFIGURATION NETTOYAGE PLACE_ID (PASSE 0)
// ============================================
// Suffixes à supprimer des place_id
const SUFFIXES_TO_REMOVE = [
  // Génériques lieu (villes uniquement)
  /-centre$/i,
  /-center$/i,
  /-centro$/i,
  /-ville$/i,
  /-city$/i,
  /-town$/i,
  /-old-town$/i,
  /-village$/i,
  // Aéroports (suffixe) — y compris avec code IATA explicite (-bri, -cdg, etc.)
  /-airport-[a-z]{3}$/i,   // ex: bari-airport-bri → bari
  /-aeroport-[a-z]{3}$/i,
  /-airport$/i,
  /-aeroport$/i,
  /-aeropuerto$/i,
  /-flughafen$/i,
  // Codes IATA connus en suffixe seul (liste explicite pour éviter les faux positifs)
  /-(?:bri|cdg|lhr|jfk|lax|dxb|sin|ams|fra|mad|bcn|fcо|mxp|nap|vce|muc|vie|zrh|gva|lis|opo|ath|ist|cai|cpt|jnb|bkk|hkg|nrt|kix|icn|syd|mel|auk|gru|bog|lim|scl|mex|yyz|yul|ord|mia|sfo|sea|dfw|iah|ewr|phl)$/i,
  // Parcs nationaux
  /-np$/i,
  /-national-park$/i,
  // Marqueurs workflow
  /-end$/i,
  /-depart$/i,
  /-area$/i,
  // Codes département/région (--XX ou -XX à la fin, ex: murat-15, pujols-47)
  /--\d{2}$/i,
  /-\d{2}$/i,
  // États US (tous les 50)
  // États US supprimés — inutile car les places US ont déjà CC=US::
  // et ce pattern créait des faux positifs sur des noms français (-arc, -lac, etc.)
  // Suffixes géographiques composés (à traiter AVANT les suffixes simples)
  /-isle-of-skye$/i,
  /-skye$/i,
  /-coromandel$/i,
  /-abel-tasman$/i,
];

// Préfixes à supprimer des place_id
const PREFIXES_TO_REMOVE = [
  // Aéroports (préfixe)
  /^aeroport-/i,
  /^airport-/i,
  /^aeropuerto-/i,
  /^flughafen-/i,
  /^aerodromo-/i,
  // Départs/arrivées workflow
  /^depart-/i,
  /^arrivee-/i,
  /^arrival-/i,
  // Gares
  /^gare-/i,
  /^station-/i,
  /^bahnhof-/i,
];

// Doublons linguistiques : clé = forme à garder, valeurs = formes à remplacer
// NOTE: Ne pas inclure ici les formes déjà gérées par SUFFIXES_TO_REMOVE
const LANGUAGE_DUPLICATES = {
  // Danemark
  "copenhagen": ["copenhague"],
  "helsingor": ["helsingoer"],
  // Allemagne
  "dresden": ["dresde"],
  "munich": ["muenchen"],
  "hannover": ["hanover"],
  "fussen": ["fuessen"],
  "nuremberg": ["nurnberg"],
  "cologne": ["koeln"],
  "hamburg": ["hambourg"],
  "wurzburg": ["wurtzburg", "wuerzburg"],
  // Italie
  "firenze": ["florence"],
  "roma": ["rome"],
  "venezia": ["venise"],
  "napoli": ["naples"],
  "genova": ["genes", "gênes"],
  "milano": ["milan"],
  "torino": ["turin"],
  "pisa": ["pise"],
  "cortina-dampezzo": ["cortina-d-ampezzo"],
  "verona": ["verone"],
  // Grèce
  "athenes": ["athens"],
  "thessalonique": ["thessaloniki"],
  "fira": ["fira-santorini"],
  // Espagne
  "sevilla": ["seville"],
  // Égypte
  "cairo": ["le-caire"],
  "aswan": ["assouan"],
  "giza": ["gizeh"],
  // Belgique (bruges-centre et gand-centre gérés par suffixe -centre)
  "brugge": ["bruges"],
  "gent": ["gand"],
  // Chine
  "shangri-la": ["shangrila", "shangri"],
  // République tchèque
  "prague": ["praha"],
  // Bangladesh
  "cox-bazar": ["coxs-bazar"],
  // Croatie
  "dakovo": ["djakovo"],
  // Nicaragua
  "big-corn": ["big-corn-island"],
  "little-corn": ["little-corn-island"],
  // Norvège
  "henningsvaer": ["henningvaer"],
  // Vietnam
  "ha-long": ["halong-bay", "halong"],
  // Maurice (depart-maurice → après suppression préfixe depart- → "maurice" → on mappe vers port-louis ou on garde comme invalide)
  // "maurice" seul n'est pas un lieu valide → on le met en invalide via SLUGS_INVALID
  // Thaïlande
  "koh-pha-ngan": ["koh-phangan"],
  // Jordanie
  "queen-alia": ["queen-alia-airport"],
  // Tanzanie
  "zanzibar": ["zanzibar-airport"],
  // Maurice (cas spéciaux sans ville identifiable → on garde tel quel)
  // "aeroport" seul et "depart-maurice" seront loggés comme invalides
};

// Slugs invalides même après nettoyage (résidus de préfixes workflow sans ville identifiable)
const INVALID_SLUGS = new Set([
  "maurice",  // depart-maurice → après suppression préfixe → "maurice" n'est pas un lieu
  "aeroport", // MU::aeroport → pas de ville associée
]);

// ============================================
// UTILITAIRES READLINE
// ============================================
let rl = null;

function initReadline() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  return rl;
}

function closeReadline() {
  if (rl) {
    rl.close();
    rl = null;
  }
}

async function prompt(question) {
  const r = initReadline();
  return new Promise(resolve => {
    r.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

async function promptChoice(message, options) {
  console.log(`\n${message}`);
  options.forEach((opt, i) => {
    console.log(`  [${i + 1}] ${opt}`);
  });
  
  while (true) {
    const answer = await prompt(`Choix (1-${options.length}): `);
    const num = parseInt(answer, 10);
    if (num >= 1 && num <= options.length) {
      return num - 1; // index 0-based
    }
    console.log(`  ⚠️  Entrez un nombre entre 1 et ${options.length}`);
  }
}

// ============================================
// UTILITAIRES FICHIERS
// ============================================
async function readJSON(p) {
  try {
    const raw = await fs.readFile(p, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw new Error(`[JSON] ${p} : ${e.message}`);
  }
}

async function writeJSON(p, data) {
  const s = JSON.stringify(data, null, 2);
  await fs.writeFile(p, s, "utf8");
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function listCountryCodes() {
  const entries = await fs.readdir(COUNTRIES_DIR, { withFileTypes: true });
  return entries
    .filter(d => d.isDirectory() && /^[A-Za-z]{2}$/.test(d.name))
    .map(d => d.name.toUpperCase())
    .sort();
}

function normCC(cc) {
  return (cc || "").toUpperCase();
}

// ============================================
// UTILITAIRES TEXTE
// ============================================
function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugToName(slug) {
  if (!slug) return slug;
  return slug
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function extractSlug(placeId) {
  const parts = placeId.split("::");
  return parts[parts.length - 1] || "";
}

// ============================================
// PASSE 0: NETTOYAGE DES PLACE_ID
// ============================================

/**
 * Nettoie un place_id en retirant les suffixes/préfixes inutiles.
 * Retourne null si le place_id est structurellement invalide.
 * @param {string} placeId
 * @returns {string|null}
 */
function cleanPlaceId(placeId) {
  if (!placeId) return null;

  // Invalide: double :: (ex: TR::antalya::side, LA::phongsali::trek)
  const parts = placeId.split("::");
  if (parts.length > 2) {
    return null; // Sera loggé par l'appelant
  }

  if (!placeId.includes("::")) return placeId;

  const [cc, slug] = parts;
  if (!slug) return null;

  // Invalide: slug vide ou juste un tiret
  if (!slug || slug === "-" || slug.trim() === "") return null;

  let cleanedSlug = slug;

  // 0. Normaliser underscores → tirets
  cleanedSlug = cleanedSlug.replace(/_/g, "-");

  // 1a. Retirer les préfixes génériques
  for (const pattern of PREFIXES_TO_REMOVE) {
    cleanedSlug = cleanedSlug.replace(pattern, "");
  }

  // 1b. Retirer les suffixes génériques (du plus spécifique au plus générique)
  for (const pattern of SUFFIXES_TO_REMOVE) {
    const before = cleanedSlug;
    cleanedSlug = cleanedSlug.replace(pattern, "");
    // Si le slug devient vide après suppression, annuler
    if (!cleanedSlug) { cleanedSlug = before; break; }
  }

  // 2. Unifier les doublons linguistiques
  for (const [canonical, variants] of Object.entries(LANGUAGE_DUPLICATES)) {
    if (variants.includes(cleanedSlug)) {
      cleanedSlug = canonical;
      break;
    }
  }

  // Slug vide après nettoyage → invalide
  if (!cleanedSlug) return null;

  // Slug invalide après nettoyage
  if (INVALID_SLUGS.has(cleanedSlug)) return null;

  // Pas de changement
  if (cleanedSlug === slug) return placeId;

  return `${cc}::${cleanedSlug}`;
}

/**
 * Nettoie tous les place_id dans les fichiers itins d'un pays
 * @param {string} countryDir - Chemin du dossier pays
 * @param {string} cc - Code pays
 * @returns {object} - Stats du nettoyage
 */
async function cleanPlaceIdsInItins(countryDir, cc) {
  const stats = { filesModified: 0, idsChanged: 0, changes: [] };
  
  for (const lang of LANGS) {
    const itinsPath = path.join(countryDir, `${cc.toUpperCase()}.itins.modules-${lang}.json`);
    
    if (!await fileExists(itinsPath)) continue;
    
    const data = await readJSON(itinsPath);
    if (!data || !Array.isArray(data.itineraries)) continue;
    
    let fileModified = false;
    
    for (const itin of data.itineraries) {
      if (!Array.isArray(itin.days_plan)) continue;
      
      for (const day of itin.days_plan) {
        // Le place_id est dans day.night.place_id
        if (day.night && day.night.place_id) {
          const original = day.night.place_id;
          const cleaned = cleanPlaceId(original);
          if (cleaned === null) {
            stats.invalid = stats.invalid || [];
            stats.invalid.push({ lang, id: original });
          } else if (cleaned !== original) {
            stats.changes.push({ lang, old: original, new: cleaned });
            day.night.place_id = cleaned;
            stats.idsChanged++;
            fileModified = true;
          }
        }
      }
    }
    
    if (fileModified) {
      // Backup avant modification
      await backupFile(itinsPath);
      await writeJSON(itinsPath, data);
      stats.filesModified++;
    }
  }
  
  return stats;
}

/**
 * Nettoie aussi les places.master existants pour cohérence
 * Structure: { places: [{ place_id: "XX::...", ... }] }
 */
async function cleanPlaceIdsInMasters(countryDir, cc) {
  const stats = { filesModified: 0, idsChanged: 0 };
  
  for (const lang of LANGS) {
    const masterPath = path.join(countryDir, `${cc.toLowerCase()}.places.master-${lang}.json`);
    
    if (!await fileExists(masterPath)) continue;
    
    const data = await readJSON(masterPath);
    if (!data || !Array.isArray(data.places)) continue;
    
    let fileModified = false;
    
    for (const place of data.places) {
      if (!place.place_id) continue;
      
      const cleaned = cleanPlaceId(place.place_id);
      if (cleaned !== place.place_id) {
        place.place_id = cleaned;
        stats.idsChanged++;
        fileModified = true;
      }
    }
    
    if (fileModified) {
      await backupFile(masterPath);
      await writeJSON(masterPath, data);
      stats.filesModified++;
    }
  }
  
  return stats;
}

/**
 * Nettoie les place_id dans le fichier Excel photos d'un pays
 * Structure Excel: place_id | place_name | photo_1 | photo_2 | ...
 */
async function cleanPlaceIdsInPhotosExcel(cc) {
  const stats = { idsChanged: 0, merged: 0 };
  const excelPath = path.join(PHOTOS_DIR, `${cc.toUpperCase()}_photos.xlsx`);
  
  if (!await fileExists(excelPath)) {
    return stats;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);
    const worksheet = workbook.worksheets[0];
    
    if (!worksheet) return stats;
    
    // Lire toutes les lignes et construire un map old_id → new_id
    const rows = [];
    const mergeMap = new Map(); // new_place_id → array of row data to merge
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const placeId = row.getCell(1).value;
      const placeName = row.getCell(2).value;
      
      if (!placeId) return;
      
      const photos = [];
      for (let i = 3; i <= 12; i++) {
        const url = row.getCell(i).value;
        if (url && typeof url === 'string' && url.startsWith('http')) {
          photos.push(url);
        }
      }
      
      const cleanedId = cleanPlaceId(String(placeId));
      
      rows.push({
        rowNumber,
        originalId: String(placeId),
        cleanedId,
        placeName,
        photos,
        changed: cleanedId !== String(placeId)
      });
      
      if (cleanedId !== String(placeId)) {
        stats.idsChanged++;
      }
    });
    
    if (stats.idsChanged === 0) {
      return stats;
    }
    
    // Regrouper par cleanedId pour fusionner les photos si nécessaire
    for (const row of rows) {
      if (!mergeMap.has(row.cleanedId)) {
        mergeMap.set(row.cleanedId, []);
      }
      mergeMap.get(row.cleanedId).push(row);
    }
    
    // Créer le nouveau workbook
    const newWorkbook = new ExcelJS.Workbook();
    const newSheet = newWorkbook.addWorksheet('Sheet1');
    
    // Header
    const columns = [
      { header: 'place_id', key: 'place_id', width: 40 },
      { header: 'place_name', key: 'place_name', width: 30 }
    ];
    for (let i = 1; i <= 10; i++) {
      columns.push({ header: `photo_${i}`, key: `photo_${i}`, width: 80 });
    }
    newSheet.columns = columns;
    
    // Écrire les lignes fusionnées
    for (const [cleanedId, rowsToMerge] of mergeMap) {
      // Fusionner les photos (sans doublons)
      const allPhotos = new Set();
      let placeName = rowsToMerge[0].placeName;
      
      for (const r of rowsToMerge) {
        for (const p of r.photos) {
          allPhotos.add(p);
        }
      }
      
      if (rowsToMerge.length > 1) {
        stats.merged++;
      }
      
      const photosArray = Array.from(allPhotos).slice(0, 10);
      const rowData = {
        place_id: cleanedId,
        place_name: placeName
      };
      for (let i = 0; i < 10; i++) {
        rowData[`photo_${i + 1}`] = photosArray[i] || '';
      }
      newSheet.addRow(rowData);
    }
    
    // Backup et sauvegarde
    await backupFile(excelPath);
    await newWorkbook.xlsx.writeFile(excelPath);
    
  } catch (e) {
    console.error(`  ⚠️ Erreur Excel ${cc}: ${e.message}`);
  }
  
  return stats;
}

/**
 * Nettoie les place_id dans le JSON photos central
 * Structure: { "XX::place": { name: "...", photos: [...] }, ... }
 */
async function cleanPlaceIdsInPhotosJson() {
  const stats = { idsChanged: 0, merged: 0 };
  
  if (!await fileExists(PHOTOS_JSON_FILE)) {
    return stats;
  }
  
  try {
    const data = await readJSON(PHOTOS_JSON_FILE);
    if (!data || typeof data !== 'object') return stats;
    
    const newData = {};
    
    for (const [placeId, placeData] of Object.entries(data)) {
      const cleanedId = cleanPlaceId(placeId);
      
      if (cleanedId !== placeId) {
        stats.idsChanged++;
      }
      
      if (newData[cleanedId]) {
        // Fusionner les photos
        const existingPhotos = new Set(newData[cleanedId].photos || []);
        for (const p of placeData.photos || []) {
          existingPhotos.add(p);
        }
        newData[cleanedId].photos = Array.from(existingPhotos);
        stats.merged++;
      } else {
        newData[cleanedId] = {
          name: placeData.name,
          photos: placeData.photos || []
        };
      }
    }
    
    if (stats.idsChanged === 0) {
      return stats;
    }
    
    // Backup et sauvegarde
    await backupFile(PHOTOS_JSON_FILE);
    await writeJSON(PHOTOS_JSON_FILE, newData);
    
  } catch (e) {
    console.error(`  ⚠️ Erreur JSON photos: ${e.message}`);
  }
  
  return stats;
}

/**
 * Nettoie les place_id dans le fichier places_durations_COMPLETE.json
 * Structure: { version, generated, places: [{ place_id, suggested_days, place_type }] }
 */
async function cleanPlaceIdsInDurations() {
  const stats = { idsChanged: 0, merged: 0 };
  
  if (!await fileExists(DURATIONS_FILE)) {
    return stats;
  }
  
  try {
    const data = await readJSON(DURATIONS_FILE);
    if (!data || !Array.isArray(data.places)) return stats;
    
    // Map pour fusionner les doublons : cleanedId → place data
    const mergeMap = new Map();
    
    for (const place of data.places) {
      if (!place.place_id) continue;
      
      const cleanedId = cleanPlaceId(place.place_id);
      
      if (cleanedId !== place.place_id) {
        stats.idsChanged++;
      }
      
      if (mergeMap.has(cleanedId)) {
        // Doublon : garder les valeurs existantes (premier arrivé)
        stats.merged++;
      } else {
        mergeMap.set(cleanedId, {
          place_id: cleanedId,
          suggested_days: place.suggested_days,
          place_type: place.place_type
        });
      }
    }
    
    if (stats.idsChanged === 0) {
      return stats;
    }
    
    // Reconstruire le fichier
    const newData = {
      version: data.version || 1,
      generated: new Date().toISOString(),
      places: Array.from(mergeMap.values())
    };
    
    // Backup et sauvegarde
    await backupFile(DURATIONS_FILE);
    await writeJSON(DURATIONS_FILE, newData);
    
  } catch (e) {
    console.error(`  ⚠️ Erreur JSON durations: ${e.message}`);
  }
  
  return stats;
}

function extractKeywords(text) {
  const normalized = normalizeText(text);
  const stopWords = new Set([
    // English
    "the", "and", "for", "with", "from", "this", "that", "have", "are", "was", "were",
    // French
    "les", "des", "une", "dans", "pour", "avec", "sur", "par", "qui", "que", "est",
    "route", "vers", "depuis", "jour", "visite", "tour", "visit", "day",
    // Spanish
    "del", "las", "los", "una", "con", "por", "desde", "hacia", "como",
    // Italian
    "della", "delle", "degli", "nella", "nelle", "negli", "alla", "alle",
    // Mots génériques de lieux (IMPORTANT pour éviter les faux positifs)
    "centre", "center", "central", "centro",
    "ville", "city", "ciudad", "citta", "stadt",
    "old", "new", "vieux", "vieille", "nouveau", "nouvelle", "viejo", "nuevo",
    "north", "south", "east", "west", "nord", "sud", "est", "ouest",
    "upper", "lower", "haut", "bas", "alto", "bajo",
    "grand", "grande", "petit", "petite", "big", "small",
    "beach", "plage", "playa", "spiaggia",
    "port", "porto", "puerto", "harbour", "harbor",
    "saint", "san", "santa", "santo", "sao"
  ]);
  return normalized
    .split(" ")
    .filter(w => w.length > 2 && !stopWords.has(w));
}

function computeSimilarity(text1, text2) {
  const kw1 = extractKeywords(text1);
  const kw2 = extractKeywords(text2);
  
  if (kw1.length === 0 || kw2.length === 0) return 0;
  
  const common = kw1.filter(k => kw2.includes(k));
  
  // Exiger au moins 2 mots-clés en commun pour éviter les faux positifs
  if (common.length < 2) return 0;
  
  return common.length / Math.min(kw1.length, kw2.length);
}

function hashText(text) {
  const normalized = normalizeText(text);
  // Simple hash pour identification
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ============================================
// CONFIGURATION PERSISTANTE
// ============================================
let config = {
  version: 2,
  updated_at: null,
  place_aliases: {},      // "FR::bruxelles-centre" -> "FR::bruxelles"
  canonical_names: {},    // "FR::bruxelles" -> "Bruxelles"
  excluded_visits: {},    // "FR::bruxelles::es" -> ["hash1", "hash2"]
  kept_visits: {},        // "FR::bruxelles::es" -> ["hash3", "hash4"]
  visit_choices: {}       // "FR::paris" -> { kept: ["hash1","hash2"], decided_at: "...", source_hashes: ["h1","h2","h3"] }
                          // source_hashes = tous les hashes présents au moment du choix
                          // Si les hashes changent → le choix est invalidé, on re-demande
};

async function loadConfig() {
  const existing = await readJSON(CONFIG_FILE);
  if (existing) {
    config = { ...config, ...existing };
    console.log(`📋 Config chargée: ${Object.keys(config.place_aliases).length} alias, ${Object.keys(config.canonical_names).length} noms`);
  }
}

async function saveConfig() {
  config.updated_at = new Date().toISOString();
  await writeJSON(CONFIG_FILE, config);
  console.log(`💾 Config sauvegardée: ${CONFIG_FILE}`);
}

function getCanonicalPlaceId(placeId) {
  return config.place_aliases[placeId] || placeId;
}

function getCanonicalName(placeId) {
  const canonical = getCanonicalPlaceId(placeId);
  return config.canonical_names[canonical] || null;
}

// ============================================
// BACKUP
// ============================================
async function backupFile(filePath) {
  if (!await fileExists(filePath)) return null;
  
  const dir = path.dirname(filePath);
  const backupDir = path.join(dir, "_backups");
  await fs.mkdir(backupDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const baseName = path.basename(filePath, ".json");
  const backupPath = path.join(backupDir, `${baseName}_${timestamp}.json`);
  
  await fs.copyFile(filePath, backupPath);
  return backupPath;
}

// ============================================
// DÉDUPLICATION DES VISITES (INTERACTIF)
// ============================================

/**
 * Groupe les visites similaires entre elles (même lieu, textes proches)
 * Retourne un tableau de groupes : [[idx1, idx2], [idx3, idx4], ...]
 * Les visites sans doublon ne sont PAS retournées (on ne les affiche pas)
 */
function groupSimilarVisits(visits) {
  const groups = [];
  const used = new Set();

  for (let i = 0; i < visits.length; i++) {
    if (used.has(i)) continue;
    const group = [i];
    for (let j = i + 1; j < visits.length; j++) {
      if (used.has(j)) continue;
      const sim = computeSimilarity(visits[i].text || "", visits[j].text || "");
      if (sim >= VISIT_SIMILARITY_THRESHOLD) {
        group.push(j);
        used.add(j);
      }
    }
    if (group.length > 1) {
      groups.push(group);
      used.add(i);
    }
  }
  return groups;
}

/**
 * Vérifie si le choix sauvegardé pour un lieu est encore valide.
 * Un choix est invalide si les visites ont changé depuis le dernier choix
 * (nouveaux textes ajoutés ou textes supprimés).
 */
function isVisitChoiceStillValid(placeId, currentVisits) {
  const choice = config.visit_choices[placeId];
  if (!choice) return false;

  const currentHashes = new Set(currentVisits.map(v => hashText(v.text || "")));
  const savedHashes = new Set(choice.source_hashes || []);

  // Valide si les hashes sont identiques
  if (currentHashes.size !== savedHashes.size) return false;
  for (const h of currentHashes) {
    if (!savedHashes.has(h)) return false;
  }
  return true;
}

/**
 * Applique le choix sauvegardé : filtre les visites pour ne garder que celles choisies.
 * Retourne le tableau de visites filtré.
 */
function applyVisitChoice(placeId, visits) {
  const choice = config.visit_choices[placeId];
  if (!choice || !choice.kept) return visits;

  const keptSet = new Set(choice.kept);
  return visits.filter(v => keptSet.has(hashText(v.text || "")));
}

/**
 * Mode interactif : pour chaque lieu venant de plusieurs itinéraires,
 * affiche les blocs de visites par source et demande lequel garder.
 * onlyPending = true → skip les lieux dont le choix est encore valide.
 *
 * Travaille sur les places FR (référence).
 * Le résultat s'applique à toutes les langues par itin_id.
 */
async function dedupeVisitsInteractive(places, onlyPending) {
  let treated = 0;
  let skipped = 0;

  for (const place of places) {
    const placeId = place.place_id;

    // Seulement les places venant de plusieurs itinéraires
    if (!place._visits_by_itin || place._visits_by_itin.length <= 1) continue;

    const sources = place._visits_by_itin; // [{ itin_id, itin_title, visits, activities }]

    // Clé de validation : hashes de tous les itin_id sources
    const sourceKey = `${placeId}::sources`;
    const currentSourceIds = sources.map(s => s.itin_id).sort().join("|");

    // Vérifier si déjà traité et encore valide (mêmes itins sources)
    if (onlyPending) {
      const saved = config.visit_choices[sourceKey];
      if (saved && saved.source_ids === currentSourceIds) {
        skipped++;
        continue;
      }
    }

    console.log(`\n${"═".repeat(60)}`);
    console.log(`📍 ${placeId} — ${place.name || ""}`);
    console.log(`   ${sources.length} itinéraires sources\n`);

    // Afficher chaque bloc
    sources.forEach((src, i) => {
      const title = src.itin_title || src.itin_id || `Source ${i + 1}`;
      console.log(`  [${i + 1}] "${title}"`);
      if (src.visits.length > 0) {
        console.log(`       Visites (${src.visits.length}):`);
        src.visits.forEach(v => {
          const preview = (v.text || "").substring(0, 100);
          console.log(`         • ${preview}${(v.text || "").length > 100 ? "..." : ""}`);
        });
      }
      if (src.activities.length > 0) {
        console.log(`       Activités (${src.activities.length}):`);
        src.activities.forEach(a => {
          const preview = (a.text || "").substring(0, 100);
          console.log(`         • ${preview}${(a.text || "").length > 100 ? "..." : ""}`);
        });
      }
      console.log();
    });

    console.log(`  [${sources.length + 1}] Tout garder (toutes les sources fusionnées)`);
    console.log();

    const answer = await prompt(`  Choix (1-${sources.length + 1}): `);
    const num = parseInt(answer.trim(), 10);

    let chosenVisits = [];
    let chosenActivities = [];
    let chosenItinId = null;

    if (num >= 1 && num <= sources.length) {
      // Garder le bloc d'un seul itinéraire
      const chosen = sources[num - 1];
      chosenVisits = chosen.visits.map(v => ({ text: v.text, visit_duration_min: v.visit_duration_min }));
      chosenActivities = chosen.activities.map(a => ({ text: a.text, visit_duration_min: a.visit_duration_min }));
      chosenItinId = chosen.itin_id;
      console.log(`  ✅ Source "${chosen.itin_title || chosen.itin_id}" choisie`);
    } else {
      // Tout garder (fusion, déjà dans place.visits/activities)
      chosenVisits = null;   // null = garder tel quel (déjà dédupliqué)
      chosenActivities = null;
      console.log(`  ✅ Toutes les sources conservées`);
    }

    // Sauvegarder le choix
    config.visit_choices[sourceKey] = {
      source_ids: currentSourceIds,
      chosen_itin_id: chosenItinId,  // null = tout garder
      decided_at: new Date().toISOString()
    };

    // Appliquer sur la place FR immédiatement
    if (chosenVisits !== null) {
      place.visits = chosenVisits;
      place.activities = chosenActivities;
    }
    // Stocker l'itin choisi pour propager aux autres langues
    place._chosen_itin_id = chosenItinId;

    treated++;
  }

  await saveConfig();
  if (treated > 0 || skipped > 0) {
    console.log(`\n📊 Dedupe: ${treated} lieu(x) traité(s), ${skipped} déjà OK`);
  }
}

/**
 * Applique le choix de source (itin_id) à une place d'une langue autre que FR.
 * Si un itin_id choisi est disponible dans cette langue, on prend ses visites.
 * Sinon on laisse tel quel (fusion complète).
 */
function applyVisitChoicesToLang(placeFr, placeLang) {
  if (!placeLang) return;

  const sourceKey = `${placeFr.place_id}::sources`;
  const choice = config.visit_choices[sourceKey];
  if (!choice) return;

  const chosenItinId = choice.chosen_itin_id;
  if (!chosenItinId) return; // "tout garder" → on ne touche pas

  // La place de cette langue a-t-elle des données par source ?
  if (!placeLang._visits_by_itin) return;

  const chosenSource = placeLang._visits_by_itin.find(s => s.itin_id === chosenItinId);
  if (!chosenSource) return; // Cet itin n'existe pas dans cette langue → on laisse

  placeLang.visits = chosenSource.visits.map(v => ({ text: v.text, visit_duration_min: v.visit_duration_min }));
  placeLang.activities = chosenSource.activities.map(a => ({ text: a.text, visit_duration_min: a.visit_duration_min }));
}

// ============================================
// EXTRACTION DES PLACES DEPUIS ITINS (PAR LANGUE)
// ============================================
async function extractPlacesFromItins(countryDir, cc, lang) {
  // Chercher le fichier itins.modules pour cette langue
  const candidates = [
    path.join(countryDir, `${cc.toUpperCase()}.itins.modules-${lang}.json`),
    path.join(countryDir, `${cc.toLowerCase()}.itins.modules-${lang}.json`)
  ];
  
  let itinsData = null;
  let itinsPath = null;
  
  for (const candidate of candidates) {
    const data = await readJSON(candidate);
    if (data?.itineraries?.length > 0) {
      itinsData = data;
      itinsPath = candidate;
      break;
    }
  }
  
  if (!itinsData) {
    return { places: [], itinsPath: null };
  }
  
  // Extraction des places
  const placesMap = new Map();
  
  for (const itin of itinsData.itineraries) {
    const itinId = itin.itin_id || itin.id;
    const itinTitle = itin.title || "";
    
    for (const day of itin.days_plan || []) {
      const placeId = day?.night?.place_id;
      const coords = day?.night?.coords;
      const dayNum = day?.day;
      
      if (!placeId) continue;
      
      // Appliquer l'alias si configuré
      const canonicalId = getCanonicalPlaceId(placeId);
      
      if (!placesMap.has(canonicalId)) {
        placesMap.set(canonicalId, {
          place_id: canonicalId,
          original_ids: new Set([placeId]),
          coords: null,
          visits: [],
          activities: [],
          days_plan: []
        });
      }
      
      const entry = placesMap.get(canonicalId);
      entry.original_ids.add(placeId);
      
      // Coords (garder la première valide)
      if (!entry.coords && Array.isArray(coords) && coords.length >= 2) {
        entry.coords = coords.map(Number);
      }
      
      // Visits
      for (const v of day.visits || []) {
        const text = String(v.text || "").trim();
        if (text) {
          entry.visits.push({
            text,
            visit_duration_min: v.visit_duration_min,
            _hash: hashText(text),
            _itin_id: itinId,
            _itin_title: itinTitle
          });
        }
      }
      
      // Activities
      for (const a of day.activities || []) {
        const text = String(a.text || "").trim();
        if (text) {
          entry.activities.push({
            text,
            visit_duration_min: a.visit_duration_min,
            _hash: hashText(text),
            _itin_id: itinId,
            _itin_title: itinTitle
          });
        }
      }
      
      // Days plan
      if (itinId && dayNum !== undefined) {
        entry.days_plan.push({
          itin_id: itinId,
          itin_title: itinTitle,
          day: dayNum
        });
      }
    }
  }
  
  // Convertir en array et dédupliquer les visits/activities
  const places = [];
  
  for (const entry of placesMap.values()) {
    const slug = extractSlug(entry.place_id);
    const ccFromId = entry.place_id.split("::")[0].toUpperCase();
    
    // Nom: priorité config > slug
    let name = getCanonicalName(entry.place_id);
    if (!name) {
      name = slugToName(slug);
    }
    
    // Grouper les visites par itinéraire source (pour le dedupe interactif)
    // visits_by_itin = [{ itin_id, itin_title, visits: [...] }, ...]
    const visitsByItinMap = new Map();
    for (const v of entry.visits) {
      const key = v._itin_id || "__unknown__";
      if (!visitsByItinMap.has(key)) {
        visitsByItinMap.set(key, { itin_id: v._itin_id, itin_title: v._itin_title || "", visits: [], activities: [] });
      }
      visitsByItinMap.get(key).visits.push({ text: v.text, visit_duration_min: v.visit_duration_min, _hash: v._hash });
    }
    for (const a of entry.activities) {
      const key = a._itin_id || "__unknown__";
      if (!visitsByItinMap.has(key)) {
        visitsByItinMap.set(key, { itin_id: a._itin_id, itin_title: a._itin_title || "", visits: [], activities: [] });
      }
      visitsByItinMap.get(key).activities.push({ text: a.text, visit_duration_min: a.visit_duration_min, _hash: a._hash });
    }
    const visitsByItin = Array.from(visitsByItinMap.values());

    // Dédupliquer visits par hash (comportement par défaut, sans dedupe interactif)
    const seenVisitHashes = new Set();
    const visits = [];
    for (const v of entry.visits) {
      if (!seenVisitHashes.has(v._hash)) {
        seenVisitHashes.add(v._hash);
        visits.push({ text: v.text, visit_duration_min: v.visit_duration_min });
      }
    }
    
    // Dédupliquer activities par hash
    const seenActivityHashes = new Set();
    const activities = [];
    for (const a of entry.activities) {
      if (!seenActivityHashes.has(a._hash)) {
        seenActivityHashes.add(a._hash);
        activities.push({ text: a.text, visit_duration_min: a.visit_duration_min });
      }
    }
    
    // Dédupliquer days_plan
    const seenDays = new Set();
    const daysPlan = [];
    for (const dp of entry.days_plan) {
      const key = `${dp.itin_id}::${dp.day}`;
      if (!seenDays.has(key)) {
        seenDays.add(key);
        daysPlan.push(dp);
      }
    }
    
    const place = {
      place_id: entry.place_id,
      name,
      cc: ccFromId,
      language: lang
    };
    
    if (entry.coords) {
      place.coords = entry.coords;
      place.lat = entry.coords[0];
      place.lon = entry.coords[1];
    }
    
    if (visits.length > 0) place.visits = visits;
    if (activities.length > 0) place.activities = activities;
    if (daysPlan.length > 0) place.days_plan = daysPlan;

    // Stocker les sources pour le dedupe (retiré avant écriture dans le master)
    if (visitsByItin.length > 1) {
      place._visits_by_itin = visitsByItin; // présent seulement si plusieurs itins
    }
    
    places.push(place);
  }
  
  places.sort((a, b) => a.place_id.localeCompare(b.place_id));
  
  return { places, itinsPath };
}

// ============================================
// DÉTECTION DES PLACES EN DOUBLE
// ============================================
function detectDuplicatePlaces(allPlaceIds) {
  const duplicates = [];
  const processed = new Set();
  
  const placeIds = [...allPlaceIds];
  
  for (let i = 0; i < placeIds.length; i++) {
    if (processed.has(placeIds[i])) continue;
    
    const slug1 = extractSlug(placeIds[i]);
    const group = [placeIds[i]];
    processed.add(placeIds[i]);
    
    for (let j = i + 1; j < placeIds.length; j++) {
      if (processed.has(placeIds[j])) continue;
      
      const slug2 = extractSlug(placeIds[j]);
      
      // Vérifier si même préfixe CC
      const cc1 = placeIds[i].split("::")[0];
      const cc2 = placeIds[j].split("::")[0];
      if (cc1 !== cc2) continue;
      
      // Similarité des slugs (mots-clés)
      const sim = computeSimilarity(slug1, slug2);
      
      // Vérifier si l'un contient l'autre de manière significative
      // Ex: "paris" et "paris-centre" → "paris" est contenu et représente >70%
      // Seuil à 0.7 pour éviter "beaulieu-sur" dans "beaulieu-sur-dordogne" (0.52)
      let contains = false;
      if (slug1.length > 3 && slug2.length > 3) {
        if (slug2.includes(slug1) && slug1.length / slug2.length > 0.7) {
          contains = true;
        } else if (slug1.includes(slug2) && slug2.length / slug1.length > 0.7) {
          contains = true;
        }
      }
      
      if (sim >= SIMILARITY_THRESHOLD || contains) {
        group.push(placeIds[j]);
        processed.add(placeIds[j]);
      }
    }
    
    if (group.length > 1) {
      duplicates.push(group);
    }
  }
  
  return duplicates;
}

// ============================================
// MODE INTERACTIF: RÉSOLUTION DES DOUBLONS
// ============================================
async function resolveDuplicatePlaces(duplicateGroups, isInteractive) {
  if (duplicateGroups.length === 0) {
    console.log("  ✅ Aucune place en double détectée");
    return;
  }
  
  console.log(`\n🔍 ${duplicateGroups.length} groupe(s) de places potentiellement en double:\n`);
  
  for (const group of duplicateGroups) {
    // Vérifier si déjà résolu dans la config
    const alreadyResolved = group.some(pid => config.place_aliases[pid]);
    if (alreadyResolved) {
      const canonical = getCanonicalPlaceId(group[0]);
      console.log(`  ⏭️  ${group.join(", ")} → déjà résolu: ${canonical}`);
      continue;
    }
    
    console.log(`\n${"─".repeat(50)}`);
    console.log(`📍 Places similaires détectées:`);
    group.forEach((pid, i) => {
      const slug = extractSlug(pid);
      const name = slugToName(slug);
      console.log(`   ${i + 1}. ${pid} → "${name}"`);
    });
    
    if (!isInteractive) {
      console.log(`   ⚠️  Mode non-interactif: garder toutes séparées`);
      continue;
    }
    
    // Options
    const options = [
      ...group.map(pid => `Garder uniquement "${slugToName(extractSlug(pid))}" (fusionner les autres)`),
      "Garder toutes les places séparées (pas de fusion)",
      "Entrer un nom personnalisé pour la fusion"
    ];
    
    const choice = await promptChoice("Que voulez-vous faire ?", options);
    
    if (choice < group.length) {
      // Fusionner vers la place choisie
      const canonical = group[choice];
      const canonicalName = slugToName(extractSlug(canonical));
      
      for (const pid of group) {
        if (pid !== canonical) {
          config.place_aliases[pid] = canonical;
          console.log(`   ✅ ${pid} → ${canonical}`);
        }
      }
      config.canonical_names[canonical] = canonicalName;
      
    } else if (choice === group.length) {
      // Garder séparées - enregistrer ce choix pour ne pas redemander
      console.log(`   ✅ Places gardées séparées`);
      // Marquer chaque place comme "résolue vers elle-même" pour éviter de redemander
      for (const pid of group) {
        config.place_aliases[pid] = pid; // s'aliase vers elle-même = gardé séparé
      }
      
    } else {
      // Nom personnalisé
      const customName = await prompt("Entrez le nom personnalisé: ");
      const canonical = group[0]; // Premier comme référence
      
      for (const pid of group) {
        if (pid !== canonical) {
          config.place_aliases[pid] = canonical;
        }
      }
      config.canonical_names[canonical] = customName;
      console.log(`   ✅ Toutes fusionnées vers "${customName}"`);
    }
  }
  
  // Sauvegarder après résolution
  await saveConfig();
}

// ============================================
// MISE À JOUR DES ITINS AVEC LES NOMS CHOISIS
// ============================================
async function updateItinsWithCanonicalNames(countryDir, cc) {
  let updated = 0;
  
  for (const lang of LANGS) {
    const candidates = [
      path.join(countryDir, `${cc.toUpperCase()}.itins.modules-${lang}.json`),
      path.join(countryDir, `${cc.toLowerCase()}.itins.modules-${lang}.json`)
    ];
    
    for (const itinsPath of candidates) {
      const data = await readJSON(itinsPath);
      if (!data?.itineraries) continue;
      
      let modified = false;
      
      for (const itin of data.itineraries) {
        for (const day of itin.days_plan || []) {
          if (day?.night?.place_id) {
            const oldId = day.night.place_id;
            const newId = getCanonicalPlaceId(oldId);
            
            if (oldId !== newId) {
              day.night.place_id = newId;
              modified = true;
            }
          }
        }
      }
      
      if (modified) {
        // Backup avant modification
        const backupPath = await backupFile(itinsPath);
        if (backupPath) {
          console.log(`  💾 Backup: ${path.basename(backupPath)}`);
        }
        
        await writeJSON(itinsPath, data);
        console.log(`  ✏️  Mis à jour: ${path.basename(itinsPath)}`);
        updated++;
      }
    }
  }
  
  return updated;
}

// ============================================
// GÉNÉRATION DU MASTER POUR UNE LANGUE
// ============================================
async function generateMasterForLang(countryDir, cc, lang, existingMasterData) {
  const { places, itinsPath } = await extractPlacesFromItins(countryDir, cc, lang);
  
  if (places.length === 0) {
    return { places: [], itinsPath: null };
  }
  
  // Si on a un master existant avec des données enrichies (rating, place_type, etc.)
  // On les préserve
  if (existingMasterData?.places) {
    const existingMap = new Map(
      existingMasterData.places.map(p => [p.place_id, p])
    );
    
    for (const place of places) {
      const existing = existingMap.get(place.place_id);
      if (existing) {
        // Préserver les champs enrichis
        if (existing.rating !== undefined) place.rating = existing.rating;
        if (existing.place_type) place.place_type = existing.place_type;
        if (existing.suggested_days !== undefined) place.suggested_days = existing.suggested_days;
        if (existing.kinds) place.kinds = existing.kinds;
        if (existing.hotels) place.hotels = existing.hotels;
        if (existing.images) place.images = existing.images;
      }
    }
  }
  
  return { places, itinsPath };
}

// ============================================
// TRAITEMENT D'UN PAYS
// ============================================
async function processCountry(cc, options) {
  cc = normCC(cc);
  const countryDir = path.join(COUNTRIES_DIR, cc.toLowerCase());
  
  // Vérifier aussi en majuscules
  let actualDir = countryDir;
  if (!await fileExists(countryDir)) {
    const upperDir = path.join(COUNTRIES_DIR, cc.toUpperCase());
    if (await fileExists(upperDir)) {
      actualDir = upperDir;
    } else {
      console.error(`[${cc}] Dossier pays introuvable`);
      return 1;
    }
  }
  
  console.log(`\n${"═".repeat(60)}`);
  console.log(`🌍 Traitement: ${cc}`);
  console.log(`${"═".repeat(60)}`);
  
  // ═══════════════════════════════════════════════════════════
  // PASSE 0: Nettoyage des place_id (retire -centre, -ville, etc.)
  // ═══════════════════════════════════════════════════════════
  if (options.cleanIds !== false) {
    console.log(`\n🧹 PASSE 0: Nettoyage des place_id...`);
    
    const itinsStats = await cleanPlaceIdsInItins(actualDir, cc);
    if (itinsStats.idsChanged > 0) {
      console.log(`  ✅ Itins: ${itinsStats.idsChanged} place_id nettoyé(s) dans ${itinsStats.filesModified} fichier(s)`);
      const examples = itinsStats.changes.slice(0, 5);
      for (const ex of examples) {
        console.log(`     • ${ex.old} → ${ex.new}`);
      }
      if (itinsStats.changes.length > 5) {
        console.log(`     ... et ${itinsStats.changes.length - 5} autre(s)`);
      }
    } else {
      console.log(`  ✅ Itins: aucun nettoyage nécessaire`);
    }
    if (itinsStats.invalid?.length > 0) {
      console.log(`  ⚠️  ${itinsStats.invalid.length} place_id INVALIDE(S) détecté(s) — à corriger manuellement:`);
      for (const inv of itinsStats.invalid) {
        console.log(`     ❌ [${inv.lang}] ${inv.id}`);
      }
    }
    
    // TOUJOURS nettoyer les masters existants (ils peuvent avoir des suffixes même si les itins n'en ont pas)
    const mastersStats = await cleanPlaceIdsInMasters(actualDir, cc);
    if (mastersStats.idsChanged > 0) {
      console.log(`  ✅ Masters: ${mastersStats.idsChanged} place_id nettoyé(s) dans ${mastersStats.filesModified} fichier(s)`);
    } else {
      console.log(`  ✅ Masters: aucun nettoyage nécessaire`);
    }
    
    // Nettoyer aussi l'Excel photos de ce pays
    const excelStats = await cleanPlaceIdsInPhotosExcel(cc);
    if (excelStats.idsChanged > 0) {
      console.log(`  ✅ Excel photos: ${excelStats.idsChanged} place_id nettoyé(s)${excelStats.merged > 0 ? `, ${excelStats.merged} fusionné(s)` : ''}`);
    } else {
      console.log(`  ✅ Excel photos: aucun nettoyage nécessaire`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════
  // PASSE 1: Extraction des places
  // ═══════════════════════════════════════════════════════════
  console.log(`\n📥 PASSE 1: Extraction des places...`);
  
  // Collecter tous les place_ids de toutes les langues
  const allPlaceIds = new Set();
  const placesByLang = {};
  
  for (const lang of LANGS) {
    const { places } = await extractPlacesFromItins(actualDir, cc, lang);
    if (places.length > 0) {
      placesByLang[lang] = places;
      for (const p of places) {
        allPlaceIds.add(p.place_id);
      }
      console.log(`  📄 ${lang.toUpperCase()}: ${places.length} places extraites`);
    }
  }
  
  if (allPlaceIds.size === 0) {
    console.log(`  ⏭️  Aucun itinéraire trouvé`);
    return 0;
  }
  
  // Détecter les doublons
  const duplicates = detectDuplicatePlaces(allPlaceIds);
  
  // Résoudre les doublons (interactif ou pas)
  if (options.interactive && duplicates.length > 0) {
    await resolveDuplicatePlaces(duplicates, true);
    
    // Ré-extraire avec les alias appliqués
    for (const lang of LANGS) {
      const { places } = await extractPlacesFromItins(actualDir, cc, lang);
      if (places.length > 0) {
        placesByLang[lang] = places;
      }
    }
  } else if (duplicates.length > 0) {
    console.log(`  ⚠️  ${duplicates.length} groupe(s) de doublons potentiels (utilisez --interactive)`);
    for (const group of duplicates) {
      console.log(`     • ${group.join(", ")}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════
  // PRÉSERVER LES DONNÉES ENRICHIES (ratings, place_type, etc.)
  // ═══════════════════════════════════════════════════════════
  // On charge AVANT suppression pour ne rien perdre
  const enrichedDataByLang = {};
  
  console.log(`\n💾 Chargement des données enrichies existantes...`);
  let totalEnriched = 0;
  
  for (const lang of LANGS) {
    const masterPath = path.join(actualDir, `${cc.toLowerCase()}.places.master-${lang}.json`);
    if (await fileExists(masterPath)) {
      const existingData = await readJSON(masterPath);
      if (existingData?.places) {
        enrichedDataByLang[lang] = new Map(
          existingData.places.map(p => [p.place_id, {
            rating: p.rating,
            place_type: p.place_type,
            suggested_days: p.suggested_days,
            kinds: p.kinds,
            hotels: p.hotels,
            images: p.images,
            description: p.description,
            wikipedia_url: p.wikipedia_url,
            wikidata_id: p.wikidata_id
          }])
        );
        const enrichedCount = existingData.places.filter(p => p.rating !== undefined || p.place_type).length;
        if (enrichedCount > 0) {
          console.log(`  📄 ${lang.toUpperCase()}: ${enrichedCount} places avec données enrichies`);
          totalEnriched += enrichedCount;
        }
      }
    }
  }
  
  if (totalEnriched > 0) {
    console.log(`  ✅ ${totalEnriched} places enrichies préservées`);
  }
  
  // Mode rebuild: supprimer les masters existants (données déjà sauvegardées en mémoire)
  if (options.rebuild) {
    console.log(`\n🗑️  Mode REBUILD: suppression des masters existants...`);
    for (const lang of LANGS) {
      const masterPath = path.join(actualDir, `${cc.toLowerCase()}.places.master-${lang}.json`);
      if (await fileExists(masterPath)) {
        const backupPath = await backupFile(masterPath);
        await fs.unlink(masterPath);
        console.log(`  🗑️  Supprimé: ${path.basename(masterPath)} (backup: ${path.basename(backupPath)})`);
      }
    }
  }
  
  // Générer les nouveaux masters
  console.log(`\n📝 Génération des masters...`);
  
  for (const lang of Object.keys(placesByLang)) {
    const places = placesByLang[lang];
    
    // Récupérer les données enrichies préchargées (mode rebuild) ou lire le fichier (mode merge)
    const masterPath = path.join(actualDir, `${cc.toLowerCase()}.places.master-${lang}.json`);
    const existingMap = enrichedDataByLang[lang] || (
      !options.rebuild && await fileExists(masterPath) 
        ? new Map((await readJSON(masterPath))?.places?.map(p => [p.place_id, p]) || [])
        : new Map()
    );
    
    // Appliquer les données enrichies
    let restoredCount = 0;
    for (const place of places) {
      const existing = existingMap.get(place.place_id);
      if (existing) {
        if (existing.rating !== undefined) { place.rating = existing.rating; restoredCount++; }
        if (existing.place_type) place.place_type = existing.place_type;
        if (existing.suggested_days !== undefined) place.suggested_days = existing.suggested_days;
        if (existing.kinds) place.kinds = existing.kinds;
        if (existing.hotels) place.hotels = existing.hotels;
        if (existing.images) place.images = existing.images;
        if (existing.description) place.description = existing.description;
        if (existing.wikipedia_url) place.wikipedia_url = existing.wikipedia_url;
        if (existing.wikidata_id) place.wikidata_id = existing.wikidata_id;
      }
    }

    // ── PASSE DEDUPE VISITES (FR uniquement en interactif) ──
    // Pour FR : on demande à l'utilisateur quelles visites garder (si doublons)
    // Pour les autres langues : on applique les choix sauvegardés par index
    if (lang === "fr" && (options.dedupeVisits || options.dedupePending)) {
      console.log(`\n🔍 PASSE DEDUPE: Détection des visites similaires (${lang.toUpperCase()})...`);
      await dedupeVisitsInteractive(places, !!options.dedupePending);
    } else if (lang !== "fr" && placesByLang["fr"]) {
      // Appliquer les choix FR aux autres langues
      const frPlaces = placesByLang["fr"];
      const frMap = new Map(frPlaces.map(p => [p.place_id, p]));
      for (const place of places) {
        const frPlace = frMap.get(place.place_id);
        if (frPlace) {
          applyVisitChoicesToLang(frPlace, place);
        }
      }
    }
    
    // Construire le master — retirer les champs internes avant écriture
    const cleanPlaces = places.map(p => {
      const { _visits_by_itin, _chosen_itin_id, ...clean } = p;
      return clean;
    });

    const master = {
      version: 1,
      country: cc.toLowerCase(),
      language: lang,
      places: cleanPlaces
    };
    
    // Backup si le fichier existe
    if (await fileExists(masterPath) && !options.rebuild) {
      await backupFile(masterPath);
    }
    
    await writeJSON(masterPath, master);
    const enrichedInfo = restoredCount > 0 ? `, ${restoredCount} ratings préservés` : '';
    console.log(`  ✅ ${lang.toUpperCase()}: ${path.basename(masterPath)} (${places.length} places${enrichedInfo})`);
  }
  
  // Mettre à jour les itins si des alias ont été définis
  if (Object.keys(config.place_aliases).length > 0 && options.updateItins !== false) {
    console.log(`\n✏️  Mise à jour des itins avec les noms canoniques...`);
    const updatedCount = await updateItinsWithCanonicalNames(actualDir, cc);
    if (updatedCount === 0) {
      console.log(`  ✅ Aucune modification nécessaire`);
    }
  }
  
  return 0;
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║       MERGE-PLACES-V2 - Reconstruction propre             ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  
  const hasAll = !!args.all;
  const cc = args.country ? normCC(args.country) : null;
  const isRebuild = !!args.rebuild;
  const isInteractive = !!args.interactive;
  const applyOnly = !!args["apply-only"];
  const noClean = !!args["no-clean"];
  const dedupeVisits = !!args["dedupe-visits"];   // Dédupliquer toutes les visites (interactif)
  const dedupePending = !!args["dedupe-pending"];  // Dédupliquer seulement celles pas encore traitées
  
  if (!hasAll && !cc) {
    console.error("❌ Usage: node merge-places-v2.mjs --country=XX [--rebuild] [--interactive]");
    console.error("         node merge-places-v2.mjs --all [--rebuild]");
    console.error("");
    console.error("Options:");
    console.error("  --country=XX       Traiter un seul pays");
    console.error("  --all              Traiter tous les pays");
    console.error("  --rebuild          Supprimer les masters et reconstruire");
    console.error("  --interactive      Mode interactif pour résoudre les doublons de places");
    console.error("  --apply-only       Appliquer les choix existants sans prompt");
    console.error("  --no-clean         Désactiver le nettoyage des place_id (PASSE 0)");
    console.error("  --dedupe-visits    Interactif: choisir les visites à garder (toutes)");
    console.error("  --dedupe-pending   Interactif: choisir uniquement les visites pas encore traitées");
    process.exit(1);
  }
  
  // Charger la config
  await loadConfig();
  
  const options = {
    rebuild: isRebuild,
    interactive: isInteractive && !applyOnly,
    updateItins: true,
    cleanIds: !noClean,      // PASSE 0 activée par défaut
    dedupeVisits,            // Dedupe toutes les visites
    dedupePending            // Dedupe seulement les pending
  };
  
  console.log(`📌 Mode: ${isRebuild ? "REBUILD" : "MERGE"}`);
  console.log(`📌 Interactif places: ${options.interactive ? "OUI" : "NON"}`);
  console.log(`📌 Nettoyage place_id: ${options.cleanIds ? "OUI" : "NON"}`);
  console.log(`📌 Dedupe visites: ${dedupeVisits ? "TOUTES" : dedupePending ? "PENDING SEULEMENT" : "NON"}`);
  console.log(`📌 Base: ${COUNTRIES_DIR}\n`);
  
  try {
    const countries = hasAll ? await listCountryCodes() : [cc];
    let errors = 0;
    
    for (const c of countries) {
      const rc = await processCountry(c, options);
      if (rc !== 0) errors++;
    }
    
    // Nettoyer le JSON photos global (une seule fois après tous les pays)
    if (options.cleanIds) {
      console.log(`\n📸 Nettoyage du JSON photos global...`);
      const jsonStats = await cleanPlaceIdsInPhotosJson();
      if (jsonStats.idsChanged > 0) {
        console.log(`  ✅ JSON photos: ${jsonStats.idsChanged} place_id nettoyé(s)${jsonStats.merged > 0 ? `, ${jsonStats.merged} fusionné(s)` : ''}`);
      } else {
        console.log(`  ✅ JSON photos: aucun nettoyage nécessaire`);
      }
      
      console.log(`\n⏱️  Nettoyage du fichier durées...`);
      const durStats = await cleanPlaceIdsInDurations();
      if (durStats.idsChanged > 0) {
        console.log(`  ✅ Durées: ${durStats.idsChanged} place_id nettoyé(s)${durStats.merged > 0 ? `, ${durStats.merged} fusionné(s)` : ''}`);
      } else {
        console.log(`  ✅ Durées: aucun nettoyage nécessaire`);
      }
    }
    
    closeReadline();
    
    console.log(`\n${"═".repeat(60)}`);
    console.log(`✅ Terminé: ${countries.length} pays traité(s), ${errors} erreur(s)`);
    console.log(`${"═".repeat(60)}\n`);
    
    process.exit(errors > 0 ? 1 : 0);
    
  } catch (e) {
    closeReadline();
    console.error(`\n❌ ERREUR FATALE: ${e.message}`);
    console.error(e.stack);
    process.exit(1);
  }
}

main();
