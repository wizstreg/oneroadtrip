/**
 * OneRoadTrip - Module d'export PDF v4 BeeTrip
 * 
 * Design éditorial luxe :
 * - Page de garde : grande photo de fond + titre en overlay
 * - Résumé : tableau élégant avec soulignement doré
 * - Carte : capture Leaflet avec markers numérotés
 * - Étapes : photo large, visites, activités, hébergement
 * 
 * Approche : HTML + CSS @media print + window.print()
 * Format : A4 paysage
 */

(function(window) {
  'use strict';

  // ============================================================
  // CONFIGURATION
  // ============================================================
  
  const CONFIG = {
    // Couleurs luxe
    primaryDark: '#0f172a',
    primaryLight: '#1e3a5f',
    accent: '#d4a574',
    accentLight: '#e8c9a8',
    textDark: '#1e293b',
    textMuted: '#64748b',
    bgWarm: '#faf8f5',
    bgLight: '#f8fafc',
    
    // Carte
    mapWidth: 800,
    mapHeight: 500,
    markerColor: '0f172a',
    routeColor: 'd4a574',
    routeWidth: 4,
    
    // Options par défaut
    defaultOptions: {
      includeSummary: true,
      includeMap: true,
      includeDetails: true,
      includeVisits: true,
      includeActivities: true,
      includeHotels: false,
      selectedPhotos: []
    }
  };

  // ============================================================
  // UTILITAIRES
  // ============================================================
  
  /**
   * Optimise l'URL d'une image pour haute résolution
   */
  function optimizeImageUrl(url) {
    if (!url) return url;
    
    // iStockPhoto / Getty : URLs signées, ne pas toucher !
    if (url.includes('istockphoto.com') || url.includes('gettyimages.com')) {
      // Ces URLs ont une signature cryptographique (paramètre c=), on ne peut pas changer la taille
      return url;
    }
    
    // Unsplash : forcer haute résolution
    if (url.includes('unsplash.com')) {
      const base = url.split('?')[0];
      return `${base}?w=1600&q=90&fm=jpg&fit=crop`;
    }
    
    // Pexels : forcer grande taille
    if (url.includes('pexels.com')) {
      return url.replace(/\?.*$/, '') + '?auto=compress&cs=tinysrgb&w=1600&h=1200&dpr=2';
    }
    
    // Wikimedia : forcer 1600px
    if (url.includes('wikimedia.org') || url.includes('wikipedia.org')) {
      return url.replace(/\/\d+px-/, '/1600px-');
    }
    
    // Pixabay
    if (url.includes('pixabay.com')) {
      return url.replace(/_\d+\./, '_1280.');
    }
    
    // Google Photos / Blogger
    if (url.includes('googleusercontent.com') || url.includes('blogspot.com')) {
      return url.replace(/=s\d+/, '=s1600').replace(/=w\d+-h\d+/, '=w1600-h1200');
    }
    
    // Cloudinary
    if (url.includes('cloudinary.com')) {
      return url.replace(/\/upload\/.*?\//, '/upload/q_90,w_1600,c_limit/');
    }
    
    // Imgix
    if (url.includes('imgix.net')) {
      const base = url.split('?')[0];
      return `${base}?w=1600&q=90&auto=format`;
    }
    
    // Flickr
    if (url.includes('flickr.com') || url.includes('staticflickr.com')) {
      // _m = small, _n = small 320, _z = medium 640, _c = medium 800, _b = large 1024, _h = large 1600
      return url.replace(/_[mnszcq]\./, '_b.').replace(/_[mnszcq]_d\./, '_b_d.');
    }
    
    // Shutterstock previews
    if (url.includes('shutterstock.com')) {
      return url.replace(/\/\d+x\d+\//, '/1500x1500/');
    }
    
    // Par défaut, retourner l'URL originale
    return url;
  }
  
  /**
   * Précharge une image et retourne une promesse
   */
  function preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error(`Failed to load: ${url}`));
      img.src = url;
    });
  }
  
  function formatDate(dateStr, lang = 'fr') {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' });
  }
  
  function formatDateShort(dateStr, lang = 'fr') {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' });
  }
  
  function calculateEndDate(startDate, totalNights) {
    if (!startDate) return '';
    const d = new Date(startDate);
    d.setDate(d.getDate() + totalNights);
    return d.toISOString().split('T')[0];
  }
  
  function addDays(dateStr, days) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
  
  function getCountryName(iso2, lang = 'fr') {
    try {
      return new Intl.DisplayNames([lang], { type: 'region' }).of(iso2.toUpperCase()) || iso2;
    } catch { return iso2; }
  }
  
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // ============================================================
  // CAPTURE CARTE - STRATÉGIES MULTIPLES
  // ============================================================

  /**
   * Génère une image de carte statique avec fallbacks automatiques
   */
  async function generateStaticMap(state) {
    if (!state || !state.steps || state.steps.length === 0) {
      console.error('[PDF] No steps data for map');
      return null;
    }

    const coords = state.steps
      .filter(s => s.lat && s.lon)
      .map((s, i) => ({ lat: s.lat, lon: s.lon, name: s.name, nights: s.nights, idx: i }));
    
    if (coords.length < 2) {
      console.warn('[PDF] Not enough coordinates for map');
      return null;
    }

    const bounds = calculateBounds(coords);

    console.log('[PDF] Generating static map for', coords.length, 'steps');

    // Stratégies dans l'ordre de préférence
    const strategies = [
      { name: 'Leaflet Capture', fn: () => captureLeafletMap(coords) },
      { name: 'OSM Static', fn: () => generateOSMStaticMap(coords, bounds) },
      { name: 'SVG Fallback', fn: () => generateSVGMap(coords, bounds) }
    ];

    for (const strategy of strategies) {
      try {
        console.log(`[PDF] Trying ${strategy.name}...`);
        const result = await strategy.fn();
        if (result) {
          console.log(`[PDF] ✅ ${strategy.name} success`);
          return result;
        }
      } catch (error) {
        console.warn(`[PDF] ❌ ${strategy.name} failed:`, error.message);
      }
    }

    console.error('[PDF] All map strategies failed');
    return null;
  }

  /**
   * Stratégie 1: Capture Leaflet avec leaflet-image + labels anti-collision
   */
  async function captureLeafletMap(coords) {
    console.log('[PDF MAP] Début capture Leaflet, coords:', coords?.length);
    const mapElement = document.getElementById('map');
    
    if (!mapElement || !window.map) {
      throw new Error('Carte Leaflet non trouvée');
    }
    
    const map = window.map;
    
    // Sauvegarder l'état actuel
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    
    // Masquer les contrôles
    const controls = document.querySelectorAll('.leaflet-control-container, .leaflet-control');
    const hiddenControls = [];
    controls.forEach(el => {
      if (el.style.display !== 'none') {
        hiddenControls.push({ el, display: el.style.display });
        el.style.display = 'none';
      }
    });
    
    // Retirer les markers (on les redessinera)
    const markerLayers = [];
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        markerLayers.push(layer);
        map.removeLayer(layer);
      }
    });
    
    // Centrer sur l'itinéraire
    const latLngs = coords.map(c => [c.lat, c.lon]);
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [80, 80], animate: false, maxZoom: 12 });
    map.invalidateSize({ pan: false, animate: false });
    
    // Attendre le rendu
    await new Promise(r => setTimeout(r, 1500));
    
    let dataUrl = null;
    
    try {
      // Charger leaflet-image si nécessaire
      if (!window.leafletImage) {
        await loadScript('https://unpkg.com/leaflet-image@0.4.0/leaflet-image.js');
      }
      
      dataUrl = await new Promise((resolve, reject) => {
        setTimeout(() => {
          window.leafletImage(map, (err, canvas) => {
            if (err) reject(err);
            else {
              // Dessiner la route et les markers avec labels
              drawRouteOnCanvas(canvas, map);
              drawMarkersWithLabelsOnCanvas(canvas, coords, map);
              resolve(canvas.toDataURL('image/png'));
            }
          });
        }, 1000);
      });
    } catch (e) {
      console.warn('[PDF MAP] leaflet-image failed:', e.message);
      throw e;
    } finally {
      // Restaurer
      markerLayers.forEach(m => map.addLayer(m));
      hiddenControls.forEach(({ el, display }) => el.style.display = display);
      map.setView(currentCenter, currentZoom, { animate: false });
    }
    
    return dataUrl;
  }

  /**
   * Dessine la route sur le canvas
   */
  function drawRouteOnCanvas(canvas, map) {
    const ctx = canvas.getContext('2d');
    let routeCoords = null;
    
    map.eachLayer(layer => {
      if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
        routeCoords = layer.getLatLngs();
      }
    });
    
    if (!routeCoords || routeCoords.length < 2) return;
    if (Array.isArray(routeCoords[0]) && routeCoords[0][0]?.lat) {
      routeCoords = routeCoords.flat();
    }
    
    const size = map.getSize();
    const scaleX = canvas.width / size.x;
    const scaleY = canvas.height / size.y;
    
    const toCanvasPoint = (latlng) => {
      const point = map.latLngToContainerPoint(latlng);
      return { x: point.x * scaleX, y: point.y * scaleY };
    };
    
    // Route avec ombre
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 6 * scaleX;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const first = toCanvasPoint(routeCoords[0]);
    ctx.moveTo(first.x + 2, first.y + 2);
    for (let i = 1; i < routeCoords.length; i++) {
      const pt = toCanvasPoint(routeCoords[i]);
      ctx.lineTo(pt.x + 2, pt.y + 2);
    }
    ctx.stroke();
    
    // Route principale
    ctx.strokeStyle = '#' + CONFIG.routeColor;
    ctx.lineWidth = 4 * scaleX;
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < routeCoords.length; i++) {
      const pt = toCanvasPoint(routeCoords[i]);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
  }

  /**
   * Dessine les markers avec labels anti-collision
   */
  function drawMarkersWithLabelsOnCanvas(canvas, coords, map) {
    if (!coords || coords.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const size = map.getSize();
    const scaleX = canvas.width / size.x;
    const scaleY = canvas.height / size.y;
    
    const toCanvasPoint = (lat, lon) => {
      const point = map.latLngToContainerPoint([lat, lon]);
      return { x: point.x * scaleX, y: point.y * scaleY };
    };
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Paramètres
    const labelDistance = 70 * scaleX;
    const margin = 15 * scaleX;
    const markerRadius = 14 * scaleX;
    const fontFamily = 'Segoe UI, Roboto, Arial, sans-serif';
    ctx.font = `${10 * scaleX}px ${fontFamily}`;
    
    // Positions des markers
    const markerPositions = coords.map(step => {
      const point = toCanvasPoint(step.lat, step.lon);
      return { x: point.x, y: point.y, radius: markerRadius + 8 * scaleX };
    });
    
    // Labels placés (anti-collision)
    const placedLabels = [];
    
    const rectsOverlap = (r1, r2) => {
      return !(r1.right < r2.left || r1.left > r2.right || 
               r1.bottom < r2.top || r1.top > r2.bottom);
    };
    
    const collidesWithMarker = (labelX, labelY, boxWidth, boxHeight) => {
      for (const m of markerPositions) {
        const dx = Math.abs(labelX - m.x);
        const dy = Math.abs(labelY - m.y);
        if (dx < boxWidth/2 + m.radius && dy < boxHeight/2 + m.radius) return true;
      }
      return false;
    };
    
    const collidesWithLabels = (rect) => {
      for (const placed of placedLabels) {
        if (rectsOverlap(rect, placed)) return true;
      }
      return false;
    };
    
    // Calculer positions des labels
    const labelPositions = [];
    
    coords.forEach((step, idx) => {
      const point = toCanvasPoint(step.lat, step.lon);
      const label = step.nights ? `${step.name} (${step.nights}n)` : step.name;
      const textWidth = ctx.measureText(label).width;
      const boxHeight = 18 * scaleX;
      const padding = 6 * scaleX;
      const boxWidth = textWidth + padding * 2;
      
      // Essayer plusieurs angles et distances
      const baseAngle = Math.atan2(point.y - centerY, point.x - centerX);
      const angles = [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2, 1.6, -1.6, Math.PI, 2.5, -2.5];
      const distances = [labelDistance, labelDistance * 1.3, labelDistance * 1.6, labelDistance * 0.8];
      
      let bestLabelX = point.x + labelDistance;
      let bestLabelY = point.y;
      let found = false;
      
      outerLoop:
      for (const dist of distances) {
        for (const angleOffset of angles) {
          const angle = baseAngle + angleOffset;
          let labelX = point.x + Math.cos(angle) * dist;
          let labelY = point.y + Math.sin(angle) * dist;
          
          // Contraindre dans les limites
          if (labelX - boxWidth/2 < margin) labelX = margin + boxWidth/2;
          if (labelX + boxWidth/2 > canvas.width - margin) labelX = canvas.width - margin - boxWidth/2;
          if (labelY - boxHeight/2 < margin) labelY = margin + boxHeight/2;
          if (labelY + boxHeight/2 > canvas.height - margin) labelY = canvas.height - margin - boxHeight/2;
          
          const rect = {
            left: labelX - boxWidth/2,
            right: labelX + boxWidth/2,
            top: labelY - boxHeight/2,
            bottom: labelY + boxHeight/2
          };
          
          if (!collidesWithMarker(labelX, labelY, boxWidth, boxHeight) &&
              !collidesWithLabels(rect)) {
            bestLabelX = labelX;
            bestLabelY = labelY;
            found = true;
            break outerLoop;
          }
        }
      }
      
      placedLabels.push({
        left: bestLabelX - boxWidth/2,
        right: bestLabelX + boxWidth/2,
        top: bestLabelY - boxHeight/2,
        bottom: bestLabelY + boxHeight/2
      });
      
      labelPositions.push({
        step, idx, markerX: point.x, markerY: point.y,
        labelX: bestLabelX, labelY: bestLabelY,
        label, textWidth, boxWidth, boxHeight, padding, found
      });
    });
    
    // Dessiner lignes de connexion
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1 * scaleX;
    ctx.setLineDash([4 * scaleX, 3 * scaleX]);
    
    labelPositions.forEach(pos => {
      if (pos.step.name) {
        ctx.beginPath();
        ctx.moveTo(pos.markerX, pos.markerY);
        ctx.lineTo(pos.labelX, pos.labelY);
        ctx.stroke();
      }
    });
    ctx.setLineDash([]);
    
    // Dessiner markers
    labelPositions.forEach(pos => {
      const radius = markerRadius;
      const num = pos.idx + 1;
      
      // Ombre
      ctx.beginPath();
      ctx.arc(pos.markerX + 2, pos.markerY + 2, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fill();
      
      // Cercle blanc
      ctx.beginPath();
      ctx.arc(pos.markerX, pos.markerY, radius + 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      
      // Cercle coloré
      ctx.beginPath();
      ctx.arc(pos.markerX, pos.markerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = CONFIG.primaryDark;
      ctx.fill();
      
      // Numéro
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${12 * scaleX}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num.toString(), pos.markerX, pos.markerY + 1);
    });
    
    // Dessiner labels
    ctx.font = `${10 * scaleX}px ${fontFamily}`;
    
    labelPositions.forEach(pos => {
      if (!pos.step.name) return;
      
      const boxX = pos.labelX - pos.boxWidth / 2;
      const boxY = pos.labelY - pos.boxHeight / 2;
      const cornerRadius = 4 * scaleX;
      
      // Ombre
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      roundRect(ctx, boxX + 2, boxY + 2, pos.boxWidth, pos.boxHeight, cornerRadius);
      ctx.fill();
      
      // Fond
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      roundRect(ctx, boxX, boxY, pos.boxWidth, pos.boxHeight, cornerRadius);
      ctx.fill();
      
      // Bordure
      ctx.strokeStyle = CONFIG.primaryDark;
      ctx.lineWidth = 1 * scaleX;
      roundRect(ctx, boxX, boxY, pos.boxWidth, pos.boxHeight, cornerRadius);
      ctx.stroke();
      
      // Texte
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pos.label, pos.labelX, pos.labelY);
    });
    
    console.log('[PDF MAP] ✅ Markers + labels dessinés:', coords.length);
  }

  /**
   * Rectangle arrondi
   */
  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Stratégie 2: OSM Static Maps (gratuit, sans clé)
   */
  async function generateOSMStaticMap(coords, bounds) {
    const center = {
      lat: (bounds.minLat + bounds.maxLat) / 2,
      lon: (bounds.minLon + bounds.maxLon) / 2
    };
    const zoom = calculateZoomLevel(bounds);

    const markers = coords.map((c, i) => 
      `${c.lat},${c.lon},lightblue${Math.min(i + 1, 99)}`
    ).join('|');

    const url = `https://staticmap.openstreetmap.de/staticmap.php?` +
      `center=${center.lat},${center.lon}&zoom=${zoom}` +
      `&size=900x600` +
      `&markers=${markers}&maptype=mapnik`;

    return await fetchImageAsDataURL(url);
  }

  /**
   * Stratégie 3: SVG Fallback (toujours disponible)
   */
  function generateSVGMap(coords, bounds) {
    console.log('[PDF MAP SVG] Génération carte SVG locale...');
    
    const width = 900;
    const height = 600;
    const padding = 60;
    
    const latRange = Math.max(bounds.maxLat - bounds.minLat, 0.01);
    const lonRange = Math.max(bounds.maxLon - bounds.minLon, 0.01);
    
    const toX = (lon) => padding + (lon - bounds.minLon) / lonRange * (width - 2 * padding);
    const toY = (lat) => height - padding - (lat - bounds.minLat) / latRange * (height - 2 * padding);
    
    // Path de la route
    const pathD = coords.map((c, i) => 
      `${i === 0 ? 'M' : 'L'} ${toX(c.lon).toFixed(1)} ${toY(c.lat).toFixed(1)}`
    ).join(' ');
    
    // Labels avec positionnement simple
    const labels = coords.map((c, i) => {
      const x = toX(c.lon);
      const y = toY(c.lat);
      const labelX = x + 25;
      const labelY = y - 8;
      const label = c.nights ? `${c.name} (${c.nights}n)` : c.name;
      return `
        <line x1="${x}" y1="${y}" x2="${labelX}" y2="${labelY}" stroke="#888" stroke-width="1" stroke-dasharray="3,2"/>
        <rect x="${labelX - 2}" y="${labelY - 10}" width="${label.length * 6 + 8}" height="18" rx="3" fill="white" stroke="${CONFIG.primaryDark}" stroke-width="0.5"/>
        <text x="${labelX + label.length * 3 + 2}" y="${labelY + 2}" text-anchor="middle" fill="#1a1a1a" font-size="9" font-family="Arial">${label}</text>
      `;
    }).join('');
    
    // Markers
    const markers = coords.map((c, i) => {
      const x = toX(c.lon);
      const y = toY(c.lat);
      return `
        <circle cx="${x + 2}" cy="${y + 2}" r="14" fill="rgba(0,0,0,0.2)"/>
        <circle cx="${x}" cy="${y}" r="16" fill="white"/>
        <circle cx="${x}" cy="${y}" r="14" fill="${CONFIG.primaryDark}"/>
        <text x="${x}" y="${y + 4}" text-anchor="middle" fill="white" font-size="11" font-weight="bold" font-family="Arial">${i + 1}</text>
      `;
    }).join('');
    
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#e8f4ea"/>
            <stop offset="100%" style="stop-color:#d4e8d7"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGrad)"/>
        <rect x="10" y="10" width="${width-20}" height="${height-20}" fill="none" stroke="#ccc" stroke-width="1" rx="8"/>
        <path d="${pathD}" fill="none" stroke="${CONFIG.primaryDark}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"/>
        <path d="${pathD}" fill="none" stroke="${CONFIG.primaryDark}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="15,8"/>
        ${labels}
        ${markers}
        <text x="${width/2}" y="${height - 12}" text-anchor="middle" fill="#666" font-size="10" font-family="Arial">Carte générée automatiquement • ${coords.length} étapes</text>
      </svg>
    `;
    
    const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    console.log('[PDF MAP SVG] ✅ SVG généré');
    return dataUrl;
  }

  // ============================================================
  // UTILITAIRES CARTE
  // ============================================================

  async function fetchImageAsDataURL(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function calculateBounds(coords) {
    const lats = coords.map(s => parseFloat(s.lat)).filter(v => !isNaN(v));
    const lons = coords.map(s => parseFloat(s.lon)).filter(v => !isNaN(v));
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLon: Math.min(...lons),
      maxLon: Math.max(...lons)
    };
  }

  function calculateZoomLevel(bounds) {
    const maxDiff = Math.max(bounds.maxLat - bounds.minLat, bounds.maxLon - bounds.minLon);
    if (maxDiff > 10) return 5;
    if (maxDiff > 5) return 6;
    if (maxDiff > 2) return 7;
    if (maxDiff > 1) return 8;
    if (maxDiff > 0.5) return 9;
    if (maxDiff > 0.2) return 10;
    return 11;
  }

  // ============================================================
  // STYLES CSS
  // ============================================================
  
  function getStyles() {
    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        
        * { 
          box-sizing: border-box; 
          margin: 0; 
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* Qualité d'image optimisée */
        img {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          image-rendering: high-quality;
          -ms-interpolation-mode: bicubic;
        }
        
        @page {
          size: 297mm 210mm landscape;
          margin: 0;
        }
        
        html, body {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: ${CONFIG.textDark};
          background: white;
          width: 297mm;
        }
        
        /* ============================================
           PAGE DE GARDE - Photo plein écran + overlay
           ============================================ */
        .cover-page {
          position: relative;
          width: 297mm;
          height: 210mm;
          overflow: hidden;
          page-break-after: always;
          break-after: page;
        }
        
        .cover-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 297mm;
          height: 210mm;
        }
        
        .cover-bg img {
          width: 297mm;
          height: 210mm;
          object-fit: cover;
          display: block;
        }
        
        .cover-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            to bottom,
            rgba(15, 23, 42, 0.3) 0%,
            rgba(15, 23, 42, 0.1) 40%,
            rgba(15, 23, 42, 0.7) 100%
          );
        }
        
        .cover-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 40px 50px;
          color: white;
        }
        
        .cover-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 42pt;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 12px;
          text-shadow: 0 2px 20px rgba(0,0,0,0.5);
        }
        
        .cover-subtitle {
          font-size: 18pt;
          font-weight: 300;
          opacity: 0.95;
          margin-bottom: 20px;
        }
        
        .cover-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 30px;
          font-size: 12pt;
        }
        
        .cover-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.15);
          padding: 8px 16px;
          border-radius: 20px;
        }
        
        .cover-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 25px 40px;
          display: flex;
          justify-content: space-between;
          color: white;
        }
        
        .cover-logo {
          font-family: 'Playfair Display', serif;
          font-size: 16pt;
          font-weight: 700;
        }
        
        /* ============================================
           PAGES DE CONTENU
           ============================================ */
        .page {
          width: 297mm;
          height: 210mm;
          min-height: 210mm;
          max-height: 210mm;
          padding: 15mm 20mm;
          background: white;
          page-break-after: always;
          break-after: page;
          overflow: hidden;
          position: relative;
        }
        
        .page-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22pt;
          color: ${CONFIG.primaryDark};
          text-align: center;
          margin-bottom: 6px;
        }
        
        .page-title-underline {
          width: 80px;
          height: 4px;
          background: ${CONFIG.accent};
          margin: 0 auto 20px;
          border-radius: 2px;
        }
        
        /* ============================================
           TABLEAU RÉSUMÉ
           ============================================ */
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10pt;
        }
        
        .summary-table thead {
          background: ${CONFIG.primaryDark} !important;
          color: white !important;
        }
        
        .summary-table th {
          padding: 10px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 9pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: ${CONFIG.primaryDark} !important;
          color: white !important;
        }
        
        .summary-table tbody tr {
          border-bottom: 1px solid #e2e8f0;
        }
        
        .summary-table tbody tr:nth-child(even) {
          background: ${CONFIG.bgLight} !important;
        }
        
        .summary-table td {
          padding: 8px;
          vertical-align: middle;
        }
        
        .summary-table .step-num {
          width: 35px;
          text-align: center;
          font-weight: 700;
          color: ${CONFIG.primaryDark};
        }
        
        .summary-table .step-name {
          font-weight: 600;
          color: ${CONFIG.primaryDark};
        }
        
        .summary-table .total-row {
          background: ${CONFIG.primaryDark} !important;
          color: white !important;
          font-weight: 700;
        }
        
        .summary-table .total-row td {
          padding: 12px 8px;
          background: ${CONFIG.primaryDark} !important;
          color: white !important;
        }
        
        /* ============================================
           CARTE - Plus grande
           ============================================ */
        .map-container {
          text-align: center;
          padding: 10px 0;
        }
        
        .map-container img {
          width: 100%;
          max-width: 260mm;
          max-height: 160mm;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        /* ============================================
           DÉTAIL DES ÉTAPES - 1 étape par page
           ============================================ */
        .step-block {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .step-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 3px solid ${CONFIG.accent};
        }
        
        .step-number {
          width: 40px;
          height: 40px;
          min-width: 40px;
          background: ${CONFIG.primaryDark} !important;
          color: white !important;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14pt;
        }
        
        .step-info {
          flex: 1;
        }
        
        .step-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 16pt;
          color: ${CONFIG.primaryDark};
          margin-bottom: 2px;
        }
        
        .step-meta {
          font-size: 10pt;
          color: ${CONFIG.textMuted};
        }
        
        .step-photo {
          width: 100%;
          height: 90mm;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 12px;
          display: block;
        }
        
        .step-content {
          display: flex;
          gap: 15px;
        }
        
        .content-box {
          flex: 1;
          background: ${CONFIG.bgLight} !important;
          padding: 12px;
          border-radius: 8px;
          border-left: 4px solid ${CONFIG.accent} !important;
        }
        
        .content-box h4 {
          font-size: 10pt;
          color: ${CONFIG.primaryDark};
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .content-box ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .content-box li {
          padding: 4px 0;
          font-size: 9pt;
          border-bottom: 1px dashed #e2e8f0;
          padding-left: 12px;
          position: relative;
        }
        
        .content-box li:last-child {
          border-bottom: none;
        }
        
        .content-box li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: ${CONFIG.accent};
          font-weight: bold;
        }
        
        .hotel-box {
          background: #fef3c7 !important;
          border-left-color: #f59e0b !important;
        }
        
        .hotel-box h4 {
          color: #92400e;
        }
        
        .hotel-box .hotel-name {
          font-size: 11pt;
          font-weight: 600;
          color: #78350f;
        }
        
        .hotel-box .hotel-nights {
          font-size: 9pt;
          color: #92400e;
        }
        
        /* ============================================
           BOUTON FLOTTANT (écran seulement)
           ============================================ */
        .print-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: ${CONFIG.primaryDark};
          color: ${CONFIG.accent};
          border: none;
          padding: 15px 30px;
          border-radius: 30px;
          font-size: 14pt;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 5px 25px rgba(15, 23, 42, 0.4);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 9999;
          transition: transform 0.2s;
        }
        
        .print-btn:hover {
          transform: scale(1.05);
        }
        
        /* ============================================
           ÉCRAN
           ============================================ */
        @media screen {
          body {
            padding: 20px;
            background: #f0f0f0;
          }
          
          .page, .cover-page {
            margin: 0 auto 30px;
            box-shadow: 0 5px 30px rgba(0,0,0,0.15);
            border-radius: 4px;
          }
        }
        
        /* ============================================
           IMPRESSION
           ============================================ */
        @media print {
          html, body {
            width: 297mm !important;
            background: white !important;
          }
          
          body {
            padding: 0 !important;
          }
          
          .print-btn {
            display: none !important;
          }
          
          .page, .cover-page {
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      </style>
    `;
  }

  // ============================================================
  // GÉNÉRATION HTML
  // ============================================================
  
  function generateCoverPage(state, options = {}) {
    const lang = document.documentElement.lang || 'fr';
    const countryName = getCountryName(state.country || 'XX', lang);
    const totalNights = state.steps.reduce((s, st) => s + (st.nights || 0), 0);
    const totalKm = state.steps.reduce((s, st) => s + (parseFloat(st._osrmDistanceKm) || parseFloat(st.distanceKm) || 0), 0);
    const startDate = state.startDate || '';
    const endDate = calculateEndDate(startDate, totalNights);
    
    // Photo de couverture : première sélectionnée ou première de l'itinéraire
    let coverPhoto = '';
    const selectedPhotos = options.selectedPhotos || [];
    
    if (selectedPhotos.length > 0) {
      coverPhoto = optimizeImageUrl(selectedPhotos[0]);
    } else {
      // Fallback : première photo de l'itinéraire
      for (const step of state.steps) {
        if (Array.isArray(step.images) && step.images[0]) {
          coverPhoto = optimizeImageUrl(step.images[0]);
          break;
        }
      }
    }
    
    // Si toujours pas de photo, image par défaut
    if (!coverPhoto) {
      coverPhoto = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80';
    }
    
    return `
      <div class="cover-page">
        <div class="cover-bg">
          <img src="${coverPhoto}" alt="Cover" crossorigin="anonymous">
        </div>
        <div class="cover-overlay"></div>
        
        <div class="cover-header">
          <div class="cover-logo">OneRoadTrip</div>
          <div>www.oneroadtrip.fr</div>
        </div>
        
        <div class="cover-content">
          <h1 class="cover-title">${state.title || 'Mon Roadtrip'}</h1>
          <div class="cover-subtitle">${countryName}</div>
          <div class="cover-meta">
            <div class="cover-meta-item">📅 ${formatDate(startDate, lang)} → ${formatDate(endDate, lang)}</div>
            <div class="cover-meta-item">🌙 ${totalNights} nuits</div>
            <div class="cover-meta-item">📍 ${state.steps.length} étapes</div>
            <div class="cover-meta-item">🚗 ${Math.round(totalKm)} km</div>
          </div>
        </div>
      </div>
    `;
  }
  
  function generateSummaryPage(state) {
    const lang = document.documentElement.lang || 'fr';
    
    const getDistance = (step) => step._osrmDistanceKm || step.distanceKm || step.to_next_leg?.distance_km || 0;
    const getDuration = (step) => {
      const min = step._osrmDurationMin || step.to_next_leg?.drive_min || 0;
      if (min === 0) return '—';
      const h = Math.floor(min / 60);
      const m = min % 60;
      return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${min}min`;
    };
    
    let totalKm = 0, totalMin = 0, totalNights = 0;
    
    const rows = state.steps.map((step, idx) => {
      const dist = getDistance(step);
      const durMin = step._osrmDurationMin || step.to_next_leg?.drive_min || 0;
      totalKm += dist;
      totalMin += durMin;
      totalNights += step.nights || 0;
      
      return `
        <tr>
          <td class="step-num">${idx + 1}</td>
          <td class="step-name">${step.name}</td>
          <td>${dist > 0 ? Math.round(dist) + ' km' : '—'}</td>
          <td>${getDuration(step)}</td>
          <td style="text-align:center">${step.nights || 0}</td>
        </tr>
      `;
    }).join('');
    
    const totalH = Math.floor(totalMin / 60);
    const totalM = totalMin % 60;
    
    return `
      <div class="page">
        <h2 class="page-title">Résumé de l'itinéraire</h2>
        <div class="page-title-underline"></div>
        
        <table class="summary-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Étape</th>
              <th>Distance</th>
              <th>Durée</th>
              <th>Nuits</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr class="total-row">
              <td colspan="2">TOTAL</td>
              <td>${Math.round(totalKm)} km</td>
              <td>${totalH}h${totalM.toString().padStart(2, '0')}</td>
              <td style="text-align:center">${totalNights}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }
  
  function generateMapPage(mapImage) {
    if (!mapImage) {
      return `
        <div class="page">
          <h2 class="page-title">Carte de l'itinéraire</h2>
          <div class="page-title-underline"></div>
          <p style="text-align:center; color:${CONFIG.textMuted}; padding:50px;">
            Carte non disponible. Utilisez l'aperçu pour visualiser l'itinéraire.
          </p>
        </div>
      `;
    }
    
    return `
      <div class="page">
        <h2 class="page-title">Carte de l'itinéraire</h2>
        <div class="page-title-underline"></div>
        <div class="map-container">
          <img src="${mapImage}" alt="Carte">
        </div>
      </div>
    `;
  }
  
  function generateDetailPages(state, options) {
    const lang = document.documentElement.lang || 'fr';
    let startDate = state.startDate || '';
    let html = '';
    
    // Répartir les photos sélectionnées sur les étapes
    const selectedPhotos = options.selectedPhotos || [];
    const stepsWithPhotos = [];
    
    if (selectedPhotos.length > 0) {
      // Distribuer les photos sur les étapes
      const photosPerStep = Math.ceil(selectedPhotos.length / state.steps.length);
      let photoIdx = 0;
      
      state.steps.forEach((step, idx) => {
        const stepPhotos = [];
        for (let i = 0; i < photosPerStep && photoIdx < selectedPhotos.length; i++) {
          stepPhotos.push(selectedPhotos[photoIdx]);
          photoIdx++;
        }
        stepsWithPhotos[idx] = stepPhotos;
      });
    }
    
    state.steps.forEach((step, idx) => {
      const dateStr = startDate ? formatDateShort(startDate, lang) : '';
      const nights = step.nights || 0;
      
      // Photo : priorité aux photos sélectionnées, sinon photo de l'étape si disponible
      let photo = '';
      if (stepsWithPhotos[idx] && stepsWithPhotos[idx].length > 0) {
        photo = optimizeImageUrl(stepsWithPhotos[idx][0]); // Première photo assignée à cette étape
      } else if (selectedPhotos.length === 0) {
        // Aucune sélection = utiliser les photos de l'itinéraire par défaut
        const rawPhoto = (Array.isArray(step.images) && step.images[0]) || '';
        photo = optimizeImageUrl(rawPhoto);
      }
      
      // Visites
      let visitsHtml = '';
      if (options.includeVisits) {
        const visits = Array.isArray(step.visits) ? step.visits : [];
        const visitTexts = visits.map(v => {
          if (typeof v === 'string') return v;
          if (v && typeof v === 'object') return v.text || v.name || v.title || '';
          return '';
        }).filter(t => t.length > 0);
        
        if (visitTexts.length > 0) {
          visitsHtml = `
            <div class="content-box">
              <h4>📍 À visiter</h4>
              <ul>${visitTexts.map(t => `<li>${t}</li>`).join('')}</ul>
            </div>
          `;
        }
      }
      
      // Activités
      let activitiesHtml = '';
      if (options.includeActivities) {
        const activities = Array.isArray(step.activities) ? step.activities : [];
        const activityTexts = activities.map(a => {
          if (typeof a === 'string') return a;
          if (a && typeof a === 'object') return a.text || a.name || a.title || '';
          return '';
        }).filter(t => t.length > 0);
        
        if (activityTexts.length > 0) {
          activitiesHtml = `
            <div class="content-box">
              <h4>🎯 Activités</h4>
              <ul>${activityTexts.map(t => `<li>${t}</li>`).join('')}</ul>
            </div>
          `;
        }
      }
      
      // Hébergement
      let hotelHtml = '';
      if (options.includeHotels && nights > 0 && step.hotelName) {
        hotelHtml = `
          <div class="content-box hotel-box">
            <h4>🏨 Hébergement</h4>
            <div class="hotel-name">${step.hotelName}</div>
            <div class="hotel-nights">${nights} nuit${nights > 1 ? 's' : ''}</div>
          </div>
        `;
      }
      
      // 1 étape par page
      html += `
        <div class="page">
          <h2 class="page-title">Programme détaillé</h2>
          <div class="page-title-underline"></div>
          
          <div class="step-block">
            <div class="step-header">
              <div class="step-number">${idx + 1}</div>
              <div class="step-info">
                <div class="step-name">${step.name}</div>
                <div class="step-meta">${dateStr} · ${nights > 0 ? nights + ' nuit' + (nights > 1 ? 's' : '') : 'Passage'}</div>
              </div>
            </div>
            
            ${photo ? `<img src="${photo}" class="step-photo" crossorigin="anonymous">` : ''}
            
            ${(visitsHtml || activitiesHtml || hotelHtml) ? `
              <div class="step-content">
                ${visitsHtml}
                ${activitiesHtml}
                ${hotelHtml}
              </div>
            ` : ''}
          </div>
        </div>
      `;
      
      if (nights > 0 && startDate) {
        startDate = addDays(startDate, nights);
      }
    });
    
    return html;
  }

  // ============================================================
  // API PUBLIQUE
  // ============================================================
  
  async function generatePDFHtml(state, options = {}) {
    const opts = { ...CONFIG.defaultOptions, ...options };
    const lang = document.documentElement.lang || 'fr';
    
    let html = `
      <!DOCTYPE html>
      <html lang="${lang}">
      <head>
        <meta charset="utf-8">
        <title>${state.title || 'Roadtrip'} - OneRoadTrip</title>
        ${getStyles()}
      </head>
      <body>
    `;
    
    // Page de garde
    html += generateCoverPage(state, opts);
    
    // Résumé
    if (opts.includeSummary) {
      html += generateSummaryPage(state);
    }
    
    // Carte
    if (opts.includeMap) {
      const mapImage = await generateStaticMap(state);
      html += generateMapPage(mapImage);
    }
    
    // Détail des étapes
    if (opts.includeDetails) {
      html += generateDetailPages(state, opts);
    }
    
    // Bouton imprimer
    html += `
      <button class="print-btn" onclick="window.print()">
        🖨️ Imprimer / Sauvegarder PDF
      </button>
    `;
    
    html += '</body></html>';
    return html;
  }
  
  async function openPreview(state, options = {}) {
    // Loader
    const loader = document.createElement('div');
    loader.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;">
        <div style="background:white;padding:30px 50px;border-radius:12px;text-align:center;">
          <div style="width:50px;height:50px;border:4px solid #e2e8f0;border-top-color:${CONFIG.primaryDark};border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px;"></div>
          <div style="font-size:16px;color:${CONFIG.textDark};">Génération en cours...</div>
        </div>
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(loader);
    
    // Fermer modal
    const modal = document.getElementById('pdfExportModal');
    if (modal) modal.classList.remove('show');
    
    try {
      const html = await generatePDFHtml(state, options);
      loader.remove();
      
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      } else {
        alert('Popup bloquée. Autorisez les popups pour ce site.');
      }
    } catch (e) {
      loader.remove();
      console.error('[PDF]', e);
      alert('Erreur: ' + e.message);
    }
  }
  
  function showExportModal(state) {
    let modal = document.getElementById('pdfExportModal');
    if (modal) {
      modal.remove();
    }
    
    // Collecter toutes les photos de l'itinéraire
    const allPhotos = [];
    state.steps.forEach((step, idx) => {
      if (Array.isArray(step.images)) {
        step.images.forEach((img, imgIdx) => {
          if (img) {
            allPhotos.push({
              url: img,
              stepIndex: idx,
              stepName: step.name,
              imgIndex: imgIdx
            });
          }
        });
      }
    });
    
    modal = document.createElement('div');
    modal.id = 'pdfExportModal';
    modal.innerHTML = `
      <style>
        #pdfExportModal {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 99999;
          align-items: center;
          justify-content: center;
        }
        #pdfExportModal.show { display: flex; }
        
        #pdfExportModal .modal-box {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        
        #pdfExportModal .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        #pdfExportModal .modal-header h2 {
          margin: 0;
          color: ${CONFIG.primaryDark};
          font-size: 1.3rem;
        }
        
        #pdfExportModal .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #64748b;
          padding: 5px;
        }
        
        #pdfExportModal .modal-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        #pdfExportModal .left-panel {
          width: 55%;
          padding: 20px;
          border-right: 1px solid #e2e8f0;
          overflow-y: auto;
        }
        
        #pdfExportModal .right-panel {
          width: 45%;
          padding: 20px;
          overflow-y: auto;
          background: #f8fafc;
        }
        
        #pdfExportModal h3 {
          margin: 0 0 12px;
          color: ${CONFIG.textDark};
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        #pdfExportModal .photo-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 15px;
        }
        
        #pdfExportModal .photo-tab {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background: white;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        
        #pdfExportModal .photo-tab.active {
          background: ${CONFIG.primaryDark};
          color: white;
          border-color: ${CONFIG.primaryDark};
        }
        
        #pdfExportModal .photo-gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }
        
        #pdfExportModal .photo-item {
          position: relative;
          aspect-ratio: 4/3;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 3px solid transparent;
          transition: all 0.2s;
        }
        
        #pdfExportModal .photo-item:hover {
          transform: scale(1.02);
        }
        
        #pdfExportModal .photo-item.selected {
          border-color: ${CONFIG.accent};
        }
        
        #pdfExportModal .photo-item.selected::after {
          content: '✓';
          position: absolute;
          top: 5px;
          right: 5px;
          width: 24px;
          height: 24px;
          background: ${CONFIG.accent};
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
        }
        
        #pdfExportModal .photo-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        #pdfExportModal .photo-item .photo-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 4px 6px;
          background: rgba(0,0,0,0.7);
          color: white;
          font-size: 0.7rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        #pdfExportModal .photo-order {
          position: absolute;
          top: 5px;
          left: 5px;
          width: 22px;
          height: 22px;
          background: ${CONFIG.primaryDark};
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
        }
        
        #pdfExportModal .custom-urls {
          margin-top: 15px;
        }
        
        #pdfExportModal .url-input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        #pdfExportModal .url-input-row input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        
        #pdfExportModal .url-input-row input:focus {
          outline: none;
          border-color: ${CONFIG.accent};
        }
        
        #pdfExportModal .btn-add-url {
          padding: 10px 16px;
          background: ${CONFIG.primaryLight};
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
        }
        
        #pdfExportModal .added-urls {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        
        #pdfExportModal .url-thumb {
          width: 60px;
          height: 45px;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          border: 2px solid transparent;
        }
        
        #pdfExportModal .url-thumb.selected {
          border-color: ${CONFIG.accent};
        }
        
        #pdfExportModal .url-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        #pdfExportModal .url-thumb .remove-url {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        #pdfExportModal .selection-info {
          padding: 10px 15px;
          background: #e0f2fe;
          border-radius: 8px;
          margin-bottom: 15px;
          font-size: 0.85rem;
          color: #0369a1;
        }
        
        #pdfExportModal .option-group {
          margin-bottom: 20px;
        }
        
        #pdfExportModal .option {
          margin: 8px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        #pdfExportModal .option label {
          cursor: pointer;
          color: ${CONFIG.textDark};
          font-size: 0.9rem;
        }
        
        #pdfExportModal input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: ${CONFIG.accent};
        }
        
        #pdfExportModal .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
        }
        
        #pdfExportModal .btn-cancel {
          padding: 10px 20px;
          background: transparent;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          color: ${CONFIG.textMuted};
        }
        
        #pdfExportModal .btn-generate {
          padding: 12px 28px;
          background: ${CONFIG.primaryDark};
          color: ${CONFIG.accent};
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
        }
        
        #pdfExportModal .btn-generate:hover {
          opacity: 0.9;
        }
        
        #pdfExportModal .btn-select-all {
          padding: 6px 12px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          margin-left: auto;
        }
      </style>
      
      <div class="modal-box">
        <div class="modal-header">
          <h2>📄 Générer le carnet de voyage</h2>
          <button class="modal-close" onclick="document.getElementById('pdfExportModal').classList.remove('show')">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="left-panel">
            <div style="display:flex; align-items:center; margin-bottom:12px;">
              <h3 style="margin:0;">📷 SÉLECTION DES PHOTOS</h3>
              <button class="btn-select-all" id="btnSelectAll">Tout sélectionner</button>
            </div>
            
            <div class="photo-tabs">
              <button class="photo-tab active" data-tab="itinerary">Photos itinéraire (${allPhotos.length})</button>
              <button class="photo-tab" data-tab="custom">Mes photos</button>
            </div>
            
            <div id="tabItinerary">
              <div class="photo-gallery" id="photoGallery">
                ${allPhotos.map((p, i) => `
                  <div class="photo-item" data-url="${optimizeImageUrl(p.url)}" data-index="${i}">
                    <img src="${p.url}" alt="${p.stepName}" loading="lazy">
                    <div class="photo-label">${p.stepName}</div>
                  </div>
                `).join('')}
              </div>
              ${allPhotos.length === 0 ? '<p style="color:#64748b;text-align:center;padding:30px;">Aucune photo dans l\'itinéraire</p>' : ''}
            </div>
            
            <div id="tabCustom" style="display:none;">
              <div class="url-input-row">
                <input type="text" id="customUrlInput" placeholder="https://exemple.com/ma-photo.jpg">
                <button class="btn-add-url" id="btnAddUrl">+ Ajouter</button>
              </div>
              <div class="added-urls" id="addedUrls"></div>
              <p style="color:#64748b;font-size:0.8rem;margin-top:10px;">
                Collez des URLs d'images (Unsplash, Google Photos, etc.)
              </p>
            </div>
          </div>
          
          <div class="right-panel">
            <div class="selection-info" id="selectionInfo">
              <strong>0</strong> photo(s) sélectionnée(s)
            </div>
            
            <div class="option-group">
              <h3>📋 CONTENU DU PDF</h3>
              <div class="option">
                <input type="checkbox" id="pdfOptSummary" checked>
                <label for="pdfOptSummary">Tableau résumé</label>
              </div>
              <div class="option">
                <input type="checkbox" id="pdfOptMap" checked>
                <label for="pdfOptMap">Carte de l'itinéraire</label>
              </div>
              <div class="option">
                <input type="checkbox" id="pdfOptDetails" checked>
                <label for="pdfOptDetails">Programme détaillé</label>
              </div>
            </div>
            
            <div class="option-group">
              <h3>📍 DANS LE PROGRAMME</h3>
              <div class="option">
                <input type="checkbox" id="pdfOptVisits" checked>
                <label for="pdfOptVisits">Lieux à visiter</label>
              </div>
              <div class="option">
                <input type="checkbox" id="pdfOptActivities" checked>
                <label for="pdfOptActivities">Activités</label>
              </div>
              <div class="option">
                <input type="checkbox" id="pdfOptHotels">
                <label for="pdfOptHotels">Hébergements</label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" onclick="document.getElementById('pdfExportModal').classList.remove('show')">Annuler</button>
          <button class="btn-generate" id="btnGenerate">✨ Générer le PDF</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // État
    const selectedPhotos = [];
    const customUrls = [];
    
    function updateSelectionInfo() {
      const total = selectedPhotos.length;
      document.getElementById('selectionInfo').innerHTML = `
        <strong>${total}</strong> photo(s) sélectionnée(s)
        ${total > 0 ? `<br><small>Les photos seront réparties sur les ${state.steps.length} étapes</small>` : ''}
      `;
    }
    
    function updatePhotoOrders() {
      document.querySelectorAll('.photo-item .photo-order').forEach(el => el.remove());
      selectedPhotos.forEach((url, idx) => {
        const item = document.querySelector(`.photo-item[data-url="${CSS.escape(url)}"]`);
        if (item) {
          const order = document.createElement('div');
          order.className = 'photo-order';
          order.textContent = idx + 1;
          item.appendChild(order);
        }
      });
    }
    
    // Onglets
    document.querySelectorAll('.photo-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.photo-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        document.getElementById('tabItinerary').style.display = tabName === 'itinerary' ? 'block' : 'none';
        document.getElementById('tabCustom').style.display = tabName === 'custom' ? 'block' : 'none';
      });
    });
    
    // Sélection photos galerie
    document.querySelectorAll('.photo-item').forEach(item => {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        const idx = selectedPhotos.indexOf(url);
        if (idx >= 0) {
          selectedPhotos.splice(idx, 1);
          item.classList.remove('selected');
        } else {
          selectedPhotos.push(url);
          item.classList.add('selected');
        }
        updateSelectionInfo();
        updatePhotoOrders();
      });
    });
    
    // Tout sélectionner
    document.getElementById('btnSelectAll').addEventListener('click', () => {
      const allSelected = selectedPhotos.length === allPhotos.length;
      if (allSelected) {
        selectedPhotos.length = 0;
        document.querySelectorAll('.photo-item').forEach(item => item.classList.remove('selected'));
      } else {
        selectedPhotos.length = 0;
        allPhotos.forEach(p => selectedPhotos.push(p.url));
        document.querySelectorAll('.photo-item').forEach(item => item.classList.add('selected'));
      }
      updateSelectionInfo();
      updatePhotoOrders();
      document.getElementById('btnSelectAll').textContent = allSelected ? 'Tout sélectionner' : 'Tout désélectionner';
    });
    
    // Ajouter URL custom
    function addCustomUrl(url) {
      if (!url || customUrls.includes(url)) return;
      customUrls.push(url);
      selectedPhotos.push(url);
      
      const container = document.getElementById('addedUrls');
      const thumb = document.createElement('div');
      thumb.className = 'url-thumb selected';
      thumb.dataset.url = url;
      thumb.innerHTML = `
        <img src="${url}" alt="Custom" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23e2e8f0%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%2364748b%22 font-size=%2212%22>Erreur</text></svg>'">
        <button class="remove-url">&times;</button>
      `;
      
      thumb.querySelector('.remove-url').addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = customUrls.indexOf(url);
        if (idx >= 0) customUrls.splice(idx, 1);
        const selIdx = selectedPhotos.indexOf(url);
        if (selIdx >= 0) selectedPhotos.splice(selIdx, 1);
        thumb.remove();
        updateSelectionInfo();
      });
      
      thumb.addEventListener('click', () => {
        const selIdx = selectedPhotos.indexOf(url);
        if (selIdx >= 0) {
          selectedPhotos.splice(selIdx, 1);
          thumb.classList.remove('selected');
        } else {
          selectedPhotos.push(url);
          thumb.classList.add('selected');
        }
        updateSelectionInfo();
      });
      
      container.appendChild(thumb);
      updateSelectionInfo();
    }
    
    document.getElementById('btnAddUrl').addEventListener('click', () => {
      const input = document.getElementById('customUrlInput');
      addCustomUrl(input.value.trim());
      input.value = '';
    });
    
    document.getElementById('customUrlInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const input = document.getElementById('customUrlInput');
        addCustomUrl(input.value.trim());
        input.value = '';
      }
    });
    
    // Générer
    document.getElementById('btnGenerate').onclick = () => {
      openPreview(state, {
        includeSummary: document.getElementById('pdfOptSummary').checked,
        includeMap: document.getElementById('pdfOptMap').checked,
        includeDetails: document.getElementById('pdfOptDetails').checked,
        includeVisits: document.getElementById('pdfOptVisits').checked,
        includeActivities: document.getElementById('pdfOptActivities').checked,
        includeHotels: document.getElementById('pdfOptHotels').checked,
        selectedPhotos: [...selectedPhotos]
      });
    };
    
    modal.addEventListener('click', e => {hn
      if (e.target === modal) modal.classList.remove('show');
    });
    
    modal.classList.add('show');
  }

  // ============================================================
  // EXPORT
  // ============================================================
  
  window.ORT_PDF = {
    generatePDFHtml,
    openPreview,
    showExportModal,
    CONFIG
  };
  
  console.log('[PDF EXPORT] ✅ Module BeeTrip v4 chargé');

})(window);