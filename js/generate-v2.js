"use strict";
var fs=require("fs");
var path=require("path");
var generateHTML=require("./template-v2");
function parseArgs(){var a={};process.argv.slice(2).forEach(function(x){var p=x.replace(/^--/,"").split("=");a[p[0]]=p[1]||true;});return a;}
var ARGS=parseArgs();
if(!ARGS.base){console.error("[ERREUR] --base requis");process.exit(1);}
var FORCED_LANG=ARGS.lang||null;
var baseDir=ARGS.base;
var countriesDir=path.join(baseDir,"countries");
var photosFile=path.join(baseDir,"..","photos-json","photos_lieux.json");
var photosFileFallback=path.join(baseDir,"..","photos_cache.json");
var rootDir=path.resolve(baseDir,"..",".."); // C:\OneRoadTrip
var outputRoot=rootDir; // directement C:\OneRoadTrip\itineraires\ etc.
var prodRoot=path.join("C:","Ort prod"); // directement C:\Ort prod\itineraires\ etc.
var testRoot=path.join("C:","Ort test"); // directement C:\Ort test\itineraires\ etc.
var DATES_FILE=path.join(baseDir,"tools","itineraries-dates.json");
var DEFAULT_IMG="https://www.oneroadtrip.com/assets/image_index.webp";
var SUPPORTED_LANGS=["fr","en","es","pt","it","ar"];
var LANG_FOLDERS={fr:"itineraires",en:"itineraries",es:"rutas",it:"itinerari",pt:"roteiros",ar:"masar"};
var LANG_SLUGS={fr:"itineraires",en:"itineraries",es:"rutas",pt:"roteiros",it:"itinerari",ar:"masar"};
var CONFIG={siteUrl:"https://www.oneroadtrip.com",countryFilter:ARGS.country?ARGS.country.toUpperCase():null};
console.log("\n=============================================");
console.log("  OneRoadTrip - Generate Static Pages v2");
console.log("=============================================");
console.log("  BASE  : "+baseDir);
console.log("  OUT   : "+outputRoot);
console.log("  LANG  : "+(FORCED_LANG||"AUTO"));
console.log("  PAYS  : "+(CONFIG.countryFilter||"TOUS")+"\n");
var COUNTRIES_CACHE={};
var ITINERARIES_DATES={};
try{ITINERARIES_DATES=JSON.parse(fs.readFileSync(DATES_FILE,"utf8"));}catch(e){}

// ============ COUNTRY GUIDES ============
var countryGuidesDir=path.join(baseDir,"..","country-guides");
var COUNTRY_GUIDES_CACHE={};

function parseCountryGuide(content){
var result={weather:"",experiences:"",warning:""};
if(!content)return result;
// Extraire "Best Time to Visit"
var weatherMatch=content.match(/## Best Time to Visit\s*\n([\s\S]*?)(?=\n## |$)/i);
if(weatherMatch){
var wt=weatherMatch[1].trim();
wt=wt.replace(/\*\*([^*:]+)::\*\*/g,"<strong>$1:</strong>");
wt=wt.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
wt=wt.replace(/::/g,":");
var parts=wt.split(/\n\n+/);
var cleaned=[];
for(var i=0;i<parts.length;i++){
var p=parts[i].replace(/\n/g," ").trim();
if(p)cleaned.push(p);
}
result.weather=cleaned.join("<br><br>");
}
// Extraire "Unique Experiences"
var expMatch=content.match(/## Unique Experiences\s*\n([\s\S]*?)(?=\n## |$)/i);
if(expMatch){
result.experiences=expMatch[1].trim();
}
// Extraire "Safety Warning" (optionnel)
var warnMatch=content.match(/## Safety Warning\s*\n([\s\S]*?)(?=\n## |$)/i);
if(warnMatch){
var warningText=warnMatch[1].trim();
warningText=warningText.replace(/\*\*AVVISO DI SICUREZZA::\*\*/gi,"\u26a0\ufe0f ");
warningText=warningText.replace(/\*\*SAFETY WARNING::\*\*/gi,"\u26a0\ufe0f ");
warningText=warningText.replace(/\*\*AVERTISSEMENT::\*\*/gi,"\u26a0\ufe0f ");
warningText=warningText.replace(/\*\*AVISO DE SEGURIDAD::\*\*/gi,"\u26a0\ufe0f ");
warningText=warningText.replace(/\*\*AVISO DE SEGURAN\u00c7A::\*\*/gi,"\u26a0\ufe0f ");
warningText=warningText.replace(/\*\*\u062a\u062d\u0630\u064a\u0631 \u0623\u0645\u0646\u064a::\*\*/gi,"\u26a0\ufe0f ");
warningText=warningText.replace(/\*\*([^*]+)\*\*/g,"$1");
warningText=warningText.replace(/::/g,":");
result.warning=warningText.trim();
}
return result;
}

function loadCountryGuide(countryCode,lang){
var cacheKey=countryCode+"_"+lang;
if(COUNTRY_GUIDES_CACHE[cacheKey])return COUNTRY_GUIDES_CACHE[cacheKey];
var guidePath=path.join(countryGuidesDir,lang,countryCode+".txt");
try{
var content=fs.readFileSync(guidePath,"utf8");
var parsed=parseCountryGuide(content);
COUNTRY_GUIDES_CACHE[cacheKey]=parsed;
console.log("[GUIDE] "+countryCode+"/"+lang+" OK (weather:"+(parsed.weather?"OUI":"NON")+", exp:"+(parsed.experiences?"OUI":"NON")+")");
return parsed;
}catch(e){
console.log("[GUIDE] "+countryCode+"/"+lang+" introuvable: "+guidePath);
// Fallback : essayer en anglais
if(lang!=="en"){
var fallbackPath=path.join(countryGuidesDir,"en",countryCode+".txt");
try{
var content2=fs.readFileSync(fallbackPath,"utf8");
var parsed2=parseCountryGuide(content2);
COUNTRY_GUIDES_CACHE[cacheKey]=parsed2;
console.log("[GUIDE] "+countryCode+"/"+lang+" fallback EN OK (weather:"+(parsed2.weather?"OUI":"NON")+", exp:"+(parsed2.experiences?"OUI":"NON")+")");
return parsed2;
}catch(e2){console.log("[GUIDE] "+countryCode+" fallback EN introuvable: "+fallbackPath);}
}
COUNTRY_GUIDES_CACHE[cacheKey]={weather:"",experiences:"",warning:""};
return COUNTRY_GUIDES_CACHE[cacheKey];
}
}

function slug(id){return id.toLowerCase().replace(/::/g,"-").replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");}
function stats(days,est){var km=0,drv=0;days.forEach(function(d){if(d.to_next_leg){km+=d.to_next_leg.distance_km||0;drv+=d.to_next_leg.drive_min||0;}});return{totalDays:est||days.length,km:Math.round(km),driveMin:drv,stops:days.length};}
function placeName(pid,places){if(!pid)return"";var pl=places.find(function(p){return p.place_id===pid;});if(pl)return pl.name||pid.split("::").pop().replace(/-/g," ");return pid.split("::").pop().replace(/-/g," ").replace(/\b\w/g,function(c){return c.toUpperCase();});}
function getPhoto(pid,photos,places){if(!pid)return null;if(photos[pid]&&photos[pid].photos&&photos[pid].photos[0])return photos[pid].photos[0];var pl=places.find(function(p){return p.place_id===pid;});if(pl&&pl.images&&pl.images[0])return pl.images[0];return null;}
function getPhotos(pid,photos,places,max){max=max||4;var r=[];if(photos[pid]&&photos[pid].photos)r.push.apply(r,photos[pid].photos);var pl=places.find(function(p){return p.place_id===pid;});if(pl&&pl.images)pl.images.forEach(function(i){if(r.indexOf(i)<0)r.push(i);});return r.slice(0,max);}
function optimizeImage(url,opts){if(!url||url==="null")return DEFAULT_IMG;if(url.startsWith("data:"))return url;var w=(opts&&opts.w)||800;var q=(opts&&opts.q)||75;try{return"https://wsrv.nl/?url="+encodeURIComponent(url)+"&w="+w+"&q="+q+"&output=webp";}catch(e){return url;}}
function optimizeHero(url){return optimizeImage(url,{w:1200,q:80});}
function optimizeCard(url){return optimizeImage(url,{w:600,q:70});}
function getRating(pid,places){var pl=places.find(function(p){return p.place_id===pid;});return pl?(pl.rating||0):0;}
function loadCountriesIndex(bd,lang){var fp=path.join(bd,"..","countries-index-"+lang+".json");try{var data=JSON.parse(fs.readFileSync(fp,"utf8"));var map={};if(Array.isArray(data))data.forEach(function(c){map[c.cc||c.code]=c.name||c.label;});else if(typeof data==="object")Object.assign(map,data);COUNTRIES_CACHE[lang]=map;return map;}catch(e){return COUNTRIES_CACHE[lang]||{};}}
function findFile(cd,cc,type,tl){var order=[tl,"en","fr"];var cu=cc.toUpperCase();var cl=cc.toLowerCase();for(var i=0;i<order.length;i++){var l=order[i];var fp;if(type==="itins")fp=path.join(cd,cu+".itins.modules-"+l+".json");else fp=path.join(cd,cl+".places.master-"+l+".json");if(fs.existsSync(fp))return{path:fp,lang:l};}var old;if(type==="itins")old=path.join(cd,cu+".itins.modules.json");else old=path.join(cd,cl+".places.master.json");if(fs.existsSync(old))return{path:old,lang:"legacy"};return null;}
function delRec(dir){if(!fs.existsSync(dir))return;fs.readdirSync(dir,{withFileTypes:true}).forEach(function(e){var fp=path.join(dir,e.name);if(e.isDirectory()){delRec(fp);fs.rmdirSync(fp);}else fs.unlinkSync(fp);});}

function main(){
if(!fs.existsSync(countriesDir)){console.error("[ERREUR] "+countriesDir+" introuvable");process.exit(1);}
// Clean uniquement les dossiers itineraires par langue (pas toute la racine !)
SUPPORTED_LANGS.forEach(function(l){
var langDir=path.join(outputRoot,LANG_FOLDERS[l]);
if(fs.existsSync(langDir)){console.log("[CLEAN] "+langDir);delRec(langDir);}
});
var photos={};
if(fs.existsSync(photosFile)){try{photos=JSON.parse(fs.readFileSync(photosFile,"utf8"));var pk=Object.keys(photos);console.log("[OK] "+pk.length+" photos (photos_lieux.json)");if(pk.length>0){console.log("[PHOTOS] Exemple cle: "+pk[0]);var ex=photos[pk[0]];console.log("[PHOTOS] Structure: "+JSON.stringify(Object.keys(ex||{})));if(ex&&ex.photos)console.log("[PHOTOS] Nb photos pour "+pk[0]+": "+ex.photos.length);else if(ex&&typeof ex==="string")console.log("[PHOTOS] Valeur directe: "+ex.substring(0,80));else if(Array.isArray(ex))console.log("[PHOTOS] Array de "+ex.length+" elements");}}catch(e){console.log("[ERR] photos: "+e.message);}}
else if(fs.existsSync(photosFileFallback)){try{photos=JSON.parse(fs.readFileSync(photosFileFallback,"utf8"));console.log("[OK] "+Object.keys(photos).length+" photos (photos_cache.json)");}catch(e){}}
else{console.log("[WARN] Aucun fichier photos trouve: "+photosFile);}
var dirs=fs.readdirSync(countriesDir).filter(function(d){return fs.statSync(path.join(countriesDir,d)).isDirectory()&&/^[A-Z]{2}$/.test(d);});
var targets=CONFIG.countryFilter?dirs.filter(function(c){return c===CONFIG.countryFilter;}):dirs;
if(!targets.length){console.error("[ERREUR] Aucun pays");process.exit(1);}
console.log("[OK] Pays: "+targets.join(", "));
// Verifier country-guides
if(fs.existsSync(countryGuidesDir)){console.log("[OK] Country guides: "+countryGuidesDir);}else{console.log("[WARN] Country guides introuvable: "+countryGuidesDir);}
// Charger hotels
var hotelsFile=path.join(countriesDir,"hotels_scrape.json");
var HOTELS_DATA={};
try{if(fs.existsSync(hotelsFile)){HOTELS_DATA=JSON.parse(fs.readFileSync(hotelsFile,"utf8"));console.log("[OK] Hotels: "+Object.keys(HOTELS_DATA).length+" places");}else{console.log("[WARN] Pas de hotels_scrape.json");}}catch(e){console.log("[WARN] Hotels: "+e.message);}
SUPPORTED_LANGS.forEach(function(l){loadCountriesIndex(baseDir,l);});
var allByLang={};
SUPPORTED_LANGS.forEach(function(lang){allByLang[lang]=[];targets.forEach(function(c){var cd=path.join(countriesDir,c);var order=[lang,"en","fr"];for(var i=0;i<order.length;i++){var fp=path.join(cd,c+".itins.modules-"+order[i]+".json");if(fs.existsSync(fp)){try{var d=JSON.parse(fs.readFileSync(fp,"utf8"));if(d.itineraries)allByLang[lang].push.apply(allByLang[lang],d.itineraries);}catch(e){}break;}}});});
var idxData={};SUPPORTED_LANGS.forEach(function(l){idxData[l]=[];});
var total=0,errs=0,plCache={},datSync={};
var H={slug:slug,stats:stats,placeName:placeName,getPhoto:getPhoto,getPhotos:getPhotos,optimizeHero:optimizeHero,optimizeCard:optimizeCard,getRating:getRating,COUNTRIES:{},ITINERARIES_DATES:ITINERARIES_DATES,loadCountryGuide:loadCountryGuide,HOTELS:HOTELS_DATA};

targets.forEach(function(c){
var cd=path.join(countriesDir,c);
var langs=FORCED_LANG?[FORCED_LANG]:SUPPORTED_LANGS;
langs.forEach(function(lang){
var ir=findFile(cd,c,"itins",lang);if(!ir)return;
var pr=findFile(cd,c,"places",lang);
var pk=c+"-"+(pr?pr.lang:"x");
if(!plCache[pk]&&pr){plCache[pk]=[];try{var d=JSON.parse(fs.readFileSync(pr.path,"utf8"));if(d.places)plCache[pk]=d.places;}catch(e){}}
var places=plCache[pk]||[];
try{
var data=JSON.parse(fs.readFileSync(ir.path,"utf8"));
if(!data.itineraries||!data.itineraries.length)return;
var itins;if(ir.lang==="legacy")itins=data.itineraries.filter(function(it){return(it.language||"fr")===lang;});else itins=data.itineraries;
if(!itins.length)return;
H.COUNTRIES=COUNTRIES_CACHE[lang]||loadCountriesIndex(baseDir,lang);
var folder=LANG_FOLDERS[lang]||LANG_FOLDERS.en;
var outDir=path.join(outputRoot,folder);
if(!fs.existsSync(outDir))fs.mkdirSync(outDir,{recursive:true});
itins.forEach(function(itin){
if(!itin.days_plan||!itin.days_plan.length)return;
var s=slug(itin.itin_id||itin.id);
var st=stats(itin.days_plan,itin.estimated_days_base);
var cc2=itin.country||(itin.itin_id?itin.itin_id.split("::")[0]:"XX");
var cn=H.COUNTRIES[cc2]||cc2;
if(itin.created_at&&!datSync[itin.itin_id||itin.id])datSync[itin.itin_id||itin.id]=itin.created_at;
try{
var html=generateHTML({itin:itin,photos:photos,places:places,lang:lang,allItinsForLang:allByLang[lang],helpers:H});
fs.writeFileSync(path.join(outDir,s+".html"),html,"utf8");
var pd=path.join(prodRoot,folder);
if(!fs.existsSync(pd))fs.mkdirSync(pd,{recursive:true});
fs.writeFileSync(path.join(pd,s+".html"),html,"utf8");
var pn=(itin.days_plan||[]).map(function(d){var pid=d.place_id||(d.night?d.night.place_id:null);return pid?pid.split("::").pop().replace(/-/g," "):"";}).filter(Boolean);
idxData[lang].push({slug:s,title:(itin.seo&&itin.seo.h1_title)||itin.title,country:cn,cc:cc2,days:st.totalDays,km:st.km,stops:st.stops,themes:(itin.meta&&itin.meta.themes)||[],search:[itin.title,cn].concat(pn).join(" "),created_at:itin.created_at||""});
total++;console.log("[OK] "+lang.toUpperCase()+" "+s);
}catch(e){errs++;console.error("[ERR] "+s+": "+e.message);}
});
}catch(e){console.error("[ERR] "+c+"/"+lang+": "+e.message);}
});
});

Object.keys(datSync).forEach(function(k){if(!ITINERARIES_DATES[k])ITINERARIES_DATES[k]=datSync[k];});
try{fs.writeFileSync(DATES_FILE,JSON.stringify(ITINERARIES_DATES,null,2),"utf8");}catch(e){}

// ============ PAGES COQUILLE custom.html (voyages custom sans itinéraire catalogue) ============
var generateShellHTML=generateHTML.generateShellHTML;
if(generateShellHTML){
SUPPORTED_LANGS.forEach(function(lang){
var folder=LANG_FOLDERS[lang];
var outDir2=path.join(outputRoot,folder);
if(!fs.existsSync(outDir2))fs.mkdirSync(outDir2,{recursive:true});
var shellHtml=generateShellHTML(lang);
fs.writeFileSync(path.join(outDir2,"custom.html"),shellHtml,"utf8");
// Copier vers prod
var pd2=path.join(prodRoot,folder);
if(!fs.existsSync(pd2))fs.mkdirSync(pd2,{recursive:true});
fs.writeFileSync(path.join(pd2,"custom.html"),shellHtml,"utf8");
// Copier vers test
var td2=path.join(testRoot,folder);
if(!fs.existsSync(td2))fs.mkdirSync(td2,{recursive:true});
fs.writeFileSync(path.join(td2,"custom.html"),shellHtml,"utf8");
console.log("[SHELL] "+lang.toUpperCase()+" custom.html");
});
console.log("[SHELL] 6 pages coquille generees");
}else{console.log("[WARN] generateShellHTML non disponible");}


SUPPORTED_LANGS.forEach(function(lang){
var pages=idxData[lang];if(!pages.length)return;
var folder=LANG_FOLDERS[lang];
var od=path.join(outputRoot,folder);if(!fs.existsSync(od))fs.mkdirSync(od,{recursive:true});
fs.writeFileSync(path.join(od,"index-data.json"),JSON.stringify(pages,null,2),"utf8");
var pd=path.join(prodRoot,folder);if(!fs.existsSync(pd))fs.mkdirSync(pd,{recursive:true});
fs.writeFileSync(path.join(pd,"index-data.json"),JSON.stringify(pages,null,2),"utf8");
console.log("[INDEX-DATA] "+lang.toUpperCase()+": "+pages.length+" entries");
});

var sm=[];SUPPORTED_LANGS.forEach(function(lang){(idxData[lang]||[]).forEach(function(p){sm.push("  <url><loc>"+CONFIG.siteUrl+"/"+LANG_SLUGS[lang]+"/"+p.slug+".html</loc><lastmod>"+new Date().toISOString().split("T")[0]+"</lastmod><priority>0.8</priority></url>");});});
var smx='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+sm.join("\n")+"\n</urlset>";
fs.writeFileSync(path.join(outputRoot,"sitemap-static.xml"),smx,"utf8");
try{fs.mkdirSync(prodRoot,{recursive:true});fs.writeFileSync(path.join(prodRoot,"sitemap-static.xml"),smx,"utf8");}catch(e){}

// rootDir deja defini en haut
var lastmod=new Date().toISOString().split("T")[0];

// ============ SITEMAP ROOT (pages principales du site) ============
var rootPages=[
{loc:"/index.html",priority:"1.0",freq:"weekly"},
{loc:"/presentation.html",priority:"0.9",freq:"monthly"},
{loc:"/about.html",priority:"0.6",freq:"yearly"},
{loc:"/about-ar.html",priority:"0.5",freq:"yearly"},
{loc:"/a-propos.html",priority:"0.6",freq:"yearly"},
{loc:"/sobre.html",priority:"0.5",freq:"yearly"},
{loc:"/acerca-de.html",priority:"0.5",freq:"yearly"},
{loc:"/chi-siamo.html",priority:"0.5",freq:"yearly"},
{loc:"/cgu-fr.html",priority:"0.4",freq:"yearly"},
{loc:"/cgu-en.html",priority:"0.4",freq:"yearly"},
{loc:"/cgu-es.html",priority:"0.4",freq:"yearly"},
{loc:"/cgu-pt.html",priority:"0.4",freq:"yearly"},
{loc:"/cgu-it.html",priority:"0.4",freq:"yearly"},
{loc:"/cgu-ar.html",priority:"0.4",freq:"yearly"},
{loc:"/confidentialite-fr.html",priority:"0.4",freq:"yearly"},
{loc:"/confidentialite-en.html",priority:"0.4",freq:"yearly"},
{loc:"/confidentialite-es.html",priority:"0.4",freq:"yearly"},
{loc:"/confidentialite-pt.html",priority:"0.4",freq:"yearly"},
{loc:"/confidentialite-it.html",priority:"0.4",freq:"yearly"},
{loc:"/confidentialite-ar.html",priority:"0.4",freq:"yearly"},
{loc:"/cookies-fr.html",priority:"0.3",freq:"yearly"},
{loc:"/cookies-en.html",priority:"0.3",freq:"yearly"},
{loc:"/cookies-es.html",priority:"0.3",freq:"yearly"},
{loc:"/cookies-pt.html",priority:"0.3",freq:"yearly"},
{loc:"/cookies-it.html",priority:"0.3",freq:"yearly"},
{loc:"/cookies-ar.html",priority:"0.3",freq:"yearly"}
];
var rootXml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+rootPages.map(function(p){return'  <url>\n    <loc>'+CONFIG.siteUrl+p.loc+'</loc>\n    <lastmod>'+lastmod+'</lastmod>\n    <changefreq>'+p.freq+'</changefreq>\n    <priority>'+p.priority+'</priority>\n  </url>';}).join("\n")+"\n</urlset>";
fs.writeFileSync(path.join(outputRoot,"sitemap-root.xml"),rootXml,"utf8");
try{fs.writeFileSync(path.join(prodRoot,"sitemap-root.xml"),rootXml,"utf8");}catch(e){}
console.log("[SITEMAP] sitemap-root.xml: "+rootPages.length+" URLs");

// ============ SITEMAPS PAR LANGUE ============
var langsWithContent=SUPPORTED_LANGS.filter(function(l){return(idxData[l]||[]).length>0;});
langsWithContent.forEach(function(lang){
var folder=LANG_FOLDERS[lang];
var validPages=(idxData[lang]||[]).filter(function(p){return p.slug&&p.slug.length>=3&&!/temp[-_]\d{8,}/i.test(p.slug)&&p.slug.length<=100;});
var indexUrl='  <url>\n    <loc>'+CONFIG.siteUrl+'/'+LANG_SLUGS[lang]+'/index.html</loc>\n    <lastmod>'+lastmod+'</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>';
var pagesXml=validPages.map(function(p){return'  <url>\n    <loc>'+CONFIG.siteUrl+'/'+LANG_SLUGS[lang]+'/'+p.slug+'.html</loc>\n    <lastmod>'+lastmod+'</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>';}).join("\n");
var langSm='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+indexUrl+"\n"+pagesXml+"\n</urlset>";
var od2=path.join(outputRoot,folder);if(!fs.existsSync(od2))fs.mkdirSync(od2,{recursive:true});
fs.writeFileSync(path.join(od2,"sitemap-"+lang+".xml"),langSm,"utf8");
var pd2=path.join(prodRoot,folder);if(!fs.existsSync(pd2))fs.mkdirSync(pd2,{recursive:true});
try{fs.writeFileSync(path.join(pd2,"sitemap-"+lang+".xml"),langSm,"utf8");}catch(e){}
console.log("[SITEMAP] sitemap-"+lang+".xml: "+(validPages.length+1)+" URLs");
});

// ============ SITEMAP INDEX ============
var smIdxXml='<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>'+CONFIG.siteUrl+'/sitemap-root.xml</loc>\n    <lastmod>'+lastmod+'</lastmod>\n  </sitemap>\n'+langsWithContent.map(function(l){return'  <sitemap>\n    <loc>'+CONFIG.siteUrl+'/'+LANG_SLUGS[l]+'/sitemap-'+l+'.xml</loc>\n    <lastmod>'+lastmod+'</lastmod>\n  </sitemap>';}).join("\n")+"\n</sitemapindex>";
fs.writeFileSync(path.join(outputRoot,"sitemap-index.xml"),smIdxXml,"utf8");
try{fs.writeFileSync(path.join(prodRoot,"sitemap-index.xml"),smIdxXml,"utf8");}catch(e){}
console.log("[SITEMAP] sitemap-index.xml: "+(langsWithContent.length+1)+" sitemaps");

// ============ ROBOTS.TXT ============
var robotsTxt=[
"# robots.txt pour OneRoadTrip",
"# Generated: "+new Date().toISOString(),
"",
"User-agent: *",
"Allow: /itineraires/",
"Allow: /itineraries/",
"Allow: /rutas/",
"Allow: /roteiros/",
"Allow: /itinerari/",
"Allow: /masar/",
"Allow: /index.html",
"Allow: /presentation.html",
"Allow: /about.html",
"Allow: /a-propos.html",
"Allow: /sobre.html",
"Allow: /acerca-de.html",
"Allow: /chi-siamo.html",
"Allow: /about-ar.html",
"",
"# Pages dynamiques SPA - pas de valeur SEO",
"Disallow: /roadtrip_mobile.html",
"Disallow: /roadtrip_detail.html",
"Disallow: /roadtrip_detail_simple.html",
"Disallow: /roadtrip_step.html",
"Disallow: /roadtrip-editor.html",
"Disallow: /roadtrip.html",
"Disallow: /carte_builder.html",
"Disallow: /rt-user.html",
"Disallow: /pres_simple.html",
"Disallow: /import.html",
"Disallow: /import-creator.html",
"Disallow: /booking-extractor.html",
"Disallow: /dashboard_user.html",
"",
"# Sitemaps",
"Sitemap: "+CONFIG.siteUrl+"/sitemap-index.xml",
"",
"# AI crawlers",
"User-agent: GPTBot",
"Allow: /",
"",
"User-agent: ChatGPT-User",
"Allow: /",
"",
"User-agent: Claude-Web",
"Allow: /",
"",
"User-agent: Anthropic-AI",
"Allow: /",
"",
"User-agent: PerplexityBot",
"Allow: /",
"",
"User-agent: Google-Extended",
"Allow: /",
""
].join("\n");
var robotsPath=path.join(rootDir,"robots.txt");
try{fs.writeFileSync(robotsPath,robotsTxt,"utf8");console.log("[OK] robots.txt -> "+robotsPath);}catch(e){console.log("[WARN] robots.txt: "+e.message);}

// ============ LATEST-ITINERARIES.JSON ============
var allForLatest=[];
SUPPORTED_LANGS.forEach(function(lang){
(idxData[lang]||[]).forEach(function(p){
var cAt=(ITINERARIES_DATES[p.slug]||p.created_at||"2024-01-01");
allForLatest.push({itin_id:p.slug,slug:p.slug,country:p.cc,lang:lang,title:p.title,days:p.days,created_at:cAt});
});
});
allForLatest.sort(function(a,b){return new Date(b.created_at)-new Date(a.created_at);});
var latestByLang={};
SUPPORTED_LANGS.forEach(function(l){
var li=allForLatest.filter(function(i){return i.lang===l;}).slice(0,15).map(function(i){return{itin_id:i.itin_id,slug:i.slug,country:i.country,title:i.title,days:i.days,created_at:i.created_at};});
if(li.length)latestByLang[l]=li;
});
var seenIds={};var latestGlobal=[];
allForLatest.forEach(function(i){
if(seenIds[i.itin_id]||latestGlobal.length>=15)return;
seenIds[i.itin_id]=true;
var langs=allForLatest.filter(function(x){return x.itin_id===i.itin_id;}).map(function(x){return x.lang;});
latestGlobal.push({itin_id:i.itin_id,slug:i.slug,country:i.country,title:i.title,days:i.days,created_at:i.created_at,langs:[].concat(new Set(langs))});
});
var latestOutput={version:1,generated_at:new Date().toISOString(),total_itineraries:allForLatest.length,latest_global:latestGlobal,latest_by_lang:latestByLang};
var latestPath=path.join(countriesDir,"latest-itineraries.json");
try{fs.writeFileSync(latestPath,JSON.stringify(latestOutput,null,2),"utf8");console.log("[OK] latest-itineraries.json: "+latestGlobal.length+" global, "+Object.keys(latestByLang).length+" langues");}catch(e){}
try{fs.writeFileSync(path.join(outputRoot,"latest-itineraries.json"),JSON.stringify(latestOutput,null,2),"utf8");}catch(e){}

// ============ DELETED-PAGES.JSON + _REDIRECTS ============
// Construire la map des pages actives : slug -> set de langs
var activeSlugs={};
SUPPORTED_LANGS.forEach(function(lang){(idxData[lang]||[]).forEach(function(p){
if(!activeSlugs[p.slug])activeSlugs[p.slug]={langs:{},cc:p.cc||"",themes:p.themes||[]};
activeSlugs[p.slug].langs[lang]=true;
});});
var activeCount=Object.keys(activeSlugs).length;
console.log("[REDIRECTS] Pages actives: "+activeCount+" slugs");

// Charger deleted-pages.json (ancien format: {version,total,pages:[{path,deleted_at}]})
var delPath=path.join(baseDir,"tools","deleted-pages.json");
var prevDeleted={version:1,updated_at:"",total:0,pages:[]};
try{
var raw=JSON.parse(fs.readFileSync(delPath,"utf8"));
if(raw&&raw.pages&&Array.isArray(raw.pages))prevDeleted=raw;
else if(Array.isArray(raw))prevDeleted={version:1,updated_at:"",total:raw.length,pages:raw};
}catch(e2){}

// Retirer de deleted-pages les pages qui sont de retour (recrées)
var resurrected=[];
var stillDeleted=[];
for(var di=0;di<prevDeleted.pages.length;di++){
var dp=prevDeleted.pages[di];
var dpPath=typeof dp==="string"?dp:(dp.path||"");
// dpPath format: "fr/itineraires/slug.html" (ancien) ou "itineraires/slug.html" (v2)
// Extraire slug et lang
var dpMatch=dpPath.match(/^(?:static-pages\/)?([a-z]{2})\/[^\/]+\/(.+?)\.html$/);
if(!dpMatch){
// Essayer format v2 direct: itineraires/slug.html
var dpMatch2=dpPath.match(/^([^\/]+)\/(.+?)\.html$/);
if(dpMatch2){
var dpFolder2=dpMatch2[1];
var dpSlug2=dpMatch2[2];
var dpLang2="";
for(var lk in LANG_FOLDERS){if(LANG_FOLDERS[lk]===dpFolder2){dpLang2=lk;break;}}
if(dpLang2&&activeSlugs[dpSlug2]&&activeSlugs[dpSlug2].langs[dpLang2]){
resurrected.push(dpPath);
}else{
stillDeleted.push(dp);
}
}else{
stillDeleted.push(dp);
}
continue;
}
var dpLang=dpMatch[1];
var dpSlug=dpMatch[2];
if(activeSlugs[dpSlug]&&activeSlugs[dpSlug].langs[dpLang]){
resurrected.push(dpPath);
}else{
stillDeleted.push(dp);
}
}

if(resurrected.length>0){
console.log("[REDIRECTS] "+resurrected.length+" pages ressuscitées (retirées des suppressions):");
resurrected.slice(0,10).forEach(function(r){console.log("  + "+r);});
if(resurrected.length>10)console.log("  ... et "+(resurrected.length-10)+" autres");
}

// Sauvegarder deleted-pages.json mis à jour
prevDeleted.pages=stillDeleted;
prevDeleted.total=stillDeleted.length;
prevDeleted.updated_at=new Date().toISOString();
try{
fs.writeFileSync(delPath,JSON.stringify(prevDeleted,null,2),"utf8");
console.log("[OK] deleted-pages.json: "+stillDeleted.length+" pages supprimées (après nettoyage)");
}catch(e){console.log("[WARN] deleted-pages.json: "+e.message);}

// ============ SMART REDIRECT : trouver la page la plus proche ============
// Pour chaque page morte, chercher un itinéraire actif du même pays + même langue
function findClosestPage(deadSlug,deadLang){
// Extraire le code pays du slug (2 premières lettres avant le premier -)
var ccMatch=deadSlug.match(/^([a-z]{2})-/);
if(!ccMatch)return null;
var deadCC=ccMatch[1].toUpperCase();

// Chercher un slug actif du même pays dans la même langue
var candidates=[];
for(var s in activeSlugs){
if(!activeSlugs[s].langs[deadLang])continue;
var sCC=(activeSlugs[s].cc||"").toUpperCase();
if(!sCC){
var sCCMatch=s.match(/^([a-z]{2})-/);
if(sCCMatch)sCC=sCCMatch[1].toUpperCase();
}
if(sCC===deadCC){
// Score de similarité simple : longueur du préfixe commun
var common=0;
for(var ci=0;ci<Math.min(s.length,deadSlug.length);ci++){
if(s[ci]===deadSlug[ci])common++;else break;
}
candidates.push({slug:s,score:common});
}
}
if(!candidates.length)return null;
// Trier par score décroissant
candidates.sort(function(a,b){return b.score-a.score;});
return candidates[0].slug;
}

// ============ GÉNÉRER _REDIRECTS ============
// Ordre Netlify : premier match gagne, de haut en bas.
// 1) Pages mortes (individuelles) — attrapées AVANT les wildcards
// 2) Highlights actifs (individuels) — slug-highlights → slug
// 3) Wildcards /static-pages/lang/folder/* → /folder/:splat (pages actives normales)
// 4) Fallback wildcard /static-pages/* → /index.html
// 5) SPA catch-all /* → /index.html 200

var redirectsLines=[];
redirectsLines.push("# ══════════════════════════════════════════════════════════════");
redirectsLines.push("# OneRoadTrip - Redirections Netlify v2");
redirectsLines.push("# Généré le: "+new Date().toISOString());
redirectsLines.push("# ══════════════════════════════════════════════════════════════");
redirectsLines.push("");

// --- SECTION 1 : Pages mortes → page la plus proche ou /index.html ---
// DOIT être AVANT les wildcards pour que le matching intelligent prime
redirectsLines.push("# Section 1 : Pages supprimées → page proche ou index");
var redirDelSmart=0;
var redirDelFallback=0;
for(var si=0;si<stillDeleted.length;si++){
var sdp=stillDeleted[si];
var sdPath=typeof sdp==="string"?sdp:(sdp.path||"");
var sdMatch=sdPath.match(/^(?:static-pages\/)?([a-z]{2})\/[^\/]+\/(.+?)\.html$/);
var sdLang,sdSlug,sdOldFolder;
if(!sdMatch){
var sdMatch2=sdPath.match(/^([^\/]+)\/(.+?)\.html$/);
if(!sdMatch2)continue;
var sdFolder=sdMatch2[1];
sdSlug=sdMatch2[2];
sdLang="";
for(var lk2 in LANG_FOLDERS){if(LANG_FOLDERS[lk2]===sdFolder){sdLang=lk2;break;}}
if(!sdLang)continue;
sdOldFolder=sdFolder;
}else{
sdLang=sdMatch[1];
sdSlug=sdMatch[2];
sdOldFolder=LANG_FOLDERS[sdLang]||"itineraires";
}
var newFolder=LANG_FOLDERS[sdLang]||"itineraires";
var closest=findClosestPage(sdSlug,sdLang);
var destUrl=closest?"/"+newFolder+"/"+closest+".html":"/index.html";
// Page morte : ancien chemin → destination
redirectsLines.push("/static-pages/"+sdLang+"/"+sdOldFolder+"/"+sdSlug+".html  "+destUrl+"  301");
redirectsLines.push("/static-pages/"+sdLang+"/"+sdOldFolder+"/"+sdSlug+"  "+destUrl+"  301");
// Highlight de la page morte aussi
redirectsLines.push("/static-pages/"+sdLang+"/"+sdOldFolder+"/"+sdSlug+"-highlights.html  "+destUrl+"  301");
redirectsLines.push("/static-pages/"+sdLang+"/"+sdOldFolder+"/"+sdSlug+"-highlights  "+destUrl+"  301");
if(closest){redirDelSmart+=4;}else{redirDelFallback+=4;}
}
redirectsLines.push("");
console.log("[REDIRECTS] Section 1 — Pages mortes → page proche: "+redirDelSmart+" règles");
console.log("[REDIRECTS] Section 1 — Pages mortes → /index.html: "+redirDelFallback+" règles");

// --- SECTION 2 : Highlights actifs → page v2 (individuels, pas de wildcard possible) ---
redirectsLines.push("# Section 2 : Highlights → page v2");
var redirHlCount=0;
for(var hSlug in activeSlugs){
var hData=activeSlugs[hSlug];
for(var hLang in hData.langs){
var hOldFolder=LANG_FOLDERS[hLang]||"itineraires";
var hNewFolder=LANG_FOLDERS[hLang]||"itineraires";
redirectsLines.push("/static-pages/"+hLang+"/"+hOldFolder+"/"+hSlug+"-highlights.html  /"+hNewFolder+"/"+hSlug+".html  301");
redirectsLines.push("/static-pages/"+hLang+"/"+hOldFolder+"/"+hSlug+"-highlights  /"+hNewFolder+"/"+hSlug+".html  301");
redirHlCount+=2;
}
}
redirectsLines.push("");
console.log("[REDIRECTS] Section 2 — Highlights actifs → v2: "+redirHlCount+" règles");

// --- SECTION 3 : Wildcards pages normales actives ---
// /static-pages/fr/itineraires/* → /itineraires/:splat 301
// Le splat transfère le nom du fichier tel quel. Si le fichier existe en v2 → servi.
// Si le fichier n'existe pas (slug changé mais pas dans deleted-pages) → SPA rattrape.
redirectsLines.push("# Section 3 : Wildcard ancien chemin → nouveau chemin");
var redirWildcardCount=0;
SUPPORTED_LANGS.forEach(function(wl){
var wf=LANG_FOLDERS[wl];
redirectsLines.push("/static-pages/"+wl+"/"+wf+"/*  /"+wf+"/:splat  301");
redirWildcardCount++;
});
redirectsLines.push("");
console.log("[REDIRECTS] Section 3 — Wildcards: "+redirWildcardCount+" règles");

// --- SECTION 4 : Fallback pour anciens chemins bizarres ---
redirectsLines.push("# Section 4 : Fallback anciens dossiers + static-pages restants");
redirectsLines.push("/static-pages/ar/itineraries/*  /index.html  301");
redirectsLines.push("/static-pages/it/percorsi/*  /index.html  301");
redirectsLines.push("/static-pages/*  /index.html  301");
redirectsLines.push("");

// --- SECTION 5 : SPA catch-all (DOIT être en dernier) ---
redirectsLines.push("# ══════════════════════════════════════════════════════════════");
redirectsLines.push("# RÈGLE SPA — Doit être EN DERNIER");
redirectsLines.push("# Fichiers statiques existants sont servis en priorité par Netlify");
redirectsLines.push("# ══════════════════════════════════════════════════════════════");
redirectsLines.push("/*    /index.html    200");

var redirectsContent=redirectsLines.join("\n");
var totalRedirRules=redirDelSmart+redirDelFallback+redirHlCount+redirWildcardCount+3+1;

// Écrire dans rootDir — la sync copie vers prod et test
var redirectsPath=path.join(rootDir,"_redirects");
try{
fs.writeFileSync(redirectsPath,redirectsContent,"utf8");
console.log("[OK] _redirects: "+redirectsLines.length+" lignes → "+redirectsPath);
}catch(e){console.log("[ERR] _redirects: "+e.message);}

console.log("[REDIRECTS] TOTAL: "+totalRedirRules+" règles");

console.log("\n=============================================");
console.log("  TERMINE: "+total+" pages, "+errs+" erreurs");
console.log("=============================================");

// ============ SYNC VERS PROD ET TEST ============
console.log("\n[SYNC] Synchronisation vers Ort prod et Ort test...");

// Patterns backup à exclure de la copie
var BACKUP_RE=[/\.bak$/i,/\.backup/i,/\.old$/i,/\.orig$/i,/\.tmp$/i,/_backup/i,/-backup/i,/_bak\./i,/_old\./i,/_copy\./i,/_copie\./i,/ - Copie/i,/ - Copy/i,/\(\d+\)\./,/^~/,/^backup_/i,/^anciens$/i,/^_backups/i,/secondary/i];
function isBackup(name){for(var i=0;i<BACKUP_RE.length;i++){if(BACKUP_RE[i].test(name))return true;}return false;}

var _syncSkipped=[];
function syncDir(src,dest,label){
if(!fs.existsSync(src))return 0;
if(!fs.existsSync(dest))fs.mkdirSync(dest,{recursive:true});
var count=0;
var entries;
try{entries=fs.readdirSync(src,{withFileTypes:true});}catch(e){return 0;}
for(var i=0;i<entries.length;i++){
var en=entries[i];
if(isBackup(en.name)){_syncSkipped.push(path.join(src,en.name));continue;}
if(en.name==="node_modules"||en.name===".git")continue;
var sp=path.join(src,en.name);
var dp=path.join(dest,en.name);
if(en.isDirectory()){
count+=syncDir(sp,dp,label);
}else{
try{fs.copyFileSync(sp,dp);count++;}catch(e){console.log("[SYNC] "+label+" ERR copie "+sp+": "+e.message);}
}
}
return count;
}

function cleanAndSync(src,dest,folderName,label){
var d=path.join(dest,folderName);
var s=path.join(src,folderName);
if(!fs.existsSync(s)){console.log("[SYNC] "+label+" SKIP "+folderName+" (source absente)");return 0;}
if(fs.existsSync(d)){
try{fs.rmSync(d,{recursive:true});console.log("[SYNC] "+label+" CLEAN "+d);}catch(e){console.log("[SYNC] "+label+" ERR clean "+d+": "+e.message);}
}
var n=syncDir(s,d,label);
console.log("[SYNC] "+label+" "+folderName+": "+n+" fichiers copiés");
return n;
}

var DEPLOY_TARGETS=[prodRoot,testRoot];
var langFolders=Object.keys(LANG_FOLDERS).map(function(k){return LANG_FOLDERS[k];});

DEPLOY_TARGETS.forEach(function(target){
if(!fs.existsSync(target)){console.log("[SYNC] SKIP "+target+" (dossier n'existe pas)");return;}
var label=target.indexOf("test")>=0?"TEST":"PROD";
var syncCount=0;
_syncSkipped=[];

console.log("\n============================================");
console.log("[SYNC] DEBUT "+label+" -> "+target);
console.log("============================================");

// 1. Itinéraires générés (clean + copie)
console.log("[SYNC] "+label+" --- Itinéraires ---");
langFolders.forEach(function(lf){
syncCount+=cleanAndSync(rootDir,target,lf,label);
});

// 2. Sitemaps + robots + _redirects
console.log("[SYNC] "+label+" --- Fichiers racine ---");
var rootFiles=["robots.txt","_redirects"];
try{
var rootEntries=fs.readdirSync(rootDir);
rootEntries.forEach(function(f){
if(/^sitemap.*\.xml$/.test(f))rootFiles.push(f);
});
}catch(e){}
rootFiles.forEach(function(f){
var sp=path.join(rootDir,f);
if(fs.existsSync(sp)){
try{fs.copyFileSync(sp,path.join(target,f));syncCount++;console.log("[SYNC] "+label+" COPIE "+f);}
catch(e){console.log("[SYNC] "+label+" ERR "+f+": "+e.message);}
}else{console.log("[SYNC] "+label+" SKIP "+f+" (absent)");}
});

// 3. latest-itineraries.json
["latest-itineraries.json"].forEach(function(f){
var sp=path.join(rootDir,f);
if(fs.existsSync(sp)){
try{fs.copyFileSync(sp,path.join(target,f));syncCount++;console.log("[SYNC] "+label+" COPIE "+f);}
catch(e){console.log("[SYNC] "+label+" ERR "+f+": "+e.message);}
}
});

// 4. data/ — EXACTEMENT ce qui est dans les screenshots de prod
console.log("[SYNC] "+label+" --- Data ---");
var dataDir=path.join(rootDir,"data");
var dataDest=path.join(target,"data");
if(!fs.existsSync(dataDest))fs.mkdirSync(dataDest,{recursive:true});

// 4a. data/*.json — 4 fichiers seulement
var DATA_ROOT_KEEP=["parks.fr.json","poi_img.json","stats.index.json","unesco.fr.json"];
DATA_ROOT_KEEP.forEach(function(f){
var sp2=path.join(dataDir,f);
if(fs.existsSync(sp2)){
try{fs.copyFileSync(sp2,path.join(dataDest,f));syncCount++;console.log("[SYNC] "+label+" COPIE data/"+f);}
catch(e){console.log("[SYNC] "+label+" ERR data/"+f+": "+e.message);}
}else{console.log("[SYNC] "+label+" SKIP data/"+f+" (absent)");}
});

// 4b. data/photos-json/ — seulement photos_lieux.json
var pjSrc=path.join(dataDir,"photos-json","photos_lieux.json");
var pjDest=path.join(dataDest,"photos-json");
if(fs.existsSync(pjSrc)){
if(!fs.existsSync(pjDest))fs.mkdirSync(pjDest,{recursive:true});
try{fs.copyFileSync(pjSrc,path.join(pjDest,"photos_lieux.json"));syncCount++;console.log("[SYNC] "+label+" COPIE data/photos-json/photos_lieux.json");}
catch(e){console.log("[SYNC] "+label+" ERR photos_lieux.json: "+e.message);}
}

// 4c. data/country-guides/ — copie complète (tous les .txt dans les sous-dossiers lang)
syncCount+=cleanAndSync(dataDir,dataDest,"country-guides",label);

// 4d. data/Roadtripsprefabriques/stats.index.json
var rpSrc=path.join(dataDir,"Roadtripsprefabriques");
var rpDest=path.join(dataDest,"Roadtripsprefabriques");
if(!fs.existsSync(rpDest))fs.mkdirSync(rpDest,{recursive:true});
var rpStatsSrc=path.join(rpSrc,"stats.index.json");
if(fs.existsSync(rpStatsSrc)){
try{fs.copyFileSync(rpStatsSrc,path.join(rpDest,"stats.index.json"));syncCount++;console.log("[SYNC] "+label+" COPIE Roadtripsprefabriques/stats.index.json");}
catch(e){}
}

// 4e. data/Roadtripsprefabriques/countries/ — dossiers pays + 3 JSON racine
var countriesSrc=path.join(rpSrc,"countries");
var countriesDest=path.join(rpDest,"countries");
if(fs.existsSync(countriesSrc)){
// Clean ancien
if(fs.existsSync(countriesDest)){try{fs.rmSync(countriesDest,{recursive:true});console.log("[SYNC] "+label+" CLEAN "+countriesDest);}catch(e){}}
if(!fs.existsSync(countriesDest))fs.mkdirSync(countriesDest,{recursive:true});
var countryEntries;
try{countryEntries=fs.readdirSync(countriesSrc,{withFileTypes:true});}catch(e){countryEntries=[];}
var ccCount=0;
// Les 3 JSON autorisés à la racine de countries
var COUNTRIES_ROOT_KEEP={"countries.index.json":1,"latest-itineraries.json":1,"themes.i18n.json":1};
// Pattern fichiers autorisés dans les dossiers pays
var COUNTRY_FILE_RE=/\.(itins\.modules|places\.master)-[a-z]{2}\.json$/;
for(var ci=0;ci<countryEntries.length;ci++){
var ce=countryEntries[ci];
if(ce.isDirectory()&&/^[A-Z]{2}$/.test(ce.name)){
// Dossier pays — copier seulement itins.modules et places.master
var ccDir=path.join(countriesSrc,ce.name);
var ccDest2=path.join(countriesDest,ce.name);
if(!fs.existsSync(ccDest2))fs.mkdirSync(ccDest2,{recursive:true});
var ccFiles;
try{ccFiles=fs.readdirSync(ccDir);}catch(e){ccFiles=[];}
for(var fi=0;fi<ccFiles.length;fi++){
var cf=ccFiles[fi];
if(COUNTRY_FILE_RE.test(cf)){
try{fs.copyFileSync(path.join(ccDir,cf),path.join(ccDest2,cf));ccCount++;}
catch(e){}
}
}
}else if(ce.isFile()&&COUNTRIES_ROOT_KEEP[ce.name]){
try{fs.copyFileSync(path.join(countriesSrc,ce.name),path.join(countriesDest,ce.name));ccCount++;
console.log("[SYNC] "+label+" COPIE countries/"+ce.name);}
catch(e){}
}
}
console.log("[SYNC] "+label+" countries: "+ccCount+" fichiers copiés (dossiers pays + 3 JSON)");
syncCount+=ccCount;
}

// 8. Pour TEST : écrire le _headers noindex
if(label==="TEST"){
try{
fs.writeFileSync(path.join(target,"_headers"),"/*\n  X-Robots-Tag: noindex, nofollow\n","utf8");
console.log("[SYNC] "+label+" ECRIT _headers (noindex, nofollow)");
}catch(e){console.log("[SYNC] "+label+" ERR _headers: "+e.message);}
}

// Résumé backups ignorés
if(_syncSkipped.length>0){
console.log("[SYNC] "+label+" --- Backups ignorés: "+_syncSkipped.length+" ---");
_syncSkipped.forEach(function(s){console.log("[SYNC] "+label+" SKIP backup: "+path.basename(s));});
}

console.log("============================================");
console.log("[SYNC] "+label+" TERMINE: "+syncCount+" fichiers vers "+target);
console.log("============================================");
});
}
main();
