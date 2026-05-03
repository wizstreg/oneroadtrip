/**
 * OneRoadTrip - Calcul des dates et nuits
 * Module unifié pour roadtrip_detail, roadtrip_detail_simple, roadtrip_mobile
 * 
 * Fonctionnalités :
 * - Calcul des dates (startDate → dates étapes)
 * - Calcul intelligent des nuits (hub/satellite basé sur distance + rating)
 * - Fonctions Stay22 (checkin/checkout)
 * - Utilitaires de distance et formatage
 */

(function(global) {
  'use strict';

  // ============================================================
  // CONFIGURATION
  // ============================================================
  
  const CONFIG = {
    // Distance pour fusionner 2 hubs consécutifs
    HUB_MERGE_DISTANCE_KM: 20,
    
    // Distance max pour rattacher un satellite à un hub
    SATELLITE_DISTANCE_KM: 20,
    
    // Distance pour considérer 2 étapes consécutives comme proches
    GROUPING_DISTANCE_KM: 20,
    
    // Distance max entre une étape et son hub (sinon créer un nouveau groupe)
    MAX_HUB_RADIUS_KM: 25,
    
    // Nombre max d'étapes par groupe (force plusieurs hubs pour longs voyages)
    MAX_STEPS_PER_GROUP: 4,
    
    // Max jours pour qu'une étape soit satellite (sinon hub indépendant)
    GROUPING_MAX_DAYS: 2,
    
    // Seuil "très proche" (quasi même lieu)
    VERY_CLOSE_KM: 10,
    
    // Nuit minimum par hub (au moins 1 nuit)
    MIN_NIGHTS_PER_HUB: 1,
    
    // Délai d'attente pour le calcul de route (ms)
    ROUTE_CALC_WAIT_MS: 7000
  };

  // ============================================================
  // UTILITAIRES DE BASE
  // ============================================================

  /**
   * Calcul distance Haversine (vol d'oiseau) en km
   */
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Ajoute N jours à une date
   */
  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  /**
   * Format date ISO (YYYY-MM-DD)
   */
  function formatDateISO(date) {
    if (!date) return '';
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Format date courte localisée (ex: "15 jan")
   */
  function formatDateShort(date, lang) {
    if (!date) return '';
    const d = new Date(date);
    const locale = { fr: 'fr-FR', en: 'en-US', es: 'es-ES', it: 'it-IT', pt: 'pt-PT', ar: 'ar-SA' }[lang] || 'fr-FR';
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
  }

  /**
   * Somme des nuits de toutes les étapes
   */
  function sumNights(steps) {
    if (!steps || !Array.isArray(steps)) return 0;
    return steps.reduce((sum, step) => sum + Number(step.nights || 0), 0);
  }

  // ============================================================
  // FONCTIONS DE DATE
  // ============================================================

  /**
   * Récupère la date de départ depuis state
   * @param {Object} state - L'état global avec startDateStr ou startDate
   * @returns {Date|null}
   */
  function getStartDate(state) {
    if (!state) return null;
    const dateStr = state.startDateStr || state.startDate;
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * Calcule la plage de dates pour une étape
   * @param {Object} state - L'état global
   * @param {number} idx - Index de l'étape
   * @returns {Object} {start: Date, end: Date} ou {start: null, end: null}
   */
  function stepDateRange(state, idx) {
    const startDate = getStartDate(state);
    if (!startDate || !state.steps || idx < 0 || idx >= state.steps.length) {
      return { start: null, end: null };
    }
    
    // Calcul offset = somme des nuits des étapes précédentes
    let offset = 0;
    for (let i = 0; i < idx; i++) {
      offset += Number(state.steps[i].nights || 0);
    }
    
    const stepStart = addDays(startDate, offset);
    const stepNights = Number(state.steps[idx].nights || 0);
    const stepEnd = addDays(stepStart, stepNights);
    
    return { start: stepStart, end: stepEnd };
  }

  /**
   * Récupère les dates Stay22 (checkin/checkout) pour une étape
   * @param {Object} state - L'état global
   * @param {number} stepIndex - Index de l'étape
   * @returns {Object} {checkin: string, checkout: string} format YYYY-MM-DD
   */
  function getStay22Dates(state, stepIndex) {
    const range = stepDateRange(state, stepIndex);
    return {
      checkin: formatDateISO(range.start),
      checkout: formatDateISO(range.end)
    };
  }

  /**
   * Tooltip label pour les dates (i18n)
   */
  function getDateTooltip(state, idx, lang) {
    const range = stepDateRange(state, idx);
    if (!range.start) return '';
    
    const nights = Number(state.steps[idx]?.nights || 0);
    const labels = {
      fr: nights > 0 ? `Nuit du ${formatDateShort(range.start, lang)}` : `Passage le ${formatDateShort(range.start, lang)}`,
      en: nights > 0 ? `Night of ${formatDateShort(range.start, lang)}` : `Visit on ${formatDateShort(range.start, lang)}`,
      es: nights > 0 ? `Noche del ${formatDateShort(range.start, lang)}` : `Visita el ${formatDateShort(range.start, lang)}`,
      it: nights > 0 ? `Notte del ${formatDateShort(range.start, lang)}` : `Visita il ${formatDateShort(range.start, lang)}`,
      pt: nights > 0 ? `Noite de ${formatDateShort(range.start, lang)}` : `Visita em ${formatDateShort(range.start, lang)}`,
      ar: nights > 0 ? `ليلة ${formatDateShort(range.start, lang)}` : `زيارة في ${formatDateShort(range.start, lang)}`
    };
    return labels[lang] || labels.fr;
  }

  // ============================================================
  // REGROUPEMENT DES NUITS PAR LIEU
  // ============================================================

  /**
   * Regroupe les nuits des jours consécutifs au même lieu
   * Logique : nombre de jours au même lieu = nombre de nuits
   * Exemple : 4 jours à Tokyo → première étape = 4 nuits, autres = 0
   * @param {Array} steps - Les étapes à traiter
   * @returns {Array} Les étapes avec nuits regroupées
   */
  function groupNightsByPlace(steps) {
    if (!steps || !Array.isArray(steps) || steps.length === 0) return steps;
    
    console.log('[ORT-TRIP-CALC] === REGROUPEMENT DES NUITS PAR LIEU ===');
    console.log(`[ORT-TRIP-CALC] ${steps.length} étapes à traiter`);
    
    let currentPlaceId = null;
    let currentGroupStart = 0;
    let currentGroupCount = 0;
    let groupsFound = 0;
    
    for (let i = 0; i <= steps.length; i++) {
      const step = steps[i];
      const placeId = step?.place_id || step?.placeId || step?.night?.place_id || `step_${i}`;
      
      if (i === steps.length || placeId !== currentPlaceId) {
        // Fin du groupe précédent - assigner les nuits
        if (currentGroupCount > 0 && currentPlaceId !== null) {
          // Première étape du groupe = nombre de jours dans le groupe
          steps[currentGroupStart].nights = currentGroupCount;
          steps[currentGroupStart]._isGroupHead = true;
          steps[currentGroupStart]._groupSize = currentGroupCount;
          
          // Autres étapes du groupe = 0 nuit
          for (let j = currentGroupStart + 1; j < currentGroupStart + currentGroupCount; j++) {
            steps[j].nights = 0;
            steps[j]._isGroupMember = true;
            steps[j]._groupHead = currentGroupStart;
          }
          
          if (currentGroupCount > 1) {
            groupsFound++;
            console.log(`[ORT-TRIP-CALC] Groupe ${groupsFound}: ${steps[currentGroupStart].name} (${currentGroupCount} jours) → ${currentGroupCount} nuit(s)`);
          }
        }
        
        // Démarrer nouveau groupe
        if (i < steps.length) {
          currentPlaceId = placeId;
          currentGroupStart = i;
          currentGroupCount = 1;
        }
      } else {
        // Même lieu - continuer le groupe
        currentGroupCount++;
      }
    }
    
    // Dernière étape = 0 nuit si c'est un aéroport
    const lastStep = steps[steps.length - 1];
    if (lastStep && (
      lastStep.place_id?.includes('airport') || 
      lastStep.name?.toLowerCase().includes('aéroport') || 
      lastStep.name?.toLowerCase().includes('airport')
    )) {
      lastStep.nights = 0;
      console.log(`[ORT-TRIP-CALC] ✈️ ${lastStep.name}: 0 nuit (aéroport/départ)`);
    }
    
    if (groupsFound > 0) {
      console.log(`[ORT-TRIP-CALC] ✅ ${groupsFound} groupe(s) multi-jours fusionné(s)`);
    }
    
    const totalNights = steps.reduce((sum, s) => sum + (s.nights || 0), 0);
    console.log(`[ORT-TRIP-CALC] Total après regroupement: ${totalNights} nuits`);
    
    return steps;
  }

  // ============================================================
  // CALCUL DES NUITS (HUB/SATELLITE)
  // ============================================================

  /**
   * Détermine le nombre de nuits suggéré selon le temps de visite
   * @param {number} totalMinutes - Temps total de visite en minutes
   * @returns {number}
   */
  function determineNightsFromVisitTime(totalMinutes) {
    if (totalMinutes < 240) return 0;      // < 4h → passage
    if (totalMinutes < 480) return 1;      // 4-8h → 1 nuit
    if (totalMinutes < 840) return 2;      // 8-14h → 2 nuits
    return Math.ceil(totalMinutes / 420);  // > 14h → 1 nuit / 7h
  }

  /**
   * Calcule le score d'une étape pour être hub
   * Plus le score est élevé, plus l'étape est prioritaire comme hub
   * @param {Object} step - L'étape
   * @param {number} groupSize - Taille du groupe (pour centralité)
   * @param {number} positionInGroup - Position dans le groupe (0-based)
   * @returns {number}
   */
  function calculateHubScore(step, groupSize, positionInGroup) {
    let score = 0;
    
    // 1. Jours suggérés (critère principal — toujours renseigné à l'intégration)
    const suggestedDays = Number(step.suggested_days || step.suggestedDays || 1);
    score += suggestedDays * 40;
    
    // 2. Rating du lieu (bonus quand renseigné, 0 à l'intégration → fallback neutre)
    const rawRating = Number(step.rating || step.score || 0);
    const rating = rawRating > 0 ? rawRating : 5; // fallback 5 si non renseigné
    score += rating * 5;
    
    // 3. Centralité dans le groupe (position centrale = bonus)
    const center = (groupSize - 1) / 2;
    const distanceFromCenter = Math.abs(positionInGroup - center);
    const centralityBonus = (1 - distanceFromCenter / Math.max(center, 1)) * 20;
    score += centralityBonus;
    
    // 4. Nombre d'activités/visites (plus = meilleur)
    const visitsCount = (step.visits?.length || 0) + (step.activities?.length || 0);
    score += Math.min(visitsCount, 10) * 2;
    
    return score;
  }

  /**
   * Récupère la distance entre deux étapes consécutives
   * Priorité : distance route > haversine
   * @param {Object} prev - Étape précédente
   * @param {Object} curr - Étape courante
   * @returns {Object} {distance: number, source: 'route'|'haversine'}
   */
  function getDistanceBetweenSteps(prev, curr) {
    // 1. Essayer la distance route (calculée par le routing)
    // Le champ peut être sur prev (distance vers le suivant) ou sur curr
    const routeDistance = prev.distanceKm || prev.routeDistanceKm || prev.distanceToNext || curr.distanceFromPrev;
    
    if (routeDistance && routeDistance > 0) {
      return { distance: routeDistance, source: 'route' };
    }
    
    // 2. Fallback haversine
    const lat1 = Number(prev.lat || prev.latitude || prev.coords?.[0] || 0);
    const lon1 = Number(prev.lon || prev.lng || prev.longitude || prev.coords?.[1] || 0);
    const lat2 = Number(curr.lat || curr.latitude || curr.coords?.[0] || 0);
    const lon2 = Number(curr.lon || curr.lng || curr.longitude || curr.coords?.[1] || 0);
    
    return { distance: haversineDistance(lat1, lon1, lat2, lon2), source: 'haversine' };
  }

  /**
   * Identifie les groupes d'étapes qui peuvent partager un même hub (hôtel)
   * 
   * Critères :
   * 1. Distance consécutive < GROUPING_DISTANCE_KM (20km)
   * 2. Max MAX_STEPS_PER_GROUP étapes par groupe (force plusieurs hubs pour longs voyages)
   * 
   * @param {Array} steps - Les étapes
   * @returns {Array} Groupes d'indices [{indices: [0,1,2], hubIdx: 1}, ...]
   */
  function identifyGroups(steps) {
    if (!steps || steps.length === 0) return [];
    
    console.log('%c[LOG-CONTROLE][TRIP-CALC] ========== IDENTIFY GROUPS ==========', 'background: #666600; color: white; font-size: 12px; padding: 2px 6px;');
    console.log(`[LOG-CONTROLE][TRIP-CALC] CONFIG: GROUPING_DISTANCE_KM=${CONFIG.GROUPING_DISTANCE_KM}, MAX_STEPS_PER_GROUP=${CONFIG.MAX_STEPS_PER_GROUP}`);
    
    // Phase 1 : Grouper par distance consécutive ET limite de taille
    const groups = [];
    let currentGroup = [0];
    
    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1];
      const curr = steps[i];
      
      const dist = haversineDistance(
        Number(prev.lat || prev.latitude || prev.coords?.[0] || 0),
        Number(prev.lon || prev.lng || prev.longitude || prev.coords?.[1] || 0),
        Number(curr.lat || curr.latitude || curr.coords?.[0] || 0),
        Number(curr.lon || curr.lng || curr.longitude || curr.coords?.[1] || 0)
      );
      
      const tooFar = dist > CONFIG.GROUPING_DISTANCE_KM;
      const groupFull = currentGroup.length >= CONFIG.MAX_STEPS_PER_GROUP;
      
      if (tooFar || groupFull) {
        // Nouveau groupe
        groups.push([...currentGroup]);
        currentGroup = [i];
        const reason = tooFar ? `${dist.toFixed(1)}km > ${CONFIG.GROUPING_DISTANCE_KM}km` : `groupe plein (${CONFIG.MAX_STEPS_PER_GROUP} max)`;
        console.log(`[LOG-CONTROLE][TRIP-CALC] ${i-1}→${i}: ${prev.name} → ${curr.name} = ${dist.toFixed(1)}km → ❌ SÉPARÉ (${reason})`);
      } else {
        currentGroup.push(i);
        console.log(`[LOG-CONTROLE][TRIP-CALC] ${i-1}→${i}: ${prev.name} → ${curr.name} = ${dist.toFixed(1)}km → ✅ GROUPE`);
      }
    }
    groups.push([...currentGroup]);
    
    console.log(`[LOG-CONTROLE][TRIP-CALC] ${groups.length} groupe(s) formé(s)`);
    
    // Phase 2 : Pour chaque groupe, trouver le meilleur hub
    const finalGroups = groups.map((indices, gIdx) => {
      if (indices.length === 1) {
        return { indices, hubIdx: indices[0] };
      }
      
      // Trouver le hub avec le meilleur score (rating + position centrale)
      let bestScore = -Infinity;
      let bestIdx = indices[0];
      
      indices.forEach((stepIdx, posInGroup) => {
        const score = calculateHubScore(steps[stepIdx], indices.length, posInGroup);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = stepIdx;
        }
      });
      
      const hubName = steps[bestIdx]?.name || '?';
      const hubRating = Number(steps[bestIdx]?.rating || 0);
      console.log(`[LOG-CONTROLE][TRIP-CALC]   Groupe ${gIdx+1}: Hub=${hubName} (rating ${hubRating.toFixed(1)}, score ${bestScore.toFixed(1)})`);
      
      return { indices, hubIdx: bestIdx };
    });
    
    console.log(`[LOG-CONTROLE][TRIP-CALC] ========== RÉSULTAT: ${finalGroups.length} groupe(s) ==========`);
    finalGroups.forEach((g, i) => {
      const hubName = steps[g.hubIdx]?.name || '?';
      const names = g.indices.map(idx => steps[idx].name).join(', ');
      console.log(`[LOG-CONTROLE][TRIP-CALC]   Groupe ${i+1}: Hub=${hubName}, étapes=[${g.indices.join(',')}]: ${names}`);
    });
    
    return finalGroups;
  }

  /**
   * Calcule automatiquement les nuits pour atteindre targetNights
   * Algorithme :
   * 1. Identifier les groupes d'étapes proches consécutives
   * 2. Pour chaque groupe, choisir le hub (meilleur rating + position centrale)
   * 3. Satellites (autres étapes du groupe) = 0 nuit
   * 4. Répartir targetNights entre les hubs selon leur rating
   * 
   * @param {Object} state - L'état global avec state.steps
   * @param {number} targetNights - Nombre de nuits souhaitées
   * @returns {number} Nombre de nuits effectivement attribuées
   */
  function autoCalculateNights(state, targetNights) {
    // ========== DEBUG LOGS - À SUPPRIMER APRÈS VALIDATION ==========
    console.log('%c[LOG-CONTROLE][TRIP-CALC] ========== autoCalculateNights APPELÉ ==========', 'background: #0000cc; color: white; font-size: 14px; padding: 4px 8px;');
    console.log('[LOG-CONTROLE][TRIP-CALC] state existe:', !!state);
    console.log('[LOG-CONTROLE][TRIP-CALC] state.steps:', state?.steps?.length || 0, 'étapes');
    console.log('[LOG-CONTROLE][TRIP-CALC] targetNights reçu:', targetNights);
    console.log('[LOG-CONTROLE][TRIP-CALC] state.targetNights:', state?.targetNights);
    console.log('[LOG-CONTROLE][TRIP-CALC] state.startDateStr:', state?.startDateStr);
    console.log('[LOG-CONTROLE][TRIP-CALC] state.requestedDays:', state?.requestedDays);
    if (state?.steps?.length > 0) {
      console.log('[LOG-CONTROLE][TRIP-CALC] Première étape:', state.steps[0]?.name, '- rating:', state.steps[0]?.rating);
      console.log('[LOG-CONTROLE][TRIP-CALC] Dernière étape:', state.steps[state.steps.length-1]?.name, '- rating:', state.steps[state.steps.length-1]?.rating);
    }
    // ===============================================================
    
    if (!state?.steps || state.steps.length === 0 || targetNights <= 0) {
      console.log('[LOG-CONTROLE][TRIP-CALC] ❌ ABANDON: steps=' + (state?.steps?.length || 0) + ', targetNights=' + targetNights);
      return 0;
    }
    
    const steps = state.steps;
    const n = steps.length;
    
    console.log(`[LOG-CONTROLE][TRIP-CALC] ✅ Calcul pour ${n} étapes, cible ${targetNights} nuits`);
    
    // 1. Identifier les groupes
    const groups = identifyGroups(steps);
    console.log(`[LOG-CONTROLE][TRIP-CALC] ${groups.length} groupe(s) identifié(s):`, groups.map(g => ({
      indices: g.indices,
      hub: g.hubIdx,
      hubName: steps[g.hubIdx]?.name
    })));
    
    // 2. Marquer toutes les étapes
    steps.forEach((step, i) => {
      step._isHub = false;
      step._isSatellite = false;
      step._hubGroup = null;
      step._satellites = [];
      step.nights = 0;
    });
    
    // 3. Pour chaque groupe, marquer hub et satellites
    const hubs = [];
    
    groups.forEach(group => {
      const hubIdx = group.hubIdx;
      const hubStep = steps[hubIdx];
      
      hubStep._isHub = true;
      hubStep._satellites = [];
      
      const rawRating = Number(hubStep.rating || hubStep.score || 0);
      hubs.push({
        idx: hubIdx,
        rating: rawRating > 0 ? rawRating : 5, // fallback 5 si non renseigné
        suggestedDays: Number(hubStep.suggested_days || hubStep.suggestedDays || 1)
      });
      
      // Marquer les satellites
      group.indices.forEach(i => {
        if (i !== hubIdx) {
          steps[i]._isSatellite = true;
          steps[i]._hubGroup = hubIdx;
          steps[i].nights = 0; // Satellites = 0 nuit
          hubStep._satellites.push(i);
        }
      });
    });
    
    // 4. Dernière étape : vérifier si c'est un vrai hub ou juste un point de passage
    const lastIdx = n - 1;
    const lastStep = steps[lastIdx];
    const lastRating = Number(lastStep.rating || lastStep.score || 0);
    const lastSuggestedDays = Number(lastStep.suggested_days || lastStep.suggestedDays || 0);
    
    // Vrai hub si rating renseigné (>= 5) OU suggested_days >= 1 (toujours renseigné à l'intégration)
    const lastIsRealHub = lastStep._isHub && (lastRating >= 5 || lastSuggestedDays >= 1);
    
    // 5. Compter les hubs éligibles
    // Inclure la dernière étape seulement si c'est un vrai hub
    const eligibleHubs = hubs.filter(h => h.idx !== lastIdx || lastIsRealHub);
    
    if (eligibleHubs.length === 0) {
      console.log('[LOG-CONTROLE][TRIP-CALC] ❌ Aucun hub éligible (voyage trop court)');
      return 0;
    }
    
    console.log('[LOG-CONTROLE][TRIP-CALC] ========== HUBS ÉLIGIBLES ==========');
    console.log(`[LOG-CONTROLE][TRIP-CALC] Dernière étape: ${lastStep.name} (rating=${lastRating}, suggestedDays=${lastSuggestedDays}, isRealHub=${lastIsRealHub})`);
    console.log(`[LOG-CONTROLE][TRIP-CALC] ${eligibleHubs.length} hub(s) éligible(s):`);
    eligibleHubs.forEach(h => {
      console.log(`[LOG-CONTROLE][TRIP-CALC]   - idx=${h.idx}: ${steps[h.idx].name} (rating=${h.rating}, suggestedDays=${h.suggestedDays})`);
    });
    
    // 6. Répartir les nuits entre les hubs selon suggested_days (+ bonus rating si renseigné)
    // suggested_days est toujours renseigné à l'intégration, rating souvent à 0
    const getWeight = (h) => {
      const sdWeight = h.suggestedDays * 2;           // poids principal
      const ratingBonus = h.rating > 5 ? (h.rating - 5) * 0.1 : 0; // bonus si rating > médiane
      return sdWeight + ratingBonus;
    };

    console.log('[LOG-CONTROLE][TRIP-CALC] ========== RÉPARTITION NUITS ==========');
    console.log(`[LOG-CONTROLE][TRIP-CALC] Target: ${targetNights} nuits à répartir`);

    // V3 : si on a plus de hubs éligibles que de nuits demandées, on doit en
    // déclasser certains en satellites (= 0 nuit, juste traversés).
    // On garde les `targetNights` MEILLEURS hubs (par rating + suggestedDays),
    // les autres deviennent satellites. Sinon on alloue 8 nuits pour 3 demandées.
    let activeHubs = eligibleHubs;
    if (targetNights > 0 && targetNights < eligibleHubs.length * CONFIG.MIN_NIGHTS_PER_HUB) {
      console.log(`[LOG-CONTROLE][TRIP-CALC] ⚠️ ${eligibleHubs.length} hubs > ${targetNights} nuits demandées : sélection des meilleurs`);

      // Tri : score combiné (rating bonus + suggestedDays), décroissant.
      // En départage : rating brut, puis ordre original (idx croissant pour stabilité).
      const ranked = [...eligibleHubs].sort((a, b) => {
        const wDiff = getWeight(b) - getWeight(a);
        if (wDiff !== 0) return wDiff;
        const rDiff = b.rating - a.rating;
        if (rDiff !== 0) return rDiff;
        return a.idx - b.idx;
      });

      const keepCount = Math.floor(targetNights / CONFIG.MIN_NIGHTS_PER_HUB);
      activeHubs = ranked.slice(0, keepCount);
      const dropped = ranked.slice(keepCount);

      // Les hubs déclassés deviennent satellites : nights=0, et on les marque
      // pour que le rendu UI sache que ce sont des "passages" et non des étapes-nuit.
      dropped.forEach(h => {
        steps[h.idx].nights = 0;
        steps[h.idx]._isHub = false;
        steps[h.idx]._isSatellite = true;
      });

      console.log(`[LOG-CONTROLE][TRIP-CALC] ${activeHubs.length} hub(s) gardé(s), ${dropped.length} déclassé(s) en satellite :`);
      activeHubs.forEach(h => {
        console.log(`[LOG-CONTROLE][TRIP-CALC]   ✅ GARDÉ : ${steps[h.idx].name} (rating=${h.rating}, sd=${h.suggestedDays})`);
      });
      dropped.forEach(h => {
        console.log(`[LOG-CONTROLE][TRIP-CALC]   ❌ SATELLITE : ${steps[h.idx].name} (rating=${h.rating}, sd=${h.suggestedDays})`);
      });
    }

    const totalWeight = activeHubs.reduce((sum, h) => sum + getWeight(h), 0);
    let allocatedNights = 0;
    console.log(`[LOG-CONTROLE][TRIP-CALC] Total weight (suggestedDays×2 + ratingBonus): ${totalWeight.toFixed(2)}`);

    // Première passe : allocation proportionnelle avec floor (sur activeHubs uniquement)
    activeHubs.forEach(hub => {
      const proportion = getWeight(hub) / totalWeight;
      const nights = Math.floor(targetNights * proportion);
      const finalNights = Math.max(nights, CONFIG.MIN_NIGHTS_PER_HUB);

      steps[hub.idx].nights = finalNights;
      allocatedNights += finalNights;

      console.log(`[LOG-CONTROLE][TRIP-CALC]   ${steps[hub.idx].name}: sd=${hub.suggestedDays} → ${(proportion*100).toFixed(1)}% → ${nights} nuits (min ${CONFIG.MIN_NIGHTS_PER_HUB}) → ${finalNights} nuits`);
    });

    // Deuxième passe : répartir le reste sur les meilleurs hubs actifs
    let remainingNights = targetNights - allocatedNights;
    console.log(`[LOG-CONTROLE][TRIP-CALC] Après 1ère passe: ${allocatedNights} allouées, ${remainingNights} restantes`);

    // Trier par suggestedDays décroissant (puis rating en départage)
    const sortedHubs = [...activeHubs].sort((a, b) =>
      (b.suggestedDays - a.suggestedDays) || (b.rating - a.rating)
    );

    if (remainingNights > 0) {
      console.log(`[LOG-CONTROLE][TRIP-CALC] 2ème passe: +${remainingNights} nuit(s) sur les meilleurs hubs`);
    }

    for (let i = 0; remainingNights > 0 && i < sortedHubs.length; i++) {
      const hub = sortedHubs[i % sortedHubs.length];
      steps[hub.idx].nights += 1;
      console.log(`[LOG-CONTROLE][TRIP-CALC]   +1 nuit → ${steps[hub.idx].name} (total: ${steps[hub.idx].nights})`);
      remainingNights--;
      allocatedNights++;
    }
    
    // Log résultat final
    console.log('[LOG-CONTROLE][TRIP-CALC] ========== RÉSULTAT FINAL ==========');
    console.log(`[LOG-CONTROLE][TRIP-CALC] Total: ${allocatedNights} nuits allouées sur ${targetNights} demandées`);
    steps.forEach((step, i) => {
      const type = step._isHub ? '🏨 HUB' : (step._isSatellite ? '📍 Satellite' : '📍');
      console.log(`  ${i}: ${step.name} - ${step.nights} nuit(s) ${type}`);
    });
    
    return allocatedNights;
  }

  /**
   * Vérifie et corrige la cohérence des nuits
   * - Satellites = 0 nuit
   * - Au moins 1 nuit par hub (y compris dernier si c'est un vrai hub)
   */
  function validateNights(state) {
    if (!state?.steps) return;
    
    const n = state.steps.length;
    
    state.steps.forEach((step, i) => {
      // Satellites = 0
      if (step._isSatellite) {
        step.nights = 0;
        return;
      }
      
      // Dernière étape : garder les nuits si c'est un vrai hub
      if (i === n - 1) {
        const rating = Number(step.rating || step.score || 0);
        const suggestedDays = Number(step.suggested_days || step.suggestedDays || 0);
        // Condition : rating renseigné (>= 5) OU suggested_days >= 1
        const isRealHub = step._isHub && (rating >= 5 || suggestedDays >= 1);
        
        if (!isRealHub) {
          step.nights = 0;
        }
        return;
      }
      
      // Hubs = au moins 1
      if (step._isHub && step.nights < 1) {
        step.nights = 1;
      }
    });
  }

  // ============================================================
  // EXPORT
  // ============================================================

  const ORT_TRIP_CALC = {
    // Config
    CONFIG,
    
    // Utilitaires
    haversineDistance,
    getDistanceBetweenSteps,
    addDays,
    formatDateISO,
    formatDateShort,
    sumNights,
    
    // Dates
    getStartDate,
    stepDateRange,
    getStay22Dates,
    getDateTooltip,
    
    // Nuits
    groupNightsByPlace,
    determineNightsFromVisitTime,
    calculateHubScore,
    identifyGroups,
    autoCalculateNights,
    validateNights
  };

  // Export global
  global.ORT_TRIP_CALC = ORT_TRIP_CALC;
  
  // Raccourcis pour compatibilité avec le code existant
  global.haversineDistance = haversineDistance;
  global.addDays = addDays;
  global.formatDateISO = formatDateISO;
  global.getStartDate = function() {
    return ORT_TRIP_CALC.getStartDate(window.state);
  };
  global.stepDateRange = function(idx) {
    return ORT_TRIP_CALC.stepDateRange(window.state, idx);
  };
  global.getStay22Dates = function(stepIndex) {
    return ORT_TRIP_CALC.getStay22Dates(window.state, stepIndex);
  };
  global.getStay22CheckinDate = function(stepIndex) {
    const dates = ORT_TRIP_CALC.getStay22Dates(window.state, stepIndex);
    return dates.checkin;
  };
  global.autoCalculateNights = function(targetNights) {
    if (window.state) {
      return ORT_TRIP_CALC.autoCalculateNights(window.state, targetNights);
    }
    return 0;
  };
  global.groupNightsByPlace = function(steps) {
    return ORT_TRIP_CALC.groupNightsByPlace(steps || window.state?.steps);
  };
  global.sumNights = function() {
    if (window.state?.steps) {
      return ORT_TRIP_CALC.sumNights(window.state.steps);
    }
    return 0;
  };

  console.log('[ORT-TRIP-CALC] ✅ Module chargé');

})(typeof window !== 'undefined' ? window : this);
