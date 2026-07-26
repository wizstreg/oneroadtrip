// web/js/poi-cluster.js
// Petit wrapper autour de Supercluster: build(points), query(bbox, zoom)

(function (global) {
  function toFeature(p) {
    return {
      type: 'Feature',
      properties: { id: p.id, title: p.title, kind: p.kind },
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] }
    };
  }

  function build(points, options = {}) {
    const feats = points.map(toFeature);
    const idx = new (global.Supercluster || function(){ return { load(){}, getClusters(){ return feats; } } })({
      radius: options.radius || 60,
      maxZoom: options.maxZoom || 16,
      minPoints: options.minPoints || 2
    });
    if (idx.load) idx.load(feats);
    return {
      raw: idx,
      query: (bbox, zoom) => {
        // bbox: [S,W,N,E]
        if (!idx.getClusters) return feats;
        return idx.getClusters([bbox[1], bbox[0], bbox[3], bbox[2]], Math.max(0, Math.min(20, Math.round(zoom||0))));
      }
    };
  }

  global.POICluster = { build };
})(window);
