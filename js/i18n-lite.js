// i18n-lite.js — loader minimal commun à tout le site
(function(){
  const LSKEY = 'lang';
  const FALLBACK = 'fr';
  const lang = (localStorage.getItem(LSKEY) || document.documentElement.lang || FALLBACK);

  // 1) charge le bundle de la page (facultatif) + un bundle commun
  // convention: /i18n/common.<lang>.json et /i18n/<page>.<lang>.json
  async function loadJSON(url){ try{ const r=await fetch(url); if(!r.ok) throw 0; return r.json(); }catch(_){ return {}; } }

  async function bootI18N(){
    const page = document.body.dataset.page || '';      // ex: data-page="choix_regions"
    const base = location.pathname.replace(/\/[^/]*$/, ''); // dossier de la page
    // tu peux aussi pointer vers /web/i18n/ si centralisé
    const common = await loadJSON(`${base}/i18n/common.${lang}.json`);
    const pageLoc= page ? await loadJSON(`${base}/i18n/${page}.${lang}.json`) : {};
    const dict = deepMerge(common, pageLoc);

    // exposer t()
    window.I18N_DICT = dict;
    window.t = function(key, fallback){
      const seg = key.split('.');
      let cur = dict;
      for(const s of seg){ cur = (cur && cur[s]!==undefined) ? cur[s] : undefined; }
      return (typeof cur === 'string') ? cur : (fallback || key);
    };

    // bind déclaratif : data-i18n="cle", et data-i18n-attr="title,placeholder"
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const k = el.getAttribute('data-i18n');
      el.textContent = t(k, el.textContent);
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el=>{
      const attrs = el.getAttribute('data-i18n-attr').split(',').map(s=>s.trim());
      const baseKey = el.getAttribute('data-i18n') || el.getAttribute('data-i18n-base') || '';
      attrs.forEach(a=>{
        const key = baseKey ? `${baseKey}@${a}` : el.getAttribute(`data-i18n-${a}`); // 2 syntaxes
        if(!key) return;
        el.setAttribute(a, t(key, el.getAttribute(a)));
      });
    });

    // évènement pour composants dynamiques
    document.dispatchEvent(new CustomEvent('i18n:ready', { detail:{ lang, dict } }));
  }

  function deepMerge(a,b){ const o=JSON.parse(JSON.stringify(a)); (function r(t,s){ for(const k in s){ const v=s[k]; if(v&&typeof v==='object'&&!Array.isArray(v)){ t[k]=t[k]||{}; r(t[k],v);} else { t[k]=v; } } })(o,b); return o; }

  // expose changer de langue global
  window.setLang = async function(newLang){
    localStorage.setItem(LSKEY, newLang);
    // recharge la page pour relier les bons JSON (simple & sûr)
    location.reload();
  };

  bootI18N();
})();
