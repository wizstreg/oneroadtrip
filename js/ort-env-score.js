/**
 * ort-env-score.js — Module environnemental OneRoadTrip
 * 
 * Fichier UNIQUE à inclure dans toutes les pages (detail, simple, mobile, static, generator).
 * S'auto-injecte à côté du titre de l'itinéraire.
 * 
 * Fonctionnalités :
 * - Calcul CO2/jour via API route (/.netlify/functions/route) avec cache Firestore
 * - Profil territorial (ville ↔ nature) depuis places master
 * - Badge carbone coloré (A+ vert → E rouge) cliquable → panneau nearbies
 * - Curseur ville/nature animé
 * - Responsive (desktop, tablette, mobile)
 * 
 * Collections Firestore :
 *   route_cache/{coords_key}     → { km, minutes, source, cached_at }
 *   env_scores/{sanitized_itin}  → { grade, co2_per_day, km_total, ... }
 * 
 * Usage : <script src="js/ort-env-score.js"></script>
 *         (aucune autre modification nécessaire)
 * 
 * Auteur: OneRoadTrip
 */

(function(window, document) {
    'use strict';

    // ══════════════════════════════════════════
    // I18N - clés ajoutées dans init() pour s'assurer que ORT_I18N est chargé
    // ══════════════════════════════════════════
    function injectI18nKeys() {
        if (!window.ORT_I18N) return;
        var i18n = window.ORT_I18N;
        if (i18n._envKeysAdded) return;
        i18n.envCar = { fr: 'VOI', en: 'CAR', es: 'COC', it: 'AUT', pt: 'CAR', ar: 'سيارة' };
        i18n.envTransit = { fr: 'TC', en: 'TC', es: 'TP', it: 'TP', pt: 'TP', ar: 'نقل' };
        i18n.envCarTitle = { fr: 'Empreinte voiture', en: 'Car footprint', es: 'Huella coche', it: 'Impronta auto', pt: 'Pegada carro', ar: 'البصمة الكربونية للسيارة' };
        i18n.envTransitTitle = { fr: 'Empreinte transports en commun', en: 'Public transport footprint', es: 'Huella transporte público', it: 'Impronta trasporto pubblico', pt: 'Pegada transporte público', ar: 'البصمة الكربونية للنقل العام' };
        i18n.envDistance = { fr: 'Distance', en: 'Distance', es: 'Distancia', it: 'Distanza', pt: 'Distância', ar: 'المسافة' };
        i18n.envDays = { fr: 'jours', en: 'days', es: 'días', it: 'giorni', pt: 'dias', ar: 'أيام' };
        i18n.envCo2day = { fr: 'CO₂/jour', en: 'CO₂/day', es: 'CO₂/día', it: 'CO₂/giorno', pt: 'CO₂/dia', ar: 'CO₂/يوم' };
        i18n.envTotal = { fr: 'Total', en: 'Total', es: 'Total', it: 'Totale', pt: 'Total', ar: 'المجموع' };
        i18n.envGrade = { fr: 'Grade', en: 'Grade', es: 'Grado', it: 'Grado', pt: 'Grau', ar: 'الدرجة' };
        i18n.envClickAlts = { fr: 'Cliquez pour voir les alternatives', en: 'Click to see alternatives', es: 'Haga clic para ver alternativas', it: 'Clicca per vedere le alternative', pt: 'Clique para ver alternativas', ar: 'انقر لرؤية البدائل' };
        i18n.envUrban = { fr: 'Urbain', en: 'Urban', es: 'Urbano', it: 'Urbano', pt: 'Urbano', ar: 'حضري' };
        i18n.envMixed = { fr: 'Mixte', en: 'Mixed', es: 'Mixto', it: 'Misto', pt: 'Misto', ar: 'مختلط' };
        i18n.envNature = { fr: 'Nature', en: 'Nature', es: 'Naturaleza', it: 'Natura', pt: 'Natureza', ar: 'طبيعة' };
        i18n.envUrbanPct = { fr: 'urbain', en: 'urban', es: 'urbano', it: 'urbano', pt: 'urbano', ar: 'حضري' };
        i18n.envNaturePct = { fr: 'nature/rural', en: 'nature/rural', es: 'naturaleza/rural', it: 'natura/rurale', pt: 'natureza/rural', ar: 'طبيعة/ريفي' };
        i18n.envExcellent = { fr: 'Excellent', en: 'Excellent', es: 'Excelente', it: 'Eccellente', pt: 'Excelente', ar: 'ممتاز' };
        i18n.envVeryGood = { fr: 'Très bon', en: 'Very good', es: 'Muy bueno', it: 'Molto buono', pt: 'Muito bom', ar: 'جيد جداً' };
        i18n.envGood = { fr: 'Bon', en: 'Good', es: 'Bueno', it: 'Buono', pt: 'Bom', ar: 'جيد' };
        i18n.envAverage = { fr: 'Moyen', en: 'Average', es: 'Medio', it: 'Medio', pt: 'Médio', ar: 'متوسط' };
        i18n.envHigh = { fr: 'Élevé', en: 'High', es: 'Alto', it: 'Alto', pt: 'Alto', ar: 'مرتفع' };
        i18n.envVeryHigh = { fr: 'Très élevé', en: 'Very high', es: 'Muy alto', it: 'Molto alto', pt: 'Muito alto', ar: 'مرتفع جداً' };
        i18n.envLoading = { fr: 'Chargement des scores...', en: 'Loading scores...', es: 'Cargando puntuaciones...', it: 'Caricamento punteggi...', pt: 'Carregando pontuações...', ar: 'تحميل النتائج...' };
        i18n.envNoNearby = { fr: 'Aucun itinéraire proche trouvé.', en: 'No nearby itineraries found.', es: 'No se encontraron itinerarios cercanos.', it: 'Nessun itinerario vicino trovato.', pt: 'Nenhum itinerário próximo encontrado.', ar: 'لم يتم العثور على مسارات قريبة.' };
        i18n.envNotCalculated = { fr: 'pas encore calculé', en: 'not yet calculated', es: 'aún no calculado', it: 'non ancora calcolato', pt: 'ainda não calculado', ar: 'لم يُحسب بعد' };
        i18n.envNearbyTitle = { fr: 'Alternatives moins carbonées', en: 'Lower carbon alternatives', es: 'Alternativas menos carbonadas', it: 'Alternative meno inquinanti', pt: 'Alternativas menos carbonadas', ar: 'بدائل أقل كربوناً' };
        i18n.envNearbyIntro = { fr: 'Itinéraires proches avec leur impact carbone :', en: 'Nearby itineraries with their carbon impact:', es: 'Itinerarios cercanos con su impacto de carbono:', it: 'Itinerari vicini con il loro impatto di carbonio:', pt: 'Itinerários próximos com seu impacto de carbono:', ar: 'مسارات قريبة مع تأثيرها الكربوني:' };
        i18n._envKeysAdded = true;
    }
    var t = window.t || function(k) { return k; };

    // ══════════════════════════════════════════
    // CONFIG
    // ══════════════════════════════════════════
    const ROUTE_API = '/.netlify/functions/route';
    const CO2_CAR = 0.19;       // kg CO2/km voiture
    const CO2_TRANSIT = 0.04;   // kg CO2/km transport en commun
    const CACHE_VERSION = 3; // v3: ajout 'city' dans URBAN_TYPES
    const COORD_PRECISION = 3;  // Arrondi coords pour clé cache

    // Seuils grade carbone (kg CO2 voiture PAR JOUR)
    const GRADES = [
        { max: 5,   grade: 'A+', color: '#059669', labelKey: 'envExcellent' },
        { max: 10,  grade: 'A',  color: '#10b981', labelKey: 'envVeryGood' },
        { max: 20,  grade: 'B',  color: '#f59e0b', labelKey: 'envGood' },
        { max: 35,  grade: 'C',  color: '#f97316', labelKey: 'envAverage' },
        { max: 55,  grade: 'D',  color: '#ef4444', labelKey: 'envHigh' },
        { max: Infinity, grade: 'E', color: '#991b1b', labelKey: 'envVeryHigh' }
    ];

    // place_type → catégorie
    const URBAN_TYPES = ['capital', 'metropolis', 'large_city', 'medium_city', 'city', 'suburb'];
    const RURAL_TYPES = ['small_city', 'village', 'site', 'nature', 'beach', 'island'];

    // ══════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════

    /** Arrondir une coord à N décimales */
    function roundCoord(n) {
        return Math.round(n * Math.pow(10, COORD_PRECISION)) / Math.pow(10, COORD_PRECISION);
    }

    /** Clé cache route : "lat1,lon1__lat2,lon2" */
    function routeCacheKey(lat1, lon1, lat2, lon2) {
        return `${roundCoord(lat1)},${roundCoord(lon1)}__${roundCoord(lat2)},${roundCoord(lon2)}`;
    }

    /** sanitizeDocId identique au backend (:: → __) */
    function sanitizeDocId(id) {
        if (!id) return '';
        return id.replace(/::/g, '__').replace(/[\/\\]/g, '_').substring(0, 200);
    }

    /** Hash des étapes — change quand l'user modifie nuits ET/OU lieux */
    function nightsHash(steps) {
        if (!steps || !Array.isArray(steps)) return '';
        // Inclure place_id + nights pour détecter ajout/suppression/réordonnancement
        var sig = steps.map(function(s) {
            return (s.place_id || s.name || '') + ':' + (s.nights || 0);
        }).join(',');
        var h = 0;
        for (var i = 0; i < sig.length; i++) {
            h = ((h << 5) - h + sig.charCodeAt(i)) | 0;
        }
        return (h >>> 0).toString(36);
    }

    /** Clé cache env-score : catalogId pour le catalogue, catalogId+hash pour les modifiés */
    function getScoreCacheKey() {
        var catalogId = getCatalogId();
        if (!catalogId) return null;
        var st = window.state || window._ortState || {};
        var steps = st.steps || [];
        if (steps.length === 0) return sanitizeDocId(catalogId);

        // Calculer le hash du trajet actuel
        var currentHash = nightsHash(steps);

        // Toujours vérifier si le trajet a été modifié par rapport au catalogue original
        // même sans tripId (user en session non sauvegardée)
        var originalSteps = st._originalSteps || st._catalogSteps || null;
        var isModified = false;

        if (originalSteps && originalSteps.length > 0) {
            // Comparer avec les steps originaux du catalogue
            isModified = (nightsHash(originalSteps) !== currentHash);
        } else {
            // Fallback : si tripId personnel, c'est modifié par définition
            var tripId = st.tripId || '';
            isModified = !!(tripId && !tripId.startsWith('catalog::') && tripId.indexOf('::') === -1);
        }

        if (isModified) {
            return sanitizeDocId(catalogId) + '_u' + currentHash;
        }
        return sanitizeDocId(catalogId);
    }

    /** Récupérer le catalogId (itin_id d'origine) */
    function getCatalogId() {
        var st = window.state || window._ortState || {};
        // Fallbacks dans l'ordre de priorité
        var id = st._originalItinId || st.itinId || st.originalItinId || null;
        if (!id) {
            var params = new URLSearchParams(window.location.search);
            id = params.get('itin') || params.get('itinId') || null;
        }
        if (!id && st._tripId && st._tripId.indexOf('::') > -1) id = st._tripId;
        if (!id && st.tripId && st.tripId.indexOf('::') > -1) id = st.tripId;
        if (!id) id = sessionStorage.getItem('ort_catalog_source') || null;
        return id;
    }

    /** Récupérer le Firestore db */
    function getDb() {
        try {
            return firebase.firestore();
        } catch (e) {
            console.warn('[ENV] Firestore non disponible');
            return null;
        }
    }

    /** Grade depuis CO2/jour */
    function getGrade(co2PerDay) {
        for (var g of GRADES) {
            if (co2PerDay <= g.max) return { grade: g.grade, color: g.color, label: t(g.labelKey) };
        }
        var last = GRADES[GRADES.length - 1];
        return { grade: last.grade, color: last.color, label: t(last.labelKey) };
    }

    // ══════════════════════════════════════════
    // CACHE FIRESTORE : ROUTES
    // ══════════════════════════════════════════

    /** Chercher une route en cache Firestore */
    async function getCachedRoute(key) {
        var db = getDb();
        if (!db) return null;
        try {
            var doc = await db.collection('route_cache').doc(key).get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            return null;
        }
    }

    /** Sauver une route en cache Firestore */
    async function setCachedRoute(key, data) {
        var db = getDb();
        if (!db) return;
        try {
            await db.collection('route_cache').doc(key).set({
                km: data.km,
                minutes: data.minutes,
                source: data.source || 'api',
                cached_at: new Date().toISOString()
            });
        } catch (e) {
            console.warn('[ENV] Cache route write error:', e.message);
        }
    }

    // ══════════════════════════════════════════
    // CACHE FIRESTORE : SCORES ENV
    // ══════════════════════════════════════════

    /** Charger score env depuis cache */
    async function getCachedScore(itinId) {
        var db = getDb();
        if (!db) return null;
        var key = sanitizeDocId(itinId);
        if (!key) return null;
        try {
            var doc = await db.collection('env_scores').doc(key).get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            return null;
        }
    }

    /** Sauver score env en cache */
    async function setCachedScore(itinId, data) {
        var db = getDb();
        if (!db) return;
        var key = sanitizeDocId(itinId);
        if (!key) return;
        try {
            await db.collection('env_scores').doc(key).set(data);
        } catch (e) {
            console.warn('[ENV] Cache score write error:', e.message);
        }
    }

    /** Charger score d'un nearby (pour le panneau) */
    async function getNearbyScore(nearbyItinId) {
        return getCachedScore(nearbyItinId);
    }

    // ══════════════════════════════════════════
    // CALCUL DISTANCE VIA API ROUTE
    // ══════════════════════════════════════════

    /**
     * Calcule la distance entre deux points GPS
     * 1. Check cache Firestore
     * 2. Sinon appel API route
     * 3. Sauvegarde en cache
     * @returns {Promise<{km: number, minutes: number}>}
     */
    async function getRouteDistance(lat1, lon1, lat2, lon2) {
        var key = routeCacheKey(lat1, lon1, lat2, lon2);

        // 1. Cache Firestore
        var cached = await getCachedRoute(key);
        if (cached && cached.km > 0) {
            return { km: cached.km, minutes: cached.minutes, source: 'cache' };
        }

        // 2. API route (format: start=lon,lat&end=lon,lat)
        try {
            var url = ROUTE_API + '?mode=driving&start=' + lon1 + ',' + lat1 + '&end=' + lon2 + ',' + lat2;
            var resp = await fetch(url);
            if (resp.ok) {
                var data = await resp.json();
                if (data.ok && data.km > 0) {
                    await setCachedRoute(key, { km: data.km, minutes: data.minutes, source: 'api' });
                    return { km: data.km, minutes: data.minutes, source: 'api' };
                }
            }
        } catch (e) {
            console.warn('[ENV] Route API error:', e.message);
        }

        // 3. Fallback haversine × 1.3 (PAS caché — pas fiable)
        var R = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        var km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3;
        var minutes = (km / 65) * 60;
        // PAS de setCachedRoute ici — haversine est imprécis
        return { km: Math.round(km), minutes: Math.round(minutes), source: 'haversine' };
    }

    // ══════════════════════════════════════════
    // CALCUL SCORE ENVIRONNEMENTAL
    // ══════════════════════════════════════════

    /**
     * Calcule le score complet d'un itinéraire
     * @param {Array} daysPlan - Le days_plan de l'itinéraire
     * @param {Object} placesMap - Map place_id → {place_type, name}
     * @returns {Promise<Object>} Score complet
     */
    async function calculateScore(daysPlan, placesMap) {
        if (!daysPlan || daysPlan.length === 0) return null;

        // ── Distance totale via API route ──
        var totalKm = 0;
        var legCount = 0;
        var apiCalls = 0;
        var cachHits = 0;

        for (var i = 0; i < daysPlan.length - 1; i++) {
            var c1 = daysPlan[i].night && daysPlan[i].night.coords;
            var c2 = daysPlan[i + 1].night && daysPlan[i + 1].night.coords;
            if (c1 && c2 && c1.length >= 2 && c2.length >= 2) {
                // Skip si même coordonnées (même ville)
                if (Math.abs(c1[0] - c2[0]) < 0.001 && Math.abs(c1[1] - c2[1]) < 0.001) continue;

                var route = await getRouteDistance(c1[0], c1[1], c2[0], c2[1]);
                totalKm += route.km;
                legCount++;
                if (route.source === 'cache') cachHits++;
                else apiCalls++;
            }
        }

        // ── Nombre de jours (basé sur les nuits réelles, pas suggested_days) ──
        var totalNightsCount = 0;
        for (var d of daysPlan) {
            totalNightsCount += (d.nights || 1);
        }
        var totalDays = totalNightsCount > 0 ? totalNightsCount + 1 : daysPlan.length;

        // ── CO2 par jour ──
        var co2CarTotal = totalKm * CO2_CAR;
        var co2TransitTotal = totalKm * CO2_TRANSIT;
        var co2CarPerDay = co2CarTotal / totalDays;
        var co2TransitPerDay = co2TransitTotal / totalDays;
        var gradeInfo = getGrade(co2CarPerDay);

        // ── Profil territorial ──
        var urbanNights = 0;
        var ruralNights = 0;
        var unknownNights = 0;

        for (var day of daysPlan) {
            var pid = day.night && day.night.place_id || '';
            var nights = day.nights || 1;
            var pType = null;

            // Chercher dans placesMap
            if (placesMap && placesMap[pid]) {
                pType = placesMap[pid].place_type;
            }
            // Fallback dans le day
            if (!pType) pType = day.place_type || day.city_size;

            console.log('[ENV] Place:', pid, '→ type:', pType, '(' + nights + ' nuits)');

            if (pType && URBAN_TYPES.indexOf(pType) > -1) {
                urbanNights += nights;
            } else if (pType && RURAL_TYPES.indexOf(pType) > -1) {
                ruralNights += nights;
            } else {
                unknownNights += nights;
            }
        }

        var totalNights = urbanNights + ruralNights + unknownNights;
        var urbanRatio = totalNights > 0 ? Math.round((urbanNights / totalNights) * 100) : 50;

        return {
            km_total: Math.round(totalKm),
            days_count: Math.round(totalDays * 10) / 10,
            co2_car_total: Math.round(co2CarTotal * 10) / 10,
            co2_transit_total: Math.round(co2TransitTotal * 10) / 10,
            co2_car_per_day: Math.round(co2CarPerDay * 10) / 10,
            co2_transit_per_day: Math.round(co2TransitPerDay * 10) / 10,
            grade: gradeInfo.grade,
            grade_color: gradeInfo.color,
            grade_label: gradeInfo.label,
            urban_nights: Math.round(urbanNights * 10) / 10,
            rural_nights: Math.round(ruralNights * 10) / 10,
            urban_ratio: urbanRatio,
            legs: legCount,
            api_calls: apiCalls,
            cache_hits: cachHits,
            cache_version: CACHE_VERSION,
            calculated_at: new Date().toISOString()
        };
    }

    // ══════════════════════════════════════════
    // RENDU HTML + CSS
    // ══════════════════════════════════════════

    function injectStyles() {
        if (document.getElementById('ort-env-styles')) return;
        var style = document.createElement('style');
        style.id = 'ort-env-styles';
        style.textContent = `
/* ═══ ENV SCORE BADGES ═══ */
.ort-env-wrap {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-left: 12px;
    vertical-align: middle;
    flex-wrap: wrap;
    overflow: visible !important;
}

/* Force overflow visible sur les parents du bandeau */
#rtTitle, #tripTitle, #itinTitle, .itin-title, .trip-title,
#stageHdr, [data-env-insert] {
    overflow: visible !important;
}

/* ── Badge carbone (cliquable) ── */
.ort-env-carbon {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 14px;
    color: #fff;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    position: relative;
    user-select: none;
    white-space: nowrap;
    letter-spacing: 0.3px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    overflow: visible !important;
}
.ort-env-carbon:hover {
    transform: scale(1.08);
    box-shadow: 0 3px 10px rgba(0,0,0,0.25);
}
.ort-env-carbon:active { transform: scale(0.97); }
.ort-env-carbon .ort-env-grade { font-size: 16px; font-weight: 900; }
.ort-env-carbon .ort-env-mode { font-size: 11px; font-weight: 500; opacity: 0.9; }

/* ── Curseur ville/nature ── */
.ort-env-nature {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    white-space: nowrap;
    position: relative;
    overflow: visible !important;
}
.ort-env-slider-track {
    width: 70px;
    height: 10px;
    background: linear-gradient(90deg, #6366f1 0%, #22c55e 100%);
    border-radius: 5px;
    position: relative;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.15);
}
.ort-env-slider-thumb {
    width: 14px;
    height: 14px;
    background: #fff;
    border: 2.5px solid #334155;
    border-radius: 50%;
    position: absolute;
    top: -2px;
    transition: left 0.6s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

/* ── Tooltip : géré via JS (div flottant dans body) ── */
.ort-env-tooltip, .ort-env-nature-tooltip { display: none !important; }

/* ── Tooltip nature : géré via JS ── */

/* ── Panneau nearbies ── */
.ort-env-nearby-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 10000;
    justify-content: center;
    align-items: center;
}
.ort-env-nearby-overlay.open { display: flex; }
.ort-env-nearby-panel {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    max-width: 420px;
    width: 90vw;
    max-height: 70vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    position: relative;
}
.ort-env-nearby-panel h3 {
    margin: 0 0 12px;
    font-size: 16px;
    color: #1e293b;
}
.ort-env-nearby-close {
    position: absolute;
    top: 12px;
    right: 14px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #94a3b8;
    line-height: 1;
}
.ort-env-nearby-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid #f1f5f9;
}
.ort-env-nearby-item:last-child { border-bottom: none; }
.ort-env-nearby-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 24px;
    padding: 0 6px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 12px;
    color: #fff;
    flex-shrink: 0;
}
.ort-env-nearby-name {
    font-size: 13px;
    color: #334155;
    flex: 1;
    line-height: 1.3;
}
.ort-env-nearby-name a {
    color: inherit;
    text-decoration: none;
}
.ort-env-nearby-name a:hover { text-decoration: underline; }
.ort-env-nearby-km {
    font-size: 11px;
    color: #94a3b8;
    white-space: nowrap;
}
.ort-env-nearby-intro {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 12px;
    line-height: 1.4;
}
.ort-env-loading {
    font-size: 12px;
    color: #94a3b8;
    padding: 4px 0;
}

/* ── Responsive ── */
@media (max-width: 600px) {
    .ort-env-wrap { gap: 6px; margin-left: 6px; }
    .ort-env-carbon { font-size: 12px; padding: 3px 8px; }
    .ort-env-carbon .ort-env-grade { font-size: 14px; }
    .ort-env-carbon .ort-env-mode { font-size: 10px; }
    .ort-env-nature { font-size: 12px; }
    .ort-env-slider-track { width: 50px; height: 8px; }
    .ort-env-slider-thumb { width: 12px; height: 12px; }
    .ort-env-tooltip { width: 220px; font-size: 12px; left: 0; transform: none; }
    .ort-env-tooltip::before { left: 20px; }
    .ort-env-nature-tooltip { width: 160px; font-size: 11px; }
    .ort-env-nearby-panel { padding: 14px; }
}
`;
        document.head.appendChild(style);
    }

    /** Construire le HTML des badges */
    function buildBadgesHTML(score) {
        var gCar = getGrade(score.co2_car_per_day);
        var gTransit = getGrade(score.co2_transit_per_day);
        var natureRatio = 100 - score.urban_ratio;
        var thumbLeft = Math.max(2, Math.min(score.urban_ratio, 98));

        // Label nature
        var natureLabel = score.urban_ratio > 65 ? t('envUrban') :
                          score.urban_ratio > 35 ? t('envMixed') : t('envNature');

        return '<span class="ort-env-wrap" id="ort-env-wrap">' +
            // Badge carbone VOITURE
            '<span class="ort-env-carbon" id="ort-env-carbon-btn" style="background:' + gCar.color + '">' +
                '<span class="ort-env-grade">' + gCar.grade + '</span>' +
                '<span class="ort-env-mode">' + t('envCar') + '</span>' +
                '<span class="ort-env-tooltip">' +
                    '<b>' + t('envCarTitle') + '</b><br>' +
                    t('envDistance') + ' : ' + score.km_total + ' km — ' + score.days_count + ' ' + t('envDays') + '<br>' +
                    t('envCo2day') + ' : ' + score.co2_car_per_day + ' kg<br>' +
                    t('envTotal') + ' : ' + score.co2_car_total + ' kg CO₂<br>' +
                    '<br>' + t('envGrade') + ' <b>' + gCar.grade + '</b> — ' + gCar.label +
                    '<br><br><em>' + t('envClickAlts') + '</em>' +
                '</span>' +
            '</span>' +
            // Badge carbone TC
            '<span class="ort-env-carbon" style="background:' + gTransit.color + '">' +
                '<span class="ort-env-grade">' + gTransit.grade + '</span>' +
                '<span class="ort-env-mode">' + t('envTransit') + '</span>' +
                '<span class="ort-env-tooltip">' +
                    '<b>' + t('envTransitTitle') + '</b><br>' +
                    t('envDistance') + ' : ' + score.km_total + ' km — ' + score.days_count + ' ' + t('envDays') + '<br>' +
                    t('envCo2day') + ' : ' + score.co2_transit_per_day + ' kg<br>' +
                    t('envTotal') + ' : ' + score.co2_transit_total + ' kg CO₂<br>' +
                    '<br>' + t('envGrade') + ' <b>' + gTransit.grade + '</b> — ' + gTransit.label +
                '</span>' +
            '</span>' +
            // Curseur ville/nature
            '<span class="ort-env-nature">' +
                '<span>🏙️</span>' +
                '<span class="ort-env-slider-track">' +
                    '<span class="ort-env-slider-thumb" style="left:calc(' + thumbLeft + '% - 7px)"></span>' +
                '</span>' +
                '<span>🌿</span>' +
                '<span class="ort-env-nature-tooltip">' +
                    '<b>' + natureLabel + '</b><br>' +
                    '🏙️ ' + score.urban_ratio + '% ' + t('envUrbanPct') + '<br>' +
                    '🌿 ' + natureRatio + '% ' + t('envNaturePct') +
                '</span>' +
            '</span>' +
        '</span>';
    }

    /** Construire le panneau nearbies */
    function buildNearbyOverlay() {
        var overlay = document.createElement('div');
        overlay.className = 'ort-env-nearby-overlay';
        overlay.id = 'ort-env-nearby-overlay';
        overlay.innerHTML =
            '<div class="ort-env-nearby-panel">' +
                '<button class="ort-env-nearby-close" id="ort-env-nearby-close">&times;</button>' +
                '<h3 id="ort-env-nearby-title">🌿 ' + t('envNearbyTitle') + '</h3>' +
                '<p class="ort-env-nearby-intro" id="ort-env-nearby-intro">' + t('envNearbyIntro') + '</p>' +
                '<div id="ort-env-nearby-list"><span class="ort-env-loading">' + t('envLoading') + '</span></div>' +
            '</div>';
        document.body.appendChild(overlay);

        // Fermeture
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.classList.remove('open');
        });
        document.getElementById('ort-env-nearby-close').addEventListener('click', function() {
            overlay.classList.remove('open');
        });
    }

    /** Ouvrir le panneau nearbies et charger les scores */
    /** Cache des titres d'itinéraires */
    var _itinTitlesCache = {};

    /** Charger les titres depuis le fichier modules d'un pays */
    async function loadItinTitles(cc) {
        var lang = (window.ORT_getLang && window.ORT_getLang()) || 'fr';
        if (_itinTitlesCache['_loaded_' + cc + '_' + lang]) return;
        try {
            var url = './data/Roadtripsprefabriques/countries/' + cc.toLowerCase() + '/' + cc.toLowerCase() + '.itins.modules-' + lang + '.json';
            var resp = await fetch(url);
            if (!resp.ok) return;
            var data = await resp.json();
            var itins = data.itins || data.itineraries || data || [];
            if (Array.isArray(itins)) {
                for (var it of itins) {
                    var id = it.id || it.itin_id || '';
                    if (id) _itinTitlesCache[id] = it.title || it.name || '';
                }
            }
            _itinTitlesCache['_loaded_' + cc + '_' + lang] = true;
        } catch (e) {
            console.warn('[ENV] Erreur chargement titres ' + cc + ':', e.message);
        }
    }

    async function openNearbyPanel(nearbyItins, currentGrade) {
        var overlay = document.getElementById('ort-env-nearby-overlay');
        if (!overlay) return;
        overlay.classList.add('open');

        var list = document.getElementById('ort-env-nearby-list');
        list.innerHTML = '<span class="ort-env-loading">' + t('envLoading') + '</span>';

        if (!nearbyItins || nearbyItins.length === 0) {
            list.innerHTML = '<span class="ort-env-loading">' + t('envNoNearby') + '</span>';
            return;
        }

        // Charger les titres pour chaque pays concerné (avec langue courante)
        var countries = {};
        for (var nId of nearbyItins) {
            var cc = nId.split('::')[0] || '';
            if (cc) countries[cc] = true;
        }
        var lang = (window.ORT_getLang && window.ORT_getLang()) || 'fr';
        // Invalider les entrées d'une autre langue avant rechargement
        Object.keys(_itinTitlesCache).forEach(function(k) {
            if (k.startsWith('_loaded_') && !k.endsWith('_' + lang)) delete _itinTitlesCache[k];
        });
        await Promise.all(Object.keys(countries).map(loadItinTitles));

        var html = '';
        for (var nId of nearbyItins) {
            var nScore = await getNearbyScore(nId);
            var nGrade, nColor, nKm;
            if (nScore && nScore.grade) {
                var gi = GRADES.find(function(g) { return g.grade === nScore.grade; }) || GRADES[2];
                nGrade = nScore.grade;
                nColor = gi.color;
                nKm = nScore.km_total ? nScore.km_total + ' km' : '';
            } else {
                nGrade = '?';
                nColor = '#94a3b8';
                nKm = t('envNotCalculated');
            }

            // Titre réel depuis le cache, fallback humanisation du slug
            var name = _itinTitlesCache[nId] || '';
            if (!name) {
                var parts = nId.split('::');
                name = parts[parts.length - 1] || nId;
                name = name.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
            }
            var cc = nId.split('::')[0] || '';

            // Lien vers l\'itinéraire
            var lang = (window.ORT_getLang && window.ORT_getLang()) || 'fr';
            var href = 'roadtrip_detail.html?cc=' + cc + '&itin=' + encodeURIComponent(nId) + '&lang=' + lang;

            html +=
                '<div class="ort-env-nearby-item">' +
                    '<span class="ort-env-nearby-badge" style="background:' + nColor + '">' + nGrade + '</span>' +
                    '<span class="ort-env-nearby-name"><a href="' + href + '">' + name + '</a></span>' +
                    '<span class="ort-env-nearby-km">' + nKm + '</span>' +
                '</div>';
        }

        list.innerHTML = html;
    }

    // INJECTION DANS LA PAGE
    // ══════════════════════════════════════════

    /** Trouver le container titre dans la page */
    function findTitleContainer() {
        // Sélecteurs par priorité (couvre detail, simple, mobile, static)
        var selectors = [
            '#rtTitle',             // RT detail
            '#tripTitle',           // RT detail alt
            '#itinTitle',           // Autre variante
            '.itin-title',          // RT simple/static
            '.trip-title',          // Variante
            '#stageHdr',            // RT mobile
            '#summaryCard',         // RT mobile bandeau stats
            '[data-env-insert]',    // Marqueur explicite
            'h1'                    // Fallback ultime
        ];
        for (var sel of selectors) {
            var el = document.querySelector(sel);
            if (el) return el;
        }
        return null;
    }

    /** Vérifier si on est en mode mobile (summaryCard) */
    function isMobileLayout() {
        return !!document.getElementById('summaryCard') && !document.getElementById('rtTitle');
    }

    /** Extraire days_plan et nearby_itins depuis le state/window */
    function extractItineraryData() {
        var st = window.state || window._ortState || {};
        var daysPlan = null;
        var nearbyItins = null;
        var placesMap = {};

        // Format RT detail/simple/mobile : state.steps avec lat, lon, place_id, _suggestedDays
        if (st.steps && Array.isArray(st.steps) && st.steps.length > 0) {
            daysPlan = st.steps.map(function(s) {
                return {
                    night: {
                        place_id: s.place_id || '',
                        coords: [s.lat || 0, s.lon || 0]
                    },
                    nights: s.nights || 1,
                    suggested_days: s._suggestedDays || s.suggested_days || s.nights || 1,
                    place_type: s.place_type || s.city_size || null
                };
            });
        }

        // Fallback : données raw si injectées par la page
        if (!daysPlan && window._ortItinData) {
            daysPlan = window._ortItinData.days_plan;
        }

        // nearby_itins — chercher dans tous les endroits possibles
        nearbyItins = st._originalNearbyItins || st.nearby_itins || st.nearbyItins || null;
        if (!nearbyItins && window._ortItinData) {
            nearbyItins = window._ortItinData.nearby_itins;
        }

        // Construire placesMap depuis PLACES_INDEX (variable globale de RT detail)
        if (window.PLACES_INDEX) {
            for (var pid in window.PLACES_INDEX) {
                if (window.PLACES_INDEX.hasOwnProperty(pid)) {
                    var p = window.PLACES_INDEX[pid];
                    placesMap[pid] = { place_type: p.place_type || p.city_size || p.type, name: p.name };
                }
            }
        }
        // Fallback : ORT_DATA_LOADER raw places (si data-loader stocke les places brutes)
        if (window.ORT_DATA_LOADER && window.ORT_DATA_LOADER._rawPlaces) {
            var rawPlaces = window.ORT_DATA_LOADER._rawPlaces;
            for (var rp of rawPlaces) {
                if (rp.place_id && rp.place_type && (!placesMap[rp.place_id] || !placesMap[rp.place_id].place_type)) {
                    placesMap[rp.place_id] = placesMap[rp.place_id] || {};
                    placesMap[rp.place_id].place_type = rp.place_type;
                    placesMap[rp.place_id].name = rp.name;
                }
            }
        }
        // Fallback 2 : chercher dans window._ortPlacesRaw ou le master chargé
        if (window._ortPlacesRaw) {
            var raw2 = Array.isArray(window._ortPlacesRaw) ? window._ortPlacesRaw : window._ortPlacesRaw.places || [];
            for (var rp2 of raw2) {
                if (rp2.place_id && rp2.place_type && (!placesMap[rp2.place_id] || !placesMap[rp2.place_id].place_type)) {
                    placesMap[rp2.place_id] = placesMap[rp2.place_id] || {};
                    placesMap[rp2.place_id].place_type = rp2.place_type;
                }
            }
        }
        // Fallback : _ortPlaces
        if (Object.keys(placesMap).length === 0 && window._ortPlaces) {
            var places = window._ortPlaces.places || window._ortPlaces;
            if (Array.isArray(places)) {
                for (var p of places) {
                    if (p.place_id) {
                        placesMap[p.place_id] = { place_type: p.place_type, name: p.name };
                    }
                }
            }
        }

        return { daysPlan: daysPlan, nearbyItins: nearbyItins, placesMap: placesMap };
    }

    // ══════════════════════════════════════════
    // INIT PRINCIPAL
    // ══════════════════════════════════════════

    async function init() {
        injectI18nKeys();
        t = window.t || function(k) { return k; };
        console.log('[ENV] Init ort-env-score.js');

        var catalogId = getCatalogId();
        if (!catalogId) {
            console.log('[ENV] Pas de catalogId trouvé, abandon');
            return;
        }
        console.log('[ENV] catalogId:', catalogId);

        // Snapshot des steps catalogue (première init uniquement) pour détecter les modifs
        var st = window.state || window._ortState || {};
        if (!st._originalSteps && st.steps && st.steps.length > 0) {
            st._originalSteps = st.steps.map(function(s) { return { place_id: s.place_id, name: s.name, nights: s.nights }; });
            console.log('[ENV] 📸 Snapshot catalogue steps:', st._originalSteps.length, 'étapes');
        }

        injectStyles();
        buildNearbyOverlay();

        // 1. Afficher le sablier immédiatement
        var titleEl = findTitleContainer();
        if (!titleEl) {
            console.warn('[ENV] Pas de titre trouvé pour injection');
            return;
        }

        // Supprimer d'éventuels anciens badges (recalcul)
        var oldWrap = document.getElementById('ort-env-wrap');
        if (oldWrap) oldWrap.remove();
        var oldMobile = document.getElementById('ort-env-mobile-badge');
        if (oldMobile) oldMobile.remove();

        if (isMobileLayout()) {
            var loadingEl = document.createElement('div');
            loadingEl.id = 'ort-env-mobile-badge';
            loadingEl.className = 'summary-stat';
            loadingEl.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;';
            loadingEl.innerHTML = '<div style="font-size:16px;" class="ort-env-spinner">⏳</div><div class="label">CO₂</div>';
            titleEl.appendChild(loadingEl);
        } else {
            var loadingEl = document.createElement('span');
            loadingEl.id = 'ort-env-wrap';
            loadingEl.className = 'ort-env-wrap';
            loadingEl.innerHTML = ' <span class="ort-env-spinner" style="font-size:14px;">⏳</span>';
            titleEl.appendChild(loadingEl);
        }

        // 2. Chercher score en cache Firestore
        var scoreCacheKey = getScoreCacheKey() || sanitizeDocId(catalogId);
        var score = await getCachedScore(scoreCacheKey);

        if (score && score.grade && score.cache_version === CACHE_VERSION) {
            console.log('[ENV] Score trouvé en cache v' + score.cache_version + ':', score.grade, score.co2_car_per_day, 'kg/j,', score.days_count, 'jours');
        } else {
            // Cache absent, ancien format, ou ancienne version → recalculer
            if (score) console.log('[ENV] Cache invalide (v' + (score.cache_version || 0) + ' vs v' + CACHE_VERSION + '), recalcul...');
            else console.log('[ENV] Pas de cache, calcul en cours...');

            var data = extractItineraryData();
            if (!data.daysPlan || data.daysPlan.length === 0) {
                console.warn('[ENV] Pas de days_plan disponible');
                // Retirer le sablier
                var spinner = document.querySelector('.ort-env-spinner');
                if (spinner) spinner.parentElement.remove();
                return;
            }

            // Vérifier si on a des place_type — sinon fetch le master JSON
            var hasAnyType = Object.values(data.placesMap).some(function(v) { return !!v.place_type; });
            if (!hasAnyType && data.daysPlan.length > 0) {
                var firstPid = data.daysPlan[0].night && data.daysPlan[0].night.place_id || '';
                var cc = firstPid.split('::')[0] || '';
                if (cc) {
                    try {
                        var lang = (window.ORT_getLang && window.ORT_getLang()) || 'fr';
                        var masterUrl = './data/Roadtripsprefabriques/countries/' + cc + '/' + cc.toLowerCase() + '.places.master-' + lang + '.json';
                        console.log('[ENV] Fetch master places:', masterUrl);
                        var resp = await fetch(masterUrl);
                        if (resp.ok) {
                            var masterJson = await resp.json();
                            var masterPlaces = masterJson.places || masterJson;
                            if (Array.isArray(masterPlaces)) {
                                for (var mp of masterPlaces) {
                                    if (mp.place_id && mp.place_type) {
                                        data.placesMap[mp.place_id] = data.placesMap[mp.place_id] || {};
                                        data.placesMap[mp.place_id].place_type = mp.place_type;
                                        data.placesMap[mp.place_id].name = mp.name;
                                    }
                                }
                                console.log('[ENV] Master places chargé:', Object.keys(data.placesMap).length, 'places avec types');
                            }
                        }
                    } catch (e) {
                        console.warn('[ENV] Fetch master places échoué:', e.message);
                    }
                }
            }

            score = await calculateScore(data.daysPlan, data.placesMap);
            if (!score) {
                console.warn('[ENV] Calcul échoué');
                var spinner = document.querySelector('.ort-env-spinner');
                if (spinner) spinner.parentElement.remove();
                return;
            }

            console.log('[ENV] Calculé:', score.grade, score.co2_car_per_day, 'kg/j,', score.km_total, 'km,', score.api_calls, 'API calls,', score.cache_hits, 'cache hits');

            // Sauver en cache (clé personnalisée si modifié, sinon catalogue)
            await setCachedScore(scoreCacheKey, score);
            // Si c'est la clé catalogue (pas modifié), ne pas doubler
            var catKey = sanitizeDocId(catalogId);
            if (scoreCacheKey !== catKey) {
                // Ne PAS écraser le cache catalogue — les modifications sont privées
            } else {
                // C'est le catalogue brut, pas de trip perso
            }
        }

        // 3. Remplacer le sablier par les vrais badges
        if (isMobileLayout()) {
            var badge = document.getElementById('ort-env-mobile-badge');
            if (badge) {
                var gCar = getGrade(score.co2_car_per_day);
                badge.innerHTML =
                    '<div style="display:flex;gap:4px;align-items:center;">' +
                        '<span id="ort-env-carbon-btn" style="background:' + gCar.color + ';color:#fff;padding:2px 8px;border-radius:12px;font-weight:700;font-size:13px;cursor:pointer;">' + gCar.grade + '</span>' +
                    '</div>' +
                    '<div class="label">CO₂</div>';
            }
        } else {
            var wrap = document.getElementById('ort-env-wrap');
            if (wrap) {
                wrap.innerHTML = buildBadgesHTML(score).replace(/^<[^>]+>/, '').replace(/<\/[^>]+>$/, '');
                // Forcer overflow visible sur le titre et ses parents
                var el = titleEl;
                for (var depth = 0; depth < 5 && el; depth++) {
                    el.style.overflow = 'visible';
                    el = el.parentElement;
                }
            }
        }

        // 5. Brancher le clic → panneau nearbies
        var carbonBtn = document.getElementById('ort-env-carbon-btn');
        if (carbonBtn) {
            var currentGrade = score.grade;
            carbonBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                // Re-extraire les données au moment du clic (state peut avoir changé)
                var freshData = extractItineraryData();
                openNearbyPanel(freshData.nearbyItins, currentGrade);
            });
        }

        // 6. Tooltip flottant (div unique dans body, contourne tous les overflow:hidden)
        var floatingTip = document.createElement('div');
        floatingTip.id = 'ort-env-floating-tip';
        floatingTip.style.cssText = 'position:fixed;display:none;background:#1e293b;color:#f1f5f9;padding:12px 16px;border-radius:12px;font-size:13px;line-height:1.6;width:260px;z-index:999999;box-shadow:0 6px 20px rgba(0,0,0,0.3);pointer-events:none;';
        document.body.appendChild(floatingTip);

        var allBadges = document.querySelectorAll('.ort-env-carbon, .ort-env-nature');
        allBadges.forEach(function(badge) {
            badge.addEventListener('mouseenter', function() {
                var tip = badge.querySelector('.ort-env-tooltip, .ort-env-nature-tooltip');
                if (!tip) return;
                floatingTip.innerHTML = tip.innerHTML;
                floatingTip.style.display = 'block';
                var rect = badge.getBoundingClientRect();
                var tipW = 260;
                var left = rect.left + rect.width / 2 - tipW / 2;
                if (left < 8) left = 8;
                if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
                floatingTip.style.top = (rect.bottom + 8) + 'px';
                floatingTip.style.left = left + 'px';
            });
            badge.addEventListener('mouseleave', function() {
                floatingTip.style.display = 'none';
            });
        });

        console.log('[ENV] ✅ Badges injectés');
    }

    // ══════════════════════════════════════════
    // AUTO-INIT
    // ══════════════════════════════════════════

    // Attendre que le state soit prêt (les pages ORT chargent les données après DOMContentLoaded)
    function waitAndInit() {
        var attempts = 0;
        var maxAttempts = 60; // 30 secondes max

        var timer = setInterval(function() {
            attempts++;
            var catalogId = getCatalogId();
            var st = window.state || window._ortState || {};
            var hasSteps = st.steps && st.steps.length > 0;
            var hasPlaces = window.PLACES_INDEX && Object.keys(window.PLACES_INDEX).length > 0;

            if (catalogId && hasSteps && hasPlaces) {
                clearInterval(timer);
                init();
            } else if (catalogId && hasSteps && attempts >= 40) {
                // 20s passées, on lance sans PLACES_INDEX (fallback unknown)
                clearInterval(timer);
                console.log('[ENV] Init sans PLACES_INDEX (timeout)');
                init();
            } else if (attempts >= maxAttempts) {
                clearInterval(timer);
                console.log('[ENV] Timeout — catalogId:', catalogId, 'steps:', window.state?.steps?.length || 0, 'places:', hasPlaces);
            }
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(waitAndInit, 1000); });
    } else {
        setTimeout(waitAndInit, 1000);
    }

    // API publique pour forcer l'init ou recalculer
    window.ORT_ENV = {
        init: init,
        calculateScore: calculateScore,
        getCachedScore: getCachedScore,
        /** Recalculer le score (appelé après modif du trajet) */
        recalculate: async function() {
            console.log('[ENV] 🔄 Recalcul déclenché');
            // Forcer recalcul en invalidant le cache local
            var catalogId = getCatalogId();
            if (!catalogId) return;

            var data = extractItineraryData();
            if (!data.daysPlan || data.daysPlan.length === 0) return;

            // Vérifier place_types
            var hasAnyType = Object.values(data.placesMap).some(function(v) { return !!v.place_type; });
            if (!hasAnyType) {
                var firstPid = data.daysPlan[0].night && data.daysPlan[0].night.place_id || '';
                var cc = firstPid.split('::')[0] || '';
                if (cc) {
                    try {
                        var lang = (window.ORT_getLang && window.ORT_getLang()) || 'fr';
                        var masterUrl = './data/Roadtripsprefabriques/countries/' + cc + '/' + cc.toLowerCase() + '.places.master-' + lang + '.json';
                        var resp = await fetch(masterUrl);
                        if (resp.ok) {
                            var masterJson = await resp.json();
                            var masterPlaces = masterJson.places || masterJson;
                            if (Array.isArray(masterPlaces)) {
                                for (var mp of masterPlaces) {
                                    if (mp.place_id && mp.place_type) {
                                        data.placesMap[mp.place_id] = data.placesMap[mp.place_id] || {};
                                        data.placesMap[mp.place_id].place_type = mp.place_type;
                                    }
                                }
                            }
                        }
                    } catch (e) {}
                }
            }

            var score = await calculateScore(data.daysPlan, data.placesMap);
            if (!score) return;

            // Sauver le nouveau score — utiliser la même clé que init() pour cohérence
            // getScoreCacheKey() détecte si modifié vs catalogue et génère la bonne clé
            var cacheKey = getScoreCacheKey() || sanitizeDocId(catalogId);
            console.log('[ENV] 💾 Sauvegarde score recalculé sur clé:', cacheKey);
            await setCachedScore(cacheKey, score);

            // Rafraîchir l'affichage
            init();
        }
    };

    // Écouter les modifications du trajet (événement custom ORT)
    ['ort:steps-changed', 'ort:nights-changed', 'ort:step-added', 'ort:step-removed', 'ort:step-reordered'].forEach(function(evt) {
        document.addEventListener(evt, function() {
            clearTimeout(window._ortEnvRecalcTimer);
            window._ortEnvRecalcTimer = setTimeout(function() {
                if (window.ORT_ENV && window.ORT_ENV.recalculate) {
                    window.ORT_ENV.recalculate();
                }
            }, 2000);
        });
    });

    // Polling léger : détecter les changements de steps (fallback si pas d'events custom)
    (function watchStepsChanges() {
        var st = window.state || window._ortState || {};
        var lastHash = '';

        function computeHash() {
            var s = st.steps || [];
            return s.length + ':' + s.map(function(x) { return (x.place_id || x.name || '') + '/' + (x.nights || 0); }).join(',');
        }

        setInterval(function() {
            st = window.state || window._ortState || {};
            var hash = computeHash();
            if (lastHash && hash !== lastHash) {
                console.log('[ENV] 🔄 Changement de steps détecté');
                clearTimeout(window._ortEnvRecalcTimer);
                window._ortEnvRecalcTimer = setTimeout(function() {
                    if (window.ORT_ENV && window.ORT_ENV.recalculate) {
                        window.ORT_ENV.recalculate();
                    }
                }, 3000);
            }
            lastHash = hash;
        }, 5000); // Vérifier toutes les 5 secondes
    })();

})(window, document);
