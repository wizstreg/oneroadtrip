#!/usr/bin/env node
/**
 * scrape-booking-hotels-v2.js
 * 
 * Version 2 basée sur le script v1 qui fonctionne.
 * 
 * CHANGEMENTS PAR RAPPORT À V1 :
 * - 2 hôtels par place (au lieu de 5), mieux notés, prix variés
 * - Dates haute saison par pays (meilleure visibilité des hôtels + prix réels)
 * - Va sur la page de chaque hôtel pour récupérer :
 *   - 2 photos haute résolution
 *   - Descriptions en 5 langues (fr, en, es, pt, it)
 * - Fonctionne par passes (on peut étaler sur plusieurs jours)
 * - Alerte si un pays n'est pas dans la table haute saison
 * 
 * USAGE :
 *   node scrape-booking-hotels-v2.js --base=C:\OneRoadTrip\data\Roadtripsprefabriques [options]
 * 
 * OPTIONS :
 *   --country=XX       Traiter un seul pays
 *   --resume           Reprendre depuis la dernière sauvegarde
 *   --dry-run          Afficher les places sans scraper
 *   --batch=3          Requêtes par lot (défaut: 3)
 *   --pause=90         Pause entre lots en secondes (défaut: 90)
 *   --pass=search      Passe à exécuter :
 *                        search = recherche + photos + description FR
 *                        desc-en, desc-es, desc-pt, desc-it = descriptions autres langues
 *                        all = tout d'un coup
 *   --max-errors=10    Erreurs consécutives avant arrêt (défaut: 10)
 */

console.log('=== SCRAPE BOOKING V2 ===');

// ============ IMPORTS (copié du v1 qui marche) ============
let fs, path, puppeteer, StealthPlugin;
try {
    fs = require('fs');
    path = require('path');
    try {
        puppeteer = require('puppeteer-extra');
        StealthPlugin = require('puppeteer-extra-plugin-stealth');
        puppeteer.use(StealthPlugin());
        console.log('puppeteer-extra + stealth OK');
    } catch (e) {
        puppeteer = require('puppeteer');
        console.log('puppeteer standard OK');
    }
} catch (e) {
    console.error('ERREUR IMPORT:', e.message);
    console.error('npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth');
    process.exit(1);
}

// ============ ÉCRITURE SÉCURISÉE (anti-corruption) ============
// Écrit data dans filePath de manière atomique :
//   1. JSON.stringify d'abord (lève une erreur si data est cassé, AVANT de toucher au disque)
//   2. Écriture dans filePath.tmp
//   3. Si keepBackups > 0, on fait tourner les backups : .bak2 -> .bak3, .bak1 -> .bak2, fichier -> .bak1
//   4. Rename atomique .tmp -> filePath
// Si quoi que ce soit plante avant le rename, l'ancien filePath reste intact.
function safeWriteJson(filePath, data, opts) {
    opts = opts || {};
    const keepBackups = opts.keepBackups || 0;

    // 1. Sérialiser AVANT toute écriture (échoue tôt si data est invalide)
    let json;
    try {
        json = JSON.stringify(data, null, 2);
    } catch (e) {
        throw new Error(`safeWriteJson: JSON.stringify a échoué pour ${filePath}: ${e.message}`);
    }
    if (!json || json.length < 2) {
        throw new Error(`safeWriteJson: refus d'écrire un JSON vide ou invalide dans ${filePath}`);
    }

    // 2. Écriture dans le .tmp
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, json, 'utf8');

    // 3. Vérification basique : on peut relire et reparser le .tmp
    try {
        const reread = fs.readFileSync(tmpPath, 'utf8');
        JSON.parse(reread); // throw si corrompu
    } catch (e) {
        // .tmp cassé -> on le supprime et on garde l'original intact
        try { fs.unlinkSync(tmpPath); } catch (_) {}
        throw new Error(`safeWriteJson: relecture du .tmp KO pour ${filePath}: ${e.message}`);
    }

    // 4. Rotation des backups (seulement si demandé et si le fichier existe déjà)
    if (keepBackups > 0 && fs.existsSync(filePath)) {
        // Décale .bak(N-1) -> .bakN ... .bak1 -> .bak2
        for (let i = keepBackups; i > 1; i--) {
            const src = `${filePath}.bak${i - 1}`;
            const dst = `${filePath}.bak${i}`;
            if (fs.existsSync(src)) {
                try { fs.renameSync(src, dst); } catch (_) {}
            }
        }
        // Fichier actuel -> .bak1
        try { fs.renameSync(filePath, `${filePath}.bak1`); } catch (_) {}
    }

    // 5. Rename atomique .tmp -> filePath
    fs.renameSync(tmpPath, filePath);
}

// ============ HAUTE SAISON PAR PAYS ============
// Mois de checkin en haute saison (1=jan, 7=jul, etc.)
// Si un pays n'est PAS dans cette table, le script alerte et utilise +3 mois par défaut
const HIGH_SEASON = {
    // Europe été (juillet)
    FR: 7, ES: 7, IT: 7, PT: 7, GR: 7, HR: 7, ME: 7, AL: 7, BA: 7,
    RS: 7, BG: 7, RO: 7, SI: 7, SK: 7, CZ: 7, PL: 7, HU: 7, AT: 7,
    DE: 7, CH: 7, BE: 7, NL: 7, LT: 7, LV: 7, GB: 7, IE: 7, IS: 7,
    DK: 7, NO: 7, SE: 7, FI: 7, MD: 7, EA: 7,
    // Amérique du Nord été
    US: 7, CA: 7,
    // Asie centrale été
    KZ: 7, UZ: 6, TM: 5, GE: 7, AM: 7,
    // Méditerranée orientale été
    TR: 7, IL: 7, JO: 4,  // Jordanie : printemps
    // Asie de l'Est été
    CN: 7, JP: 4, KR: 7, MN: 7,  // Japon : cerisiers avril
    // Moyen-Orient hiver
    AE: 1, OM: 1,
    // Asie du Sud-Est hiver
    TH: 1, KH: 12, LA: 12, VN: 1, PH: 1, MY: 12, ID: 7, BD: 12, LK: 1, IN: 12,
    // Afrique du Nord
    MA: 4, EG: 12,
    // Caraïbes/Antilles hiver
    CU: 1, DO: 1, BB: 1, BS: 1, BZ: 1, GP: 1, MQ: 1, MF: 1, BL: 1, WF: 7, GF: 8,
    // Mexique/Amérique Centrale hiver
    MX: 1, GT: 1, CR: 1, SV: 1, NI: 1, PA: 1, CO: 1,
    // Afrique australe (saison sèche juin-oct)
    ZA: 7, BW: 7, TZ: 7, NA: 7, MG: 8, MU: 12, YT: 8, RE: 12,
    // Amérique du Sud été austral (déc-fév)
    AR: 1, BR: 1, CL: 1, PE: 6, BO: 6, PY: 1, EC: 7,  // Pérou/Bolivie : saison sèche
    // Océanie/Pacifique
    AU: 1, NZ: 1, NC: 1, PF: 7
};

// Calcule les dates checkin/checkout en haute saison pour un pays
function getHighSeasonDates(cc) {
    const month = HIGH_SEASON[cc.toUpperCase()];
    if (!month) return null; // Pays inconnu

    // Année prochaine pour être sûr d'avoir de la dispo
    const now = new Date();
    let year = now.getFullYear();
    // Si le mois de haute saison est déjà passé cette année, prendre l'année prochaine
    if (month <= now.getMonth() + 1) year++;

    // Checkin le 15 du mois (milieu de haute saison), checkout le 16 (1 nuit)
    const checkin = `${year}-${String(month).padStart(2, '0')}-15`;
    const checkout = `${year}-${String(month).padStart(2, '0')}-16`;
    return { checkin, checkout };
}

// ============ CONFIGURATION ============
const CONFIG = {
    batchSize: 20,             // Agressif - Booking ne bloque pas
    pauseBetweenBatches: 10,   // 10s suffisent
    pauseBetweenRequests: 0,   // Pas de pause entre les pages
    pauseOnError: 30,          // Pause erreur courte
    minRating: 9.0,
    hotelsPerPlace: 3,
    photosPerHotel: 2,
    timeout: 40000,
    headless: false,
    maxConsecutiveErrors: 15,
    maxRetries: 2,
    browserRestartEvery: 100,  // Moins de redémarrages
    outputFilename: 'hotels_v2.json',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    languages: {
        'fr': { urlSuffix: 'fr', field: 'description_fr', acceptLang: 'fr-FR,fr;q=0.9', browserLang: 'fr-FR,fr' },
        'en': { urlSuffix: 'en-gb', field: 'description_en', acceptLang: 'en-GB,en;q=0.9', browserLang: 'en-GB,en' },
        'es': { urlSuffix: 'es', field: 'description_es', acceptLang: 'es-ES,es;q=0.9', browserLang: 'es-ES,es' },
        'pt': { urlSuffix: 'pt-pt', field: 'description_pt', acceptLang: 'pt-PT,pt;q=0.9', browserLang: 'pt-PT,pt' },
        'it': { urlSuffix: 'it', field: 'description_it', acceptLang: 'it-IT,it;q=0.9', browserLang: 'it-IT,it' }
    }
};

// ============ HELPERS ============
function parseArgs() {
    const args = {};
    process.argv.slice(2).forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            args[key] = value === undefined ? true : value;
        }
    });
    return args;
}

function log(msg, type = 'INFO') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = {
        'INFO': '📋', 'OK': '✅', 'WARN': '⚠️', 'ERROR': '❌',
        'HOTEL': '🏨', 'PAUSE': '⏸️', 'SKIP': '⏭️', 'PHOTO': '📷',
        'DESC': '📝', 'SAVE': '💾', 'LANG': '🌐', 'STOP': '🛑',
        'ALERT': '🚨'
    }[type] || '•';
    console.log(`[${timestamp}] ${prefix} ${msg}`);
}

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function extractBookingSlug(bookingUrl) {
    const match = bookingUrl.match(/\/hotel\/([a-z]{2})\/([^.?/]+)/);
    return match ? { countryCode: match[1], slug: match[2] } : null;
}

function buildHotelUrl(bookingUrl, langSuffix) {
    const parts = extractBookingSlug(bookingUrl);
    if (!parts) return null;
    return `https://www.booking.com/hotel/${parts.countryCode}/${parts.slug}.${langSuffix}.html`;
}

// V3 : auto-exclusion d'une place qui ne ramène jamais d'hôtels (après 2 passes ≥9 puis ≥8).
// Le fichier hotels_excluded.json est lu par check-and-scrape-hotels-v3 pour ne plus
// retenter ces places. Format : { "FR::xxx": { reason, excluded_at }, ... }
function addToExcludedList(place) {
    const EXCLUDED_FILE = 'C:\\OneRoadTrip\\data\\hotels_excluded.json';
    let excluded = {};
    try {
        if (fs.existsSync(EXCLUDED_FILE)) {
            excluded = JSON.parse(fs.readFileSync(EXCLUDED_FILE, 'utf8'));
        }
    } catch (e) {
        log(`Erreur lecture ${EXCLUDED_FILE}: ${e.message}`, 'WARN');
        excluded = {};
    }
    if (excluded[place.place_id]) return; // déjà exclue
    excluded[place.place_id] = {
        name: place.name,
        country: place.country,
        reason: 'no-results-after-2-passes',
        excluded_at: new Date().toISOString()
    };
    try {
        safeWriteJson(EXCLUDED_FILE, excluded);
        log(`Auto-exclusion ajoutée : ${place.place_id} (no-results-after-2-passes)`, 'INFO');
    } catch (e) {
        log(`Erreur écriture ${EXCLUDED_FILE}: ${e.message}`, 'WARN');
    }
}

// ============ LANCEMENT NAVIGATEUR (copié du v1) ============
async function launchBrowser(lang = 'fr-FR,fr') {
    log(`Lancement du navigateur (langue: ${lang})...`);
    const browser = await puppeteer.launch({
        headless: CONFIG.headless ? 'new' : false,
        ignoreHTTPSErrors: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            `--lang=${lang}`
        ],
        ignoreDefaultArgs: ['--enable-automation']
    });
    return browser;
}

// ============ FERMETURE POPUPS (copié du v1) ============
async function closePopups(page) {
    const popupSelectors = [
        '[aria-label="Dismiss sign-in info."]',
        '[aria-label="Fermer"]',
        'button[aria-label="Fermer"]',
        '#onetrust-accept-btn-handler',
        '[id*="cookie"] button',
        '[class*="cookie"] button',
        '[data-testid="close-button"]',
        '.bui-modal__close',
        '[class*="dismiss"]',
        '[class*="close-button"]',
        'button[title="Fermer"]',
        '[aria-label="Close"]',
        'button[aria-label="Close"]',
        'button[aria-label="Cerrar"]',
        'button[aria-label="Chiudi"]',
        'button[aria-label="Fechar"]'
    ];
    for (const selector of popupSelectors) {
        try {
            const btn = await page.$(selector);
            if (btn) { await btn.click(); await sleep(0.5); }
        } catch (e) {}
    }
}

// ============ SCRAPING PAGE DE RÉSULTATS (basé sur v1) ============
async function scrapeSearchResults(browser, place, minRating) {
    const page = await browser.newPage();

    try {
        await page.setUserAgent(CONFIG.userAgent);
        await page.setViewport({ width: 1920, height: 1080 });

        const searchQuery = encodeURIComponent(place.searchName);
        const ratingParam = Math.round(minRating * 10);

        // Dates haute saison
        const dates = getHighSeasonDates(place.country);
        let url = `https://www.booking.com/searchresults.fr.html?ss=${searchQuery}&nflt=review_score%3D${ratingParam}`;
        if (dates) {
            url += `&checkin=${dates.checkin}&checkout=${dates.checkout}&group_adults=2&no_rooms=1`;
            log(`  Dates haute saison: ${dates.checkin} → ${dates.checkout}`);
        }

        log(`URL: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: CONFIG.timeout });
        await sleep(3);

        // Fermer popups (comme v1)
        await closePopups(page);
        await sleep(1);

        // DEBUG (comme v1)
        const debugInfo = await page.evaluate(() => {
            const cards1 = document.querySelectorAll('[data-testid="property-card"]');
            const cards2 = document.querySelectorAll('[data-testid="property-card-container"]');
            const cards3 = document.querySelectorAll('.sr_property_block');
            const cards4 = document.querySelectorAll('[data-hotelid]');
            return { cards1: cards1.length, cards2: cards2.length, cards3: cards3.length, cards4: cards4.length, title: document.title };
        });
        log(`DEBUG - Cards: testid=${debugInfo.cards1}, container=${debugInfo.cards2}, sr_property=${debugInfo.cards3}, hotelid=${debugInfo.cards4}`);
        log(`DEBUG - Title: ${debugInfo.title}`);

        // Extraire les hôtels (sélecteurs multiples comme v1)
        const hotels = await page.evaluate((maxHotels) => {
            const results = [];

            // Fallback sélecteurs (comme v1)
            let cards = document.querySelectorAll('[data-testid="property-card"]');
            if (cards.length === 0) cards = document.querySelectorAll('[data-testid="property-card-container"]');
            if (cards.length === 0) cards = document.querySelectorAll('[data-hotelid]');
            if (cards.length === 0) cards = document.querySelectorAll('.sr_property_block');

            for (const card of cards) {
                if (results.length >= maxHotels * 3) break; // On en prend plus pour filtrer ensuite
                try {
                    // Nom (sélecteurs multiples comme v1)
                    let name = null;
                    const nameSelectors = ['[data-testid="title"]', '.sr-hotel__name', 'h3', '[data-testid="header-title"]', 'a[data-testid="title-link"] div'];
                    for (const sel of nameSelectors) {
                        const el = card.querySelector(sel);
                        if (el && el.textContent.trim()) { name = el.textContent.trim(); break; }
                    }
                    if (!name) continue;

                    // Note (sélecteurs multiples comme v1)
                    let score = 0;
                    const scoreSelectors = ['[data-testid="review-score"] div:first-child', '.bui-review-score__badge', '[aria-label*="Note"]', '.review-score-badge'];
                    for (const sel of scoreSelectors) {
                        const el = card.querySelector(sel);
                        if (el) {
                            const txt = el.textContent.trim().replace(',', '.');
                            const match = txt.match(/[\d.]+/);
                            if (match) { score = parseFloat(match[0]); break; }
                        }
                    }

                    // Prix
                    let price = null;
                    const priceEl = card.querySelector('[data-testid="price-and-discounted-price"], .bui-price-display__value, [data-testid="price"]');
                    if (priceEl) {
                        const match = priceEl.textContent.match(/[\d\s]+/);
                        if (match) price = parseInt(match[0].replace(/\s/g, ''));
                    }

                    // Lien
                    const linkEl = card.querySelector('a[href*="/hotel/"]');
                    const href = linkEl ? linkEl.href : '';

                    // Image miniature (backup)
                    const imgEl = card.querySelector('img[src*="bstatic"], img[data-src]');
                    const thumbUrl = imgEl ? (imgEl.src || imgEl.dataset?.src || '') : '';

                    if (name && score > 0 && href) {
                        results.push({ name, score, price, bookingUrl: href, thumbUrl });
                    }
                } catch (e) {}
            }
            return results;
        }, CONFIG.hotelsPerPlace);

        log(`Extraction: ${hotels.length} hôtels bruts trouvés`);
        hotels.forEach(h => log(`  - ${h.name}: ${h.score}/10, prix: ${h.price || '?'}`));

        // Filtrer par note
        let filtered = hotels.filter(h => h.score >= minRating);
        log(`Après filtrage >= ${minRating}: ${filtered.length} hôtels`);

        // Vérifier que Booking a bien compris la recherche.
        // Si le titre de la page ne contient pas le nom cherché, c'est que Booking
        // a redirigé vers autre chose (ex: "Malta Hochalmstrasse" -> île de Malte).
        const pageTitle = (await page.title()).toLowerCase();
        const searchTerm = place.searchName.toLowerCase();
        // On extrait le premier mot significatif (>3 chars) du nom recherché
        const searchTokens = searchTerm.split(/\s+/).filter(t => t.length > 3);
        const titleHasSearchTerm = searchTokens.length === 0
            ? true // Si nom court, on ne peut pas vérifier, on garde
            : searchTokens.some(t => pageTitle.includes(t));

        if (!titleHasSearchTerm && filtered.length > 0) {
            log(`  ⛔ Booking a redirigé hors sujet (titre: "${pageTitle.substring(0, 80)}")`, 'WARN');
            log(`  ${filtered.length} hôtels rejetés (recherche détournée)`);
            filtered = [];
        }
        // Sinon on garde tous les hôtels, peu importe le pays Booking de l'URL.
        // Booking renvoie déjà ce qui est géographiquement proche du terme cherché,
        // donc un hôtel en DE/CH à 5 km d'une place AT frontalière est pertinent.

        await page.close();

        if (filtered.length === 0) return [];

        // Sélectionner 3 hôtels en 3 gammes de prix ($, $$, $$$)
        // Dans chaque gamme, prendre le mieux noté
        let selected = [];

        // Séparer ceux qui ont un prix de ceux qui n'en ont pas
        const withPrice = filtered.filter(h => h.price && h.price > 0).sort((a, b) => a.price - b.price);
        const noPrice = filtered.filter(h => !h.price || h.price === 0).sort((a, b) => b.score - a.score);

        if (withPrice.length >= 3) {
            // Assez d'hôtels avec prix : découper en 3 tiers
            const third = Math.ceil(withPrice.length / 3);
            const budget = withPrice.slice(0, third);           // tiers le moins cher
            const mid = withPrice.slice(third, third * 2);       // tiers du milieu
            const premium = withPrice.slice(third * 2);          // tiers le plus cher

            // Mieux noté de chaque tiers
            budget.sort((a, b) => b.score - a.score);
            mid.sort((a, b) => b.score - a.score);
            premium.sort((a, b) => b.score - a.score);

            selected.push({ ...budget[0], priceLevel: 1 });      // $
            selected.push({ ...mid[0], priceLevel: 2 });          // $$
            selected.push({ ...premium[0], priceLevel: 3 });      // $$$
        } else if (withPrice.length === 2) {
            // 2 hôtels avec prix : le moins cher = $, le plus cher = $$$
            selected.push({ ...withPrice[0], priceLevel: 1 });
            selected.push({ ...withPrice[1], priceLevel: 3 });
            // Compléter avec un sans prix si dispo
            if (noPrice.length > 0) selected.push({ ...noPrice[0], priceLevel: 2 });
        } else if (withPrice.length === 1) {
            selected.push({ ...withPrice[0], priceLevel: 2 });
            // Compléter avec les sans prix
            for (let i = 0; i < Math.min(2, noPrice.length); i++) {
                selected.push({ ...noPrice[i], priceLevel: 2 });
            }
        } else {
            // Aucun prix : prendre les 3 mieux notés, tous en $$
            for (let i = 0; i < Math.min(3, noPrice.length); i++) {
                selected.push({ ...noPrice[i], priceLevel: 2 });
            }
        }

        // Log
        const priceSym = { 1: '$', 2: '$$', 3: '$$$' };
        log(`Sélection: ${selected.length} hôtels`, 'OK');
        selected.forEach(h => log(`  ✓ [${priceSym[h.priceLevel]}] ${h.name}: ${h.score}/10, prix: ${h.price || '?'}`, 'HOTEL'));
        return selected;

    } catch (e) {
        log(`Erreur recherche ${place.name}: ${e.message}`, 'ERROR');
        try { if (page && !page.isClosed()) await page.close(); } catch (ce) {}
        throw e; // Remonter l'erreur pour gestion dans main
    }
}

// ============ SCRAPING PAGE HÔTEL : PHOTOS + DESC ============
async function scrapeHotelPage(browser, bookingUrl, langSuffix) {
    const url = buildHotelUrl(bookingUrl, langSuffix);
    if (!url) return { photos: [], description: null };

    // Trouver la config de langue pour le Accept-Language
    const langConfig = Object.values(CONFIG.languages).find(l => l.urlSuffix === langSuffix);
    const acceptLang = langConfig ? langConfig.acceptLang : 'fr-FR,fr;q=0.9';

    const page = await browser.newPage();
    try {
        await page.setUserAgent(CONFIG.userAgent);
        await page.setViewport({ width: 1920, height: 1080 });
        // Forcer la langue du navigateur pour que Booking serve la bonne trad
        await page.setExtraHTTPHeaders({ 'Accept-Language': acceptLang });

        log(`    Chargement: ${url.substring(0, 80)}...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: CONFIG.timeout });
        await sleep(2);
        await closePopups(page);
        await sleep(1);

        // Vérifier blocage
        const pageTitle = await page.title();
        if (pageTitle.toLowerCase().includes('access denied') || pageTitle.toLowerCase().includes('captcha')) {
            await page.close();
            throw new Error('BLOCKED');
        }

        const data = await page.evaluate((photosNeeded) => {
            let description = null;
            let photos = [];

            // === DESCRIPTION ===
            // Booking met souvent du texte publicitaire (Genius, "haut de gamme") 
            // avant la vraie description. On doit les ignorer.
            const junkPatterns = [
                // FR
                'vous pouvez peut-être bénéficier',
                'réduction genius',
                'réductions genius',
                'connectez-vous pour voir',
                'profitez des services haut de gamme',
                'bénéficiez d\'un traitement vip',
                'les réductions genius proposées',
                'genius est disponible',
                // EN
                'get the celebrity treatment',
                'you may be eligible for a genius discount',
                'sign in to see',
                'genius discounts',
                'genius discount available',
                'the genius discounts at this property',
                // ES
                'podrías optar a un descuento genius',
                'quizás tengas un descuento genius',
                'aprovecha el trato de celebridad',
                'los descuentos genius de este alojamiento',
                'descuento genius',
                // PT
                'talvez você tenha um desconto genius',
                'aproveite o tratamento vip',
                'os descontos genius nesta propriedade',
                'desconto genius',
                // IT
                'potresti avere diritto',
                'approfitta del trattamento vip',
                'gli sconti genius di questa struttura',
                'sconto genius'
            ];

            // Chercher tous les blocs de texte candidats
            const descCandidates = document.querySelectorAll(
                '[data-testid="property-description"],' +
                '#property_description_content,' +
                '.hotel_description_wrapper_exp,' +
                '.hp_desc_main_content,' +
                '[data-testid="property-description"] p,' +
                '#property_description_content p'
            );

            for (const block of descCandidates) {
                if (description) break;
                let text = block.innerText.trim().replace(/\n{3,}/g, '\n\n');
                if (!text || text.length < 50) continue;

                // Vérifier si c'est du spam
                const lower = text.toLowerCase();
                const isJunk = junkPatterns.some(p => lower.includes(p));

                if (isJunk) {
                    // Essayer de récupérer le vrai texte APRÈS le spam
                    // Souvent le descriptif est après le bloc Genius dans le même conteneur
                    const lines = text.split('\n').filter(l => l.trim().length > 30);
                    const cleanLines = lines.filter(l => {
                        const ll = l.toLowerCase();
                        // Virer toute ligne qui contient un pattern spam OU le mot "genius"
                        if (ll.includes('genius')) return false;
                        if (ll.includes('traitement vip') || ll.includes('celebrity treatment') || ll.includes('tratamiento vip') || ll.includes('trattamento vip')) return false;
                        if (ll.includes('haut de gamme') && ll.includes('profitez')) return false;
                        return !junkPatterns.some(p => ll.includes(p));
                    });
                    if (cleanLines.length > 0) {
                        text = cleanLines.join('\n');
                    } else {
                        continue; // Tout est du spam, passer au bloc suivant
                    }
                }

                // Tronquer si trop long
                if (text.length > 800) {
                    const cut = text.substring(0, 800);
                    const lastDot = cut.lastIndexOf('.');
                    text = lastDot > 400 ? cut.substring(0, lastDot + 1) : cut + '...';
                }

                if (text.length >= 50) {
                    description = text;
                }
            }

            // Fallback : si aucun candidat n'a marché, chercher plus large
            if (!description) {
                const allParagraphs = document.querySelectorAll(
                    '[data-testid="property-description"] div,' +
                    '.hp-description .hp-desc-main-content,' +
                    '#basiclayout .hotel_description_wrapper_exp div'
                );
                for (const p of allParagraphs) {
                    let text = p.innerText.trim();
                    if (text.length < 50) continue;
                    const lower = text.toLowerCase();
                    if (junkPatterns.some(pat => lower.includes(pat))) continue;
                    if (text.length > 800) {
                        const cut = text.substring(0, 800);
                        const lastDot = cut.lastIndexOf('.');
                        text = lastDot > 400 ? cut.substring(0, lastDot + 1) : cut + '...';
                    }
                    description = text;
                    break;
                }
            }

            // === PHOTOS (haute résolution) ===
            const selectors = [
                '.bh-photo-grid img',
                '[data-testid="property-gallery-image-grid"] img',
                'a[data-testid^="hotel-gallery"] img',
                '#photo_wrapper img',
                '.hp-gallery img'
            ];
            for (const sel of selectors) {
                if (photos.length >= photosNeeded) break;
                const imgs = document.querySelectorAll(sel);
                for (const img of imgs) {
                    if (photos.length >= photosNeeded) break;
                    const src = img.src || img.dataset?.src || '';
                    if (src && src.includes('bstatic.com') && !src.includes('square60') && !src.includes('square100')) {
                        let hiRes = src.replace(/\/square\d+\//, '/max1024x768/').replace(/\/max\d+x\d+\//, '/max1024x768/');
                        if (!photos.includes(hiRes)) photos.push(hiRes);
                    }
                }
            }

            // Fallback background-image
            if (photos.length < photosNeeded) {
                const bgEls = document.querySelectorAll('[style*="background-image"]');
                for (const el of bgEls) {
                    if (photos.length >= photosNeeded) break;
                    const match = (el.style.backgroundImage || '').match(/url\(["']?([^"')]+)["']?\)/);
                    if (match && match[1] && match[1].includes('bstatic.com/xdata/images/hotel')) {
                        let u = match[1].replace(/\/square\d+\//, '/max1024x768/').replace(/\/max\d+x\d+\//, '/max1024x768/');
                        if (!photos.includes(u)) photos.push(u);
                    }
                }
            }

            // Dernier fallback
            if (photos.length < photosNeeded) {
                const allImgs = document.querySelectorAll('img[src*="bstatic.com/xdata/images/hotel"]');
                for (const img of allImgs) {
                    if (photos.length >= photosNeeded) break;
                    const src = img.src || '';
                    if (src.includes('square60') || src.includes('square100') || src.includes('square240')) continue;
                    let u = src.replace(/\/max\d+x\d+\//, '/max1024x768/');
                    if (!photos.includes(u)) photos.push(u);
                }
            }

            return { description, photos };
        }, CONFIG.photosPerHotel);

        await page.close();
        return data;

    } catch (e) {
        try { if (page && !page.isClosed()) await page.close(); } catch (ce) {}
        throw e;
    }
}

// ============ CHARGEMENT PLACES (copié du v1) ============
function loadAllPlaces(baseDir, countryFilter = null) {
    const countriesDir = path.join(baseDir, 'countries');
    const places = [];

    if (!fs.existsSync(countriesDir)) {
        log(`Dossier countries introuvable: ${countriesDir}`, 'ERROR');
        return places;
    }

    const countries = fs.readdirSync(countriesDir).filter(d => {
        const isDir = fs.statSync(path.join(countriesDir, d)).isDirectory();
        const matchFilter = !countryFilter || d.toUpperCase() === countryFilter.toUpperCase();
        return isDir && matchFilter;
    });

    // Vérifier si tous les pays sont dans la table haute saison
    const unknownCountries = [];

    for (const cc of countries) {
        const ccUpper = cc.toUpperCase();

        // Alerte pays inconnu
        if (!HIGH_SEASON[ccUpper]) {
            unknownCountries.push(ccUpper);
        }

        const placesFile = path.join(countriesDir, cc, `${cc.toLowerCase()}.places.master-fr.json`);
        if (!fs.existsSync(placesFile)) {
            const altFile = path.join(countriesDir, cc, `${cc.toLowerCase()}_places_master-fr.json`);
            if (!fs.existsSync(altFile)) { log(`Fichier introuvable: ${placesFile}`, 'WARN'); continue; }
        }

        try {
            const data = JSON.parse(fs.readFileSync(placesFile, 'utf8'));
            const placesList = data.places || [];
            for (const p of placesList) {
                if (p.coords && p.coords.length === 2) {
                    places.push({
                        place_id: p.place_id,
                        name: p.name || p.place_id.split('::').pop(),
                        country: ccUpper,
                        coords: p.coords,
                        searchName: (p.name || p.place_id.split('::').pop()).replace(/-/g, ' ')
                    });
                }
            }
            log(`${ccUpper}: ${placesList.length} places chargées`, 'OK');
        } catch (e) {
            log(`Erreur lecture ${placesFile}: ${e.message}`, 'WARN');
        }
    }

    // ALERTE PAYS INCONNUS
    if (unknownCountries.length > 0) {
        log('', 'ALERT');
        log('══════════════════════════════════════════════════', 'ALERT');
        log(`PAYS SANS HAUTE SAISON DÉFINIE : ${unknownCountries.join(', ')}`, 'ALERT');
        log('Ces pays utiliseront des dates à +3 mois par défaut.', 'ALERT');
        log('Ajoute-les dans la table HIGH_SEASON du script !', 'ALERT');
        log('══════════════════════════════════════════════════', 'ALERT');
        log('', 'ALERT');

        // Fallback : +3 mois pour les pays inconnus
        for (const cc of unknownCountries) {
            const now = new Date();
            now.setMonth(now.getMonth() + 3);
            HIGH_SEASON[cc] = now.getMonth() + 1;
        }
    }

    return places;
}

// ============ MAIN ============
async function main() {
    const args = parseArgs();

    if (!args.base) {
        console.log('Usage: node scrape-booking-hotels-v2.js --base=<chemin> [options]');
        console.log('');
        console.log('Passes:');
        console.log('  --pass=search    Recherche + photos + desc 5 LANGUES (tout d\'un coup)');
        console.log('  --pass=desc-en   Rattrape descriptions anglais manquantes');
        console.log('  --pass=desc-es   Rattrape descriptions espagnol manquantes');
        console.log('  --pass=desc-pt   Rattrape descriptions portugais manquantes');
        console.log('  --pass=desc-it   Rattrape descriptions italien manquantes');
        console.log('  --pass=retry     Rattrape tous les echecs (3 tentatives max)');
        console.log('  --pass=all       search + retry');
        console.log('');
        console.log('Lancement complet:');
        console.log('  node scrape-booking-hotels-v2.js --base=... --pass=all');
        console.log('');
        console.log('Si interrompu, relancer la meme commande avec --resume');
        process.exit(1);
    }

    const baseDir = args.base.replace(/"/g, '');
    const countryFilter = args.country || null;
    const resume = args.resume || false;
    const dryRun = args['dry-run'] || false;
    const pass = args.pass || 'search';

    if (args.batch) CONFIG.batchSize = parseInt(args.batch);
    if (args.pause) CONFIG.pauseBetweenBatches = parseInt(args.pause);
    if (args['max-errors']) CONFIG.maxConsecutiveErrors = parseInt(args['max-errors']);

    let passesToRun;
    if (pass === 'all') {
        passesToRun = ['search', 'retry']; // search fait TOUTES les langues d'un coup
    } else {
        passesToRun = [pass];
    }

    const outputFile = path.join(baseDir, 'countries', CONFIG.outputFilename);
    const progressFile = path.join(baseDir, 'countries', 'hotels_v2_progress.json');

    log('='.repeat(60));
    log('SCRAPING BOOKING.COM V2');
    log('='.repeat(60));
    log(`Base: ${baseDir}`);
    log(`Pays: ${countryFilter || 'TOUS'}`);
    log(`Passe(s): ${passesToRun.join(', ')}`);
    log(`Batch: ${CONFIG.batchSize} req, pause ${CONFIG.pauseBetweenBatches}s`);
    log('='.repeat(60));

    // Charger les places
    const allPlaces = loadAllPlaces(baseDir, countryFilter);
    log(`Total: ${allPlaces.length} places`);

    if (dryRun) {
        allPlaces.forEach(p => log(`  ${p.country} - ${p.name} [${p.place_id}]`));
        return;
    }

    // Charger résultats existants
    let results = {};
    let processedIds = new Set();

    if (resume && fs.existsSync(progressFile)) {
        try {
            const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
            results = progress.results || {};
            processedIds = new Set(progress.processed || []);
            const hCount = Object.values(results).reduce((s, e) => s + (e.hotels ? e.hotels.length : 0), 0);
            log(`Reprise: ${processedIds.size} places traitées, ${hCount} hôtels`, 'OK');
        } catch (e) {
            log(`Erreur lecture progression: ${e.message}`, 'WARN');
        }
    } else if (fs.existsSync(outputFile)) {
        try {
            results = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
            log(`Existant chargé: ${Object.keys(results).length} places`, 'OK');
        } catch (e) {}
    }

    // --- Nettoyage des descriptions spam (Genius, VIP, etc.) ---
    const junkWords = [
        'genius', 'traitement vip', 'celebrity treatment', 'tratamiento vip',
        'trattamento vip', 'tratamento vip', 'haut de gamme', 'world-class service',
        'connectez-vous pour voir', 'sign in to see', 'conéctate para ver',
        'accedi per vedere', 'faça login para ver', 'about this property'
    ];
    const descFields = ['description_fr', 'description_en', 'description_es', 'description_pt', 'description_it'];
    let cleanedCount = 0;
    let emptiedCount = 0;

    for (const entry of Object.values(results)) {
        if (!entry.hotels) continue;
        for (let i = 0; i < entry.hotels.length; i++) {
            for (const field of descFields) {
                const desc = entry.hotels[i][field];
                if (!desc) continue;
                const lower = desc.toLowerCase();
                if (!junkWords.some(w => lower.includes(w))) continue;

                const cleanLines = desc.split('\n').filter(l => {
                    const ll = l.toLowerCase().trim();
                    if (ll.length < 20) return false;
                    return !junkWords.some(w => ll.includes(w));
                });

                if (cleanLines.length > 0) {
                    let clean = cleanLines.join('\n').trim();
                    if (clean.length > 800) {
                        const cut = clean.substring(0, 800);
                        const dot = cut.lastIndexOf('.');
                        clean = dot > 400 ? cut.substring(0, dot + 1) : cut + '...';
                    }
                    entry.hotels[i][field] = clean;
                    cleanedCount++;
                } else {
                    entry.hotels[i][field] = null;
                    emptiedCount++;
                }
            }
        }
    }

    if (cleanedCount + emptiedCount > 0) {
        log(`Nettoyage descriptions: ${cleanedCount} nettoyées, ${emptiedCount} vidées (spam)`, 'OK');
        try {
            safeWriteJson(outputFile, results, { keepBackups: 1 });
        } catch (e) {
            log(`Erreur écriture ${outputFile}: ${e.message}`, 'ERROR');
        }
    }
    // --- Fin nettoyage ---

    // Sauvegarde
    function saveProgress() {
        try {
            safeWriteJson(progressFile, {
                processed: Array.from(processedIds),
                results: results,
                lastUpdate: new Date().toISOString()
            });
        } catch (e) {
            log(`Erreur écriture ${progressFile}: ${e.message}`, 'ERROR');
        }
        try {
            safeWriteJson(outputFile, results, { keepBackups: 1 });
        } catch (e) {
            log(`Erreur écriture ${outputFile}: ${e.message}`, 'ERROR');
        }
        const hCount = Object.values(results).reduce((s, e) => s + (e.hotels ? e.hotels.length : 0), 0);
        log(`Sauvegarde: ${processedIds.size} traités, ${hCount} hôtels`, 'SAVE');
    }

    let browser = await launchBrowser();
    let consecutiveErrors = 0;
    let requestCount = 0;
    let batchCount = 0;
    let browserRequestCount = 0;
    let stopped = false;

    // =============================================
    // PASSE "search"
    // =============================================
    if (passesToRun.includes('search') && !stopped) {
        log('\n=== PASSE : Recherche + Photos + Descriptions 5 LANGUES ===\n');

        // Une place est à traiter si :
        // - elle n'a jamais été traitée (pas dans processedIds), OU
        // - elle a été traitée mais sans hôtels trouvés (hotels: []) - on retente
        const placesToProcess = allPlaces.filter(p => {
            if (!processedIds.has(p.place_id)) return true;
            const entry = results[p.place_id];
            if (!entry || !entry.hotels || entry.hotels.length === 0) return true;
            return false;
        });
        const neverDone = placesToProcess.filter(p => !processedIds.has(p.place_id)).length;
        const retryEmpty = placesToProcess.length - neverDone;
        log(`${placesToProcess.length} places à traiter (${neverDone} nouvelles + ${retryEmpty} sans hôtels à retenter)`);

        // Important : retirer du processedIds celles qu'on retente, sinon
        // les compteurs et la sauvegarde seraient incohérents.
        placesToProcess.forEach(p => processedIds.delete(p.place_id));

        for (let i = 0; i < placesToProcess.length; i++) {
            if (stopped) break;
            const place = placesToProcess[i];

            // Redémarrer navigateur périodiquement (comme v1)
            if (browserRequestCount > 0 && browserRequestCount % CONFIG.browserRestartEvery === 0) {
                log('Redémarrage navigateur...', 'PAUSE');
                try { await browser.close(); } catch (e) {}
                await sleep(5);
                browser = await launchBrowser();
            }

            const pct = Math.round(((i + 1) / placesToProcess.length) * 100);
            const remaining = placesToProcess.length - (i + 1);
            log(`\n[${i + 1}/${placesToProcess.length}] ${pct}% - ${place.name} (${place.country}) - reste ${remaining}`);

            // Pause entre lots
            if (batchCount >= CONFIG.batchSize) {
                log(`Pause ${CONFIG.pauseBetweenBatches}s... (${requestCount} requêtes)`, 'PAUSE');
                await sleep(CONFIG.pauseBetweenBatches);
                batchCount = 0;
            }

            let hadConnectionError = false;

            try {
                // 1. Recherche (essayer ≥9, puis ≥8)
                let searchHotels = await scrapeSearchResults(browser, place, 9.0);
                requestCount++; batchCount++; browserRequestCount++;

                if (searchHotels.length === 0) {
                    log(`Aucun hôtel ≥9, tentative ≥8...`, 'WARN');
                    await sleep(CONFIG.pauseBetweenRequests);
                    searchHotels = await scrapeSearchResults(browser, place, 8.0);
                    requestCount++; batchCount++; browserRequestCount++;
                }

                if (searchHotels.length === 0) {
                    log(`${place.name}: aucun hôtel trouvé après ≥9 et ≥8`, 'SKIP');
                    processedIds.add(place.place_id);
                    results[place.place_id] = {
                        place_id: place.place_id, name: place.name, country: place.country,
                        coords: place.coords, hotels: [], scraped_at: new Date().toISOString()
                    };
                    // V3 : auto-exclusion pour ne pas retenter au prochain check
                    addToExcludedList(place);
                } else {
                    // 2. Pour chaque hôtel : photos + descriptions TOUTES LANGUES d'un coup
                    const finalHotels = [];
                    const otherLangs = ['en', 'es', 'pt', 'it'];

                    for (const hotel of searchHotels) {
                        if (stopped) break;

                        const hotelData = {
                            name: hotel.name,
                            score: hotel.score,
                            reviews: 0,
                            price: hotel.price,
                            priceLevel: hotel.priceLevel || 2,
                            bookingUrl: hotel.bookingUrl,
                            imageUrl: hotel.thumbUrl,
                            imageUrl2: hotel.thumbUrl,
                            description_fr: null,
                            description_en: null,
                            description_es: null,
                            description_pt: null,
                            description_it: null
                        };

                        // --- FR : photos + description ---
                        await sleep(CONFIG.pauseBetweenRequests);
                        if (batchCount >= CONFIG.batchSize) {
                            log(`Pause ${CONFIG.pauseBetweenBatches}s...`, 'PAUSE');
                            await sleep(CONFIG.pauseBetweenBatches);
                            batchCount = 0;
                        }

                        try {
                            const pageData = await scrapeHotelPage(browser, hotel.bookingUrl, 'fr');
                            requestCount++; batchCount++; browserRequestCount++;
                            consecutiveErrors = 0;

                            log(`    Photos: ${pageData.photos.length}/${CONFIG.photosPerHotel}`, pageData.photos.length > 0 ? 'PHOTO' : 'WARN');
                            log(`    FR: ${pageData.description ? pageData.description.substring(0, 50) + '...' : 'non trouvée'}`, pageData.description ? 'DESC' : 'WARN');

                            hotelData.imageUrl = pageData.photos[0] || hotel.thumbUrl;
                            hotelData.imageUrl2 = pageData.photos[1] || hotel.thumbUrl;
                            hotelData.description_fr = pageData.description || null;
                        } catch (hotelErr) {
                            log(`    Erreur FR ${hotel.name}: ${hotelErr.message}`, 'ERROR');
                            consecutiveErrors++;
                            if (hotelErr.message.includes('BLOCKED')) {
                                log(`BLOQUÉ ! Pause ${CONFIG.pauseOnError * 2}s...`, 'STOP');
                                await sleep(CONFIG.pauseOnError * 2);
                            }
                        }

                        // --- EN, ES, PT, IT : descriptions seulement ---
                        for (const langKey of otherLangs) {
                            if (stopped) break;
                            const langConfig = CONFIG.languages[langKey];

                            await sleep(CONFIG.pauseBetweenRequests);
                            if (batchCount >= CONFIG.batchSize) {
                                log(`Pause ${CONFIG.pauseBetweenBatches}s...`, 'PAUSE');
                                await sleep(CONFIG.pauseBetweenBatches);
                                batchCount = 0;
                            }

                            try {
                                const pageData = await scrapeHotelPage(browser, hotel.bookingUrl, langConfig.urlSuffix);
                                requestCount++; batchCount++; browserRequestCount++;
                                consecutiveErrors = 0;

                                if (pageData.description) {
                                    hotelData[langConfig.field] = pageData.description;
                                    log(`    ${langKey.toUpperCase()}: ${pageData.description.substring(0, 40)}...`, 'DESC');
                                } else {
                                    log(`    ${langKey.toUpperCase()}: non trouvée`, 'WARN');
                                }
                            } catch (langErr) {
                                log(`    Erreur ${langKey.toUpperCase()} ${hotel.name}: ${langErr.message}`, 'ERROR');
                                consecutiveErrors++;
                                if (langErr.message.includes('BLOCKED')) {
                                    log(`BLOQUÉ ! Pause ${CONFIG.pauseOnError * 2}s...`, 'STOP');
                                    await sleep(CONFIG.pauseOnError * 2);
                                } else if (langErr.message.includes('closed') || langErr.message.includes('detached')) {
                                    try { await browser.close(); } catch (ce) {}
                                    await sleep(10);
                                    browser = await launchBrowser();
                                }
                            }

                            if (consecutiveErrors >= CONFIG.maxConsecutiveErrors) {
                                stopped = true; break;
                            }
                        }

                        finalHotels.push(hotelData);
                    }

                    results[place.place_id] = {
                        place_id: place.place_id, name: place.name, country: place.country,
                        coords: place.coords, hotels: finalHotels, scraped_at: new Date().toISOString()
                    };
                    processedIds.add(place.place_id);
                    log(`${place.name}: ${finalHotels.length} hôtels enregistrés`, 'HOTEL');
                }

                consecutiveErrors = 0;

            } catch (scrapeErr) {
                log(`Erreur sur ${place.name}: ${scrapeErr.message}`, 'ERROR');
                consecutiveErrors++;

                if (scrapeErr.message.includes('closed') || scrapeErr.message.includes('detached')) {
                    hadConnectionError = true;
                    log('Redémarrage navigateur après crash...', 'WARN');
                    try { await browser.close(); } catch (e) {}
                    await sleep(10);
                    browser = await launchBrowser();
                } else if (scrapeErr.message.includes('BLOCKED')) {
                    log(`BLOQUÉ ! Pause ${CONFIG.pauseOnError * 2}s...`, 'STOP');
                    await sleep(CONFIG.pauseOnError * 2);
                } else {
                    await sleep(CONFIG.pauseOnError / 2);
                }

                if (!hadConnectionError) processedIds.add(place.place_id);
            }

            // Arrêt de sécurité
            if (consecutiveErrors >= CONFIG.maxConsecutiveErrors) {
                log(`${CONFIG.maxConsecutiveErrors} erreurs d'affilée ! Arrêt.`, 'STOP');
                stopped = true;
            }

            // Sauvegarde périodique
            if (i % 5 === 0) saveProgress();

            await sleep(CONFIG.pauseBetweenRequests);
        }

        saveProgress();
    }

    // =============================================
    // PASSES "desc-XX"
    // =============================================
    const descPasses = passesToRun.filter(p => p.startsWith('desc-'));
    for (const descPass of descPasses) {
        if (stopped) break;
        const langKey = descPass.replace('desc-', '');
        const langConfig = CONFIG.languages[langKey];
        if (!langConfig) { log(`Langue inconnue: ${langKey}`, 'ERROR'); continue; }

        log(`\n=== DESCRIPTIONS ${langKey.toUpperCase()} ===\n`);

        // Relancer le navigateur dans la langue de la passe
        log(`Changement langue navigateur → ${langKey.toUpperCase()}`, 'LANG');
        try { await browser.close(); } catch (e) {}
        await sleep(3);
        browser = await launchBrowser(langConfig.browserLang);
        browserRequestCount = 0;

        const placeKeys = Object.keys(results)
            .filter(k => !countryFilter || k.startsWith(countryFilter.toUpperCase() + '::'));

        let processed = 0;
        batchCount = 0;

        for (const placeKey of placeKeys) {
            if (stopped) break;
            const entry = results[placeKey];
            if (!entry.hotels || entry.hotels.length === 0) continue;
            const needsDesc = entry.hotels.some(h => !h[langConfig.field]);
            if (!needsDesc) continue;

            // Redémarrer navigateur périodiquement
            if (browserRequestCount > 0 && browserRequestCount % CONFIG.browserRestartEvery === 0) {
                log('Redémarrage navigateur...', 'PAUSE');
                try { await browser.close(); } catch (e) {}
                await sleep(5);
                browser = await launchBrowser(langConfig.browserLang);
            }

            log(`[${processed + 1}] ${entry.name} (${entry.country}) - ${langKey.toUpperCase()}`);

            for (let j = 0; j < entry.hotels.length; j++) {
                if (stopped) break;
                const hotel = entry.hotels[j];
                if (hotel[langConfig.field]) continue;

                await sleep(CONFIG.pauseBetweenRequests);
                if (batchCount >= CONFIG.batchSize) {
                    log(`Pause ${CONFIG.pauseBetweenBatches}s...`, 'PAUSE');
                    await sleep(CONFIG.pauseBetweenBatches);
                    batchCount = 0;
                }

                try {
                    const pageData = await scrapeHotelPage(browser, hotel.bookingUrl, langConfig.urlSuffix);
                    requestCount++; batchCount++; browserRequestCount++;
                    consecutiveErrors = 0;

                    if (pageData.description) {
                        entry.hotels[j][langConfig.field] = pageData.description;
                        log(`    ${langKey.toUpperCase()}: ${pageData.description.substring(0, 50)}...`, 'DESC');
                    } else {
                        log(`    ${langKey.toUpperCase()}: non trouvée`, 'WARN');
                    }
                } catch (e) {
                    log(`    Erreur ${langKey} ${hotel.name}: ${e.message}`, 'ERROR');
                    consecutiveErrors++;
                    if (e.message.includes('BLOCKED')) {
                        log(`BLOQUÉ ! Pause ${CONFIG.pauseOnError * 2}s...`, 'STOP');
                        await sleep(CONFIG.pauseOnError * 2);
                    } else if (e.message.includes('closed') || e.message.includes('detached')) {
                        try { await browser.close(); } catch (ce) {}
                        await sleep(10);
                        browser = await launchBrowser(langConfig.browserLang);
                    }
                }

                if (consecutiveErrors >= CONFIG.maxConsecutiveErrors) {
                    stopped = true; break;
                }
            }

            processed++;
            if (processed % 5 === 0) saveProgress();
        }

        saveProgress();
        log(`${langKey.toUpperCase()}: ${processed} places traitées`, 'OK');
    }

    // =============================================
    // PASSE "retry" : rattraper les trous (photos manquantes, descriptions manquantes)
    // Max 3 tentatives par hôtel/champ, après quoi on abandonne
    // =============================================
    if (passesToRun.includes('retry') && !stopped) {
        log('\n=== PASSE RETRY : Rattrapage des échecs ===\n');

        // Initialiser le compteur de retries si pas déjà fait
        // On stocke ça dans le progress file
        let retryCounts = {};
        if (fs.existsSync(progressFile)) {
            try {
                const prog = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
                retryCounts = prog.retryCounts || {};
            } catch (e) {}
        }

        // Identifier ce qui manque
        const allLangs = Object.values(CONFIG.languages);
        const placeKeys = Object.keys(results)
            .filter(k => !countryFilter || k.startsWith(countryFilter.toUpperCase() + '::'));

        let retryTotal = 0;
        let retrySuccess = 0;
        let retrySkipped = 0;

        // Compter les trous
        let missingPhotos = 0;
        let missingDescs = 0;
        for (const pk of placeKeys) {
            const entry = results[pk];
            if (!entry.hotels) continue;
            for (const h of entry.hotels) {
                if (!h.imageUrl || h.imageUrl.includes('square240')) missingPhotos++;
                for (const lang of allLangs) {
                    if (!h[lang.field]) missingDescs++;
                }
            }
        }
        log(`Trous à combler: ${missingPhotos} photos + ${missingDescs} descriptions`);

        if (missingPhotos + missingDescs === 0) {
            log('Rien à rattraper, tout est complet !', 'OK');
        } else {
            // Relancer en FR pour les photos, puis chaque langue pour les desc
            const retryLangs = ['fr', 'en', 'es', 'pt', 'it'];

            for (const langKey of retryLangs) {
                if (stopped) break;
                const langConfig = CONFIG.languages[langKey];

                // Pré-comptage : combien de retry à faire pour cette langue
                let langTodo = 0;
                for (const pk of placeKeys) {
                    const e = results[pk];
                    if (!e.hotels) continue;
                    for (const h of e.hotels) {
                        let needs = false;
                        if (langKey === 'fr') {
                            needs = (!h.imageUrl || h.imageUrl.includes('square240') || !h.description_fr);
                        } else {
                            needs = !h[langConfig.field];
                        }
                        if (!needs) continue;
                        if (!h.bookingUrl) continue;
                        const rk = `${pk}::${h.name}::${langKey}`;
                        if ((retryCounts[rk] || 0) >= CONFIG.maxRetries) continue;
                        langTodo++;
                    }
                }
                log(`Langue ${langKey.toUpperCase()}: ${langTodo} retry à faire`);

                // Relancer navigateur dans la bonne langue
                try { await browser.close(); } catch (e) {}
                await sleep(3);
                browser = await launchBrowser(langConfig.browserLang);
                browserRequestCount = 0;
                batchCount = 0;

                let langRetries = 0;
                let langDone = 0;

                for (const placeKey of placeKeys) {
                    if (stopped) break;
                    const entry = results[placeKey];
                    if (!entry.hotels || entry.hotels.length === 0) continue;

                    for (let j = 0; j < entry.hotels.length; j++) {
                        if (stopped) break;
                        const hotel = entry.hotels[j];
                        const hotelKey = `${placeKey}::${hotel.name}`;

                        // Déterminer ce qui manque pour cette langue
                        let needsWork = false;

                        if (langKey === 'fr') {
                            // Photos manquantes ou desc FR manquante
                            needsWork = (!hotel.imageUrl || hotel.imageUrl.includes('square240') || !hotel.description_fr);
                        } else {
                            needsWork = !hotel[langConfig.field];
                        }

                        if (!needsWork) continue;

                        // Skip si pas d'URL Booking (hôtel sans source scrappable)
                        if (!hotel.bookingUrl) {
                            retrySkipped++;
                            continue;
                        }

                        // Vérifier le compteur de retries
                        const retryKey = `${hotelKey}::${langKey}`;
                        retryCounts[retryKey] = (retryCounts[retryKey] || 0);
                        if (retryCounts[retryKey] >= CONFIG.maxRetries) {
                            // Hôtel défaillant : retiré définitivement de la liste
                            log(`  🗑️  BLACKLIST hôtel ${hotel.name} (${langKey.toUpperCase()} échoué ${CONFIG.maxRetries}x)`, 'WARN');
                            entry.hotels.splice(j, 1);
                            j--; // Réajuster l'index après splice
                            retrySkipped++;
                            continue;
                        }

                        // Rate limiting
                        await sleep(CONFIG.pauseBetweenRequests);
                        if (batchCount >= CONFIG.batchSize) {
                            log(`Pause ${CONFIG.pauseBetweenBatches}s...`, 'PAUSE');
                            await sleep(CONFIG.pauseBetweenBatches);
                            batchCount = 0;
                        }

                        // Redémarrer navigateur périodiquement
                        if (browserRequestCount > 0 && browserRequestCount % CONFIG.browserRestartEvery === 0) {
                            log('Redémarrage navigateur...', 'PAUSE');
                            try { await browser.close(); } catch (e) {}
                            await sleep(5);
                            browser = await launchBrowser(langConfig.browserLang);
                        }

                        retryTotal++;
                        langDone++;
                        retryCounts[retryKey]++;
                        const langPct = langTodo > 0 ? Math.round((langDone / langTodo) * 100) : 0;
                        log(`  RETRY [${langDone}/${langTodo}] ${langPct}% [${retryCounts[retryKey]}/${CONFIG.maxRetries}] ${hotel.name} - ${langKey.toUpperCase()}`, 'RETRY');

                        try {
                            const pageData = await scrapeHotelPage(browser, hotel.bookingUrl, langConfig.urlSuffix);
                            requestCount++; batchCount++; browserRequestCount++;
                            consecutiveErrors = 0;

                            // Mettre à jour ce qui manquait
                            if (langKey === 'fr') {
                                if (pageData.photos.length > 0 && (!hotel.imageUrl || hotel.imageUrl.includes('square240'))) {
                                    entry.hotels[j].imageUrl = pageData.photos[0];
                                    if (pageData.photos[1]) entry.hotels[j].imageUrl2 = pageData.photos[1];
                                }
                                if (pageData.description && !hotel.description_fr) {
                                    entry.hotels[j].description_fr = pageData.description;
                                }
                            } else {
                                if (pageData.description && !hotel[langConfig.field]) {
                                    entry.hotels[j][langConfig.field] = pageData.description;
                                }
                            }

                            retrySuccess++;
                            log(`    OK`, 'OK');

                        } catch (e) {
                            consecutiveErrors++;
                            log(`    Échec: ${e.message}`, 'ERROR');

                            if (e.message.includes('BLOCKED')) {
                                log(`BLOQUÉ ! Pause ${CONFIG.pauseOnError * 2}s...`, 'STOP');
                                await sleep(CONFIG.pauseOnError * 2);
                            } else if (e.message.includes('closed') || e.message.includes('detached')) {
                                try { await browser.close(); } catch (ce) {}
                                await sleep(10);
                                browser = await launchBrowser(langConfig.browserLang);
                            }

                            if (consecutiveErrors >= CONFIG.maxConsecutiveErrors) {
                                stopped = true;
                            }
                        }

                        langRetries++;

                        // Sauvegarde tous les 5 retry
                        if (langRetries % 5 === 0) {
                            saveProgress();
                            try {
                                const prog = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
                                prog.retryCounts = retryCounts;
                                safeWriteJson(progressFile, prog);
                            } catch (e) {}
                        }
                    }
                }

                if (langRetries > 0) {
                    saveProgress();
                    // Sauvegarder aussi les retryCounts
                    try {
                        const prog = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
                        prog.retryCounts = retryCounts;
                        safeWriteJson(progressFile, prog);
                    } catch (e) {}
                }

                log(`Retry ${langKey.toUpperCase()}: ${langRetries} tentatives`, 'OK');
            }

            log(`\nRetry terminé: ${retryTotal} tentatives, ${retrySuccess} succès, ${retrySkipped} abandonnés (>${CONFIG.maxRetries} essais)`);
            saveProgress();
        }
    }

    // Fermer
    try { await browser.close(); } catch (e) {}

    // Résumé
    const stats = { places: Object.keys(results).length, hotels: 0, photosHD: 0,
        desc_fr: 0, desc_en: 0, desc_es: 0, desc_pt: 0, desc_it: 0 };
    Object.values(results).forEach(e => {
        if (!e.hotels) return;
        stats.hotels += e.hotels.length;
        e.hotels.forEach(h => {
            if (h.imageUrl && !h.imageUrl.includes('square240')) stats.photosHD++;
            if (h.description_fr) stats.desc_fr++;
            if (h.description_en) stats.desc_en++;
            if (h.description_es) stats.desc_es++;
            if (h.description_pt) stats.desc_pt++;
            if (h.description_it) stats.desc_it++;
        });
    });

    log('\n' + '='.repeat(60));
    log('RÉSUMÉ');
    log('='.repeat(60));
    log(`Places: ${stats.places} | Hôtels: ${stats.hotels} | Photos HD: ${stats.photosHD}`);
    log(`FR: ${stats.desc_fr} | EN: ${stats.desc_en} | ES: ${stats.desc_es} | PT: ${stats.desc_pt} | IT: ${stats.desc_it}`);
    log(`Requêtes: ${requestCount}`);
    log('='.repeat(60));

    if (stopped) log('\nInterrompu. Relance avec --resume.');

    const missing = [];
    if (stats.desc_en < stats.hotels) missing.push('desc-en');
    if (stats.desc_es < stats.hotels) missing.push('desc-es');
    if (stats.desc_pt < stats.hotels) missing.push('desc-pt');
    if (stats.desc_it < stats.hotels) missing.push('desc-it');
    if (missing.length > 0) {
        log('\nPasses restantes:');
        missing.forEach(m => log(`  node scrape-booking-hotels-v2.js --base=${baseDir} --pass=${m} --resume`));
    }
}

main().catch(e => {
    log(`Erreur fatale: ${e.message}`, 'ERROR');
    console.error(e);
    process.exit(1);
});
