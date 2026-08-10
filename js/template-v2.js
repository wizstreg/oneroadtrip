"use strict";
var PROD_URL="https://www.oneroadtrip.com";
var SLANGS=["fr","en","es","pt","it","ar"];
var LSLUG={fr:"itineraires",en:"itineraries",es:"rutas",pt:"roteiros",it:"itinerari",ar:"masar"};
var LFLG={fr:"\ud83c\uddeb\ud83c\uddf7",en:"\ud83c\uddec\ud83c\udde7",es:"\ud83c\uddea\ud83c\uddf8",pt:"\ud83c\uddf5\ud83c\uddf9",it:"\ud83c\uddee\ud83c\uddf9",ar:"\ud83c\uddf8\ud83c\udde6"};
var LNAM={fr:"Fran\u00e7ais",en:"English",es:"Espa\u00f1ol",pt:"Portugu\u00eas",it:"Italiano",ar:"\u0627\u0644\u0639\u0631\u0628\u064a\u0629"};
var UI={
fr:{days:"Jours",day:"Jour",step:"\u00c9tape",km:"km",steps:"\u00e9tapes",activities:"Activit\u00e9s",nearbyItins:"D\u00e9couvrez aussi",travelAdvice:"Conseils aux voyageurs",officialAdvice:"Recommandations officielles",allItineraries:"Tous les itin\u00e9raires",copyright:"OneRoadTrip",diffMarker:"Itin\u00e9raire gratuit, personnalisable, accessible partout.",bestPeriod:"Meilleure p\u00e9riode",notes:"Notes importantes",highlights:"Points forts",ctaBtn:"Personnaliser cet itin\u00e9raire",ctaTitle:"Faites-en VOTRE voyage",ctaFree:"100% Gratuit",driveToNext:"Vers l\u2019\u00e9tape suivante",expandMap:"Plein \u00e9cran",lastUpdate:"Mis \u00e0 jour",disclaimer:"Itin\u00e9raires construits \u00e0 partir de sources touristiques officielles. V\u00e9rifiez et adaptez.",idealDuration:"Dur\u00e9e id\u00e9ale",idealDurationText:"Pour en profiter pleinement, pr\u00e9voyez entre {min} et {max} jours.",weather:"\u00c0 quoi vous attendre pour la m\u00e9t\u00e9o\u00a0?",discover:"Que d\u00e9couvrir en {country}\u00a0?",backToMap:"Voir la carte",faqDuration:"Combien de jours pr\u00e9voir\u00a0?",addPlace:"Ajoutez cet endroit \u00e0 votre itin\u00e9raire",centerMap:"Recentrer",seeItinerary:"Voir l\u2019itin\u00e9raire jour par jour \u25bc",practicalInfo:"Infos pratiques",tripsBtn:"Vos voyages"},
en:{days:"Days",day:"Day",step:"Stop",km:"km",steps:"stops",activities:"Activities",nearbyItins:"Also discover",travelAdvice:"Travel advice",officialAdvice:"Official recommendations",allItineraries:"All itineraries",copyright:"OneRoadTrip",diffMarker:"Free itinerary, customizable, accessible anywhere.",bestPeriod:"Best period",notes:"Important notes",highlights:"Highlights",ctaBtn:"Customize this itinerary",ctaTitle:"Make it YOUR trip",ctaFree:"100% Free",driveToNext:"Drive to next stop",expandMap:"Fullscreen",lastUpdate:"Updated",disclaimer:"Built from official tourism sources. Verify and adapt.",idealDuration:"Ideal duration",idealDurationText:"To make the most of it, plan between {min} and {max} days.",weather:"What weather should you expect?",discover:"What to discover in {country}?",backToMap:"Back to map",faqDuration:"How many days should I plan?",addPlace:"Add this place to your itinerary",centerMap:"Center",seeItinerary:"See the day-by-day itinerary \u25bc",practicalInfo:"Practical info",tripsBtn:"Your trips"},
es:{days:"D\u00edas",day:"D\u00eda",step:"Etapa",km:"km",steps:"paradas",activities:"Actividades",nearbyItins:"Descubre tambi\u00e9n",travelAdvice:"Consejos de viaje",officialAdvice:"Recomendaciones oficiales",allItineraries:"Todos los itinerarios",copyright:"OneRoadTrip",diffMarker:"Itinerario gratis, personalizable.",bestPeriod:"Mejor \u00e9poca",notes:"Notas",highlights:"Destacados",ctaBtn:"Personaliza este itinerario",ctaTitle:"Haz de este TU viaje",ctaFree:"100% Gratis",driveToNext:"Trayecto siguiente",expandMap:"Pantalla completa",lastUpdate:"Actualizado",disclaimer:"Construidos a partir de fuentes tur\u00edsticas oficiales.",idealDuration:"Duraci\u00f3n ideal",idealDurationText:"Para aprovecharlo al m\u00e1ximo, prev\u00e9 entre {min} y {max} d\u00edas.",weather:"\u00bfQu\u00e9 clima esperar?",discover:"\u00bfQu\u00e9 descubrir en {country}?",backToMap:"Ver el mapa",faqDuration:"\u00bfCu\u00e1ntos d\u00edas deber\u00eda planificar?",addPlace:"A\u00f1ade este lugar a tu itinerario",centerMap:"Centrar",seeItinerary:"Ver el itinerario d\u00eda a d\u00eda \u25bc",practicalInfo:"Info pr\u00e1ctica",tripsBtn:"Tus viajes"},
pt:{days:"Dias",day:"Dia",step:"Etapa",km:"km",steps:"paragens",activities:"Atividades",nearbyItins:"Descubra tamb\u00e9m",travelAdvice:"Conselhos",officialAdvice:"Recomenda\u00e7\u00f5es oficiais",allItineraries:"Todos os itiner\u00e1rios",copyright:"OneRoadTrip",diffMarker:"Itiner\u00e1rio gratuito, personaliz\u00e1vel.",bestPeriod:"Melhor \u00e9poca",notes:"Notas",highlights:"Destaques",ctaBtn:"Personalize este itiner\u00e1rio",ctaTitle:"Fa\u00e7a desta a SUA viagem",ctaFree:"100% Gratuito",driveToNext:"Trajeto seguinte",expandMap:"Ecr\u00e3 inteiro",lastUpdate:"Atualizado",disclaimer:"Constru\u00eddos a partir de fontes tur\u00edsticas oficiais.",idealDuration:"Dura\u00e7\u00e3o ideal",idealDurationText:"Para aproveitar ao m\u00e1ximo, preveja entre {min} e {max} dias.",weather:"Que clima esperar?",discover:"O que descobrir em {country}?",backToMap:"Ver o mapa",faqDuration:"Quantos dias devo planejar?",addPlace:"Adicione este lugar ao seu itiner\u00e1rio",centerMap:"Centrar",seeItinerary:"Ver o itiner\u00e1rio dia a dia \u25bc",practicalInfo:"Info pr\u00e1tica",tripsBtn:"As tuas viagens"},
it:{days:"Giorni",day:"Giorno",step:"Tappa",km:"km",steps:"tappe",activities:"Attivit\u00e0",nearbyItins:"Scopri anche",travelAdvice:"Consigli",officialAdvice:"Raccomandazioni ufficiali",allItineraries:"Tutti gli itinerari",copyright:"OneRoadTrip",diffMarker:"Itinerario gratuito, personalizzabile.",bestPeriod:"Periodo migliore",notes:"Note",highlights:"Punti salienti",ctaBtn:"Personalizza questo itinerario",ctaTitle:"Fallo diventare il TUO viaggio",ctaFree:"100% Gratuito",driveToNext:"Tragitto successivo",expandMap:"Schermo intero",lastUpdate:"Aggiornato",disclaimer:"Costruiti da fonti turistiche ufficiali.",idealDuration:"Durata ideale",idealDurationText:"Per goderti al meglio, prevedi tra {min} e {max} giorni.",weather:"Che tempo aspettarsi?",discover:"Cosa scoprire in {country}?",backToMap:"Torna alla mappa",faqDuration:"Quanti giorni dovrei pianificare?",addPlace:"Aggiungi questo luogo al tuo itinerario",centerMap:"Centra",seeItinerary:"Vedi l\u2019itinerario giorno per giorno \u25bc",practicalInfo:"Info pratiche",tripsBtn:"I tuoi viaggi"},
ar:{days:"\u0623\u064a\u0627\u0645",day:"\u064a\u0648\u0645",step:"\u0645\u062d\u0637\u0629",km:"\u0643\u0645",steps:"\u0645\u062d\u0637\u0627\u062a",activities:"\u0623\u0646\u0634\u0637\u0629",nearbyItins:"\u0627\u0643\u062a\u0634\u0641 \u0623\u064a\u0636\u0627\u064b",travelAdvice:"\u0646\u0635\u0627\u0626\u062d",officialAdvice:"\u0627\u0644\u062a\u0648\u0635\u064a\u0627\u062a \u0627\u0644\u0631\u0633\u0645\u064a\u0629",allItineraries:"\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062a",copyright:"OneRoadTrip",diffMarker:"\u0645\u0633\u0627\u0631 \u0645\u062c\u0627\u0646\u064a.",bestPeriod:"\u0623\u0641\u0636\u0644 \u0641\u062a\u0631\u0629",notes:"\u0645\u0644\u0627\u062d\u0638\u0627\u062a",highlights:"\u0623\u0628\u0631\u0632 \u0627\u0644\u0645\u0639\u0627\u0644\u0645",ctaBtn:"\u062e\u0635\u0635 \u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u0627\u0631",ctaTitle:"\u0627\u062c\u0639\u0644\u0647\u0627 \u0631\u062d\u0644\u062a\u0643",ctaFree:"\u0645\u062c\u0627\u0646\u064a 100%",driveToNext:"\u0627\u0644\u0637\u0631\u064a\u0642 \u0627\u0644\u062a\u0627\u0644\u064a",expandMap:"\u0634\u0627\u0634\u0629 \u0643\u0627\u0645\u0644\u0629",lastUpdate:"\u0622\u062e\u0631 \u062a\u062d\u062f\u064a\u062b",disclaimer:"\u0645\u0633\u0627\u0631\u0627\u062a \u0645\u0628\u0646\u064a\u0629 \u0645\u0646 \u0645\u0635\u0627\u062f\u0631 \u0633\u064a\u0627\u062d\u064a\u0629 \u0631\u0633\u0645\u064a\u0629.",idealDuration:"\u0627\u0644\u0645\u062f\u0629 \u0627\u0644\u0645\u062b\u0627\u0644\u064a\u0629",idealDurationText:"\u0644\u0644\u0627\u0633\u062a\u0645\u062a\u0627\u0639 \u0628\u0627\u0644\u0643\u0627\u0645\u0644\u060c \u062e\u0637\u0637 \u0628\u064a\u0646 {min} \u0648 {max} \u064a\u0648\u0645.",weather:"\u0645\u0627 \u0627\u0644\u0637\u0642\u0633 \u0627\u0644\u0645\u062a\u0648\u0642\u0639\u061f",discover:"\u0645\u0627\u0630\u0627 \u062a\u0643\u062a\u0634\u0641 \u0641\u064a {country}\u061f",backToMap:"\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0627\u0644\u062e\u0631\u064a\u0637\u0629",faqDuration:"\u0643\u0645 \u064a\u0648\u0645\u0627\u064b \u064a\u062c\u0628 \u0623\u0646 \u0623\u062e\u0637\u0637\u061f",addPlace:"\u0623\u0636\u0641 \u0647\u0630\u0627 \u0627\u0644\u0645\u0643\u0627\u0646 \u0625\u0644\u0649 \u0645\u0633\u0627\u0631\u0643",centerMap:"\u062a\u0648\u0633\u064a\u0637",seeItinerary:"\u0634\u0627\u0647\u062f \u0627\u0644\u0645\u0633\u0627\u0631 \u064a\u0648\u0645\u0627\u064b \u0628\u064a\u0648\u0645 \u25bc",practicalInfo:"\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0639\u0645\u0644\u064a\u0629",tripsBtn:"\u0631\u062d\u0644\u0627\u062a\u0643"}
};
var SUPPORT_MSG={
fr:"ORT est totalement gratuit et souhaite le rester. En cliquant sur nos liens, m\u00eame si vous ne prenez pas nos h\u00f4tels conseill\u00e9s, deux \u00e0 trois euros nous seront revers\u00e9s sans que vous n\u2019ayez \u00e0 payer plus cher. Pensez-y avant de r\u00e9server.",
en:"ORT is completely free and we want to keep it that way. By clicking our links, even if you don\u2019t book the hotels we suggest, a few euros will come back to us at no extra cost to you. Keep this in mind before booking.",
es:"ORT es totalmente gratuito y queremos que siga as\u00ed. Al hacer clic en nuestros enlaces, aunque no reserves los hoteles que sugerimos, recibimos unos euros sin que pagues m\u00e1s. Tenlo en cuenta antes de reservar.",
pt:"O ORT \u00e9 totalmente gratuito e queremos que continue assim. Ao clicar nos nossos links, mesmo que n\u00e3o reserve os hot\u00e9is que sugerimos, recebemos alguns euros sem que pague mais. Lembre-se disso antes de reservar.",
it:"ORT \u00e8 completamente gratuito e vogliamo che rimanga cos\u00ec. Cliccando sui nostri link, anche se non prenoti gli hotel che suggeriamo, riceviamo qualche euro senza che tu paghi di pi\u00f9. Ricordalo prima di prenotare.",
ar:"\u0645\u0648\u0642\u0639 ORT \u0645\u062c\u0627\u0646\u064a \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0648\u0646\u0631\u064a\u062f \u0623\u0646 \u064a\u0628\u0642\u0649 \u0643\u0630\u0644\u0643. \u0628\u0627\u0644\u0646\u0642\u0631 \u0639\u0644\u0649 \u0631\u0648\u0627\u0628\u0637\u0646\u0627\u060c \u062d\u062a\u0649 \u0644\u0648 \u0644\u0645 \u062a\u062d\u062c\u0632 \u0627\u0644\u0641\u0646\u0627\u062f\u0642 \u0627\u0644\u062a\u064a \u0646\u0642\u062a\u0631\u062d\u0647\u0627\u060c \u0633\u0646\u062d\u0635\u0644 \u0639\u0644\u0649 \u0628\u0636\u0639\u0629 \u064a\u0648\u0631\u0648\u0647\u0627\u062a \u062f\u0648\u0646 \u0623\u0646 \u062a\u062f\u0641\u0639 \u0623\u0643\u062b\u0631. \u062a\u0630\u0643\u0631 \u0630\u0644\u0643 \u0642\u0628\u0644 \u0627\u0644\u062d\u062c\u0632."
};
var SUPPORT_TITLE={fr:"Soutenez-nous en r\u00e9servant vos h\u00f4tels via OneRoadTrip",en:"Support us by booking your hotels via OneRoadTrip",es:"Ap\u00f3yanos reservando tus hoteles a trav\u00e9s de OneRoadTrip",pt:"Apoie-nos reservando seus hot\u00e9is pelo OneRoadTrip",it:"Sostienici prenotando i tuoi hotel tramite OneRoadTrip",ar:"\u0627\u062f\u0639\u0645\u0646\u0627 \u0628\u062d\u062c\u0632 \u0641\u0646\u0627\u062f\u0642\u0643 \u0639\u0628\u0631 OneRoadTrip"};
var SUPPORT_OK={fr:"Compris\u00a0!",en:"Got it!",es:"\u00a1Entendido!",pt:"Entendido!",it:"Capito!",ar:"\u0641\u0647\u0645\u062a!"};
var SUPPORT_BOOK={fr:"R\u00e9server un h\u00f4tel",en:"Book a hotel",es:"Reservar un hotel",pt:"Reservar um hotel",it:"Prenota un hotel",ar:"\u0627\u062d\u062c\u0632 \u0641\u0646\u062f\u0642\u0627\u064b"};
var GOV={fr:{b:"https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/conseils-par-pays-destination/",n:"France Diplomatie",c:{IE:"irlande/",GB:"royaume-uni/",ES:"espagne/",IT:"italie/",PT:"portugal/",DE:"allemagne/",US:"etats-unis/",AU:"australie/",JP:"japon/",MA:"maroc/",TH:"thailande/",BR:"bresil/",MX:"mexique/",ZA:"afrique-du-sud/",IN:"inde/",TR:"turquie/",GR:"grece/",HR:"croatie/",IS:"islande/",NO:"norvege/"}},en:{b:"https://www.gov.uk/foreign-travel-advice/",n:"UK Travel Advice",c:{IE:"ireland",GB:"uk",ES:"spain",IT:"italy",PT:"portugal",DE:"germany",US:"usa",AU:"australia",JP:"japan",MA:"morocco",TH:"thailand",BR:"brazil",MX:"mexico",ZA:"south-africa",IN:"india",TR:"turkey",GR:"greece",HR:"croatia",IS:"iceland",NO:"norway"}}};
function gAdv(cc,lang){var a=GOV[lang]||GOV.en;if(a.c[cc])return{url:a.b+a.c[cc],name:a.n};var f=GOV.en;if(f.c[cc])return{url:f.b+f.c[cc],name:f.n};return null;}
function esc(s){return s?String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}
function drvT(m){if(!m)return"";var h=Math.floor(m/60),mn=m%60;return h>0?(mn>0?h+"h"+String(mn).padStart(2,"0"):h+"h"):mn+"min";}
function stars(r){if(!r||r<=0)return"";var n=Math.round(r/2);if(n<1)n=1;if(n>5)n=5;return"\u2605".repeat(n)+"\u2606".repeat(5-n);}

function generateHTML(P){
var itin=P.itin,photos=P.photos,places=P.places,lang=P.lang,nearby=P.allItinsForLang||[],H=P.helpers;
var t=UI[lang]||UI.fr;
var st=H.stats(itin.days_plan,itin.estimated_days_base);
var cc=itin.country||(itin.itin_id?itin.itin_id.split("::")[0]:"XX");
var country=H.COUNTRIES[cc]||cc;
var s=H.slug(itin.itin_id||itin.id);
var itinId=itin.itin_id||itin.id;
var dir=lang==="ar"?' dir="rtl"':"";
var detL="/roadtrip_detail.html?cc="+cc+"&itin="+encodeURIComponent(itinId)+"&lang="+lang+"&days="+st.totalDays;
var can=PROD_URL+"/"+LSLUG[lang]+"/"+s+".html";
var hlg=SLANGS.map(function(l){return'<link rel="alternate" hreflang="'+l+'" href="'+PROD_URL+"/"+LSLUG[l]+"/"+s+'.html">';}).join("\n")+'<link rel="alternate" hreflang="x-default" href="'+PROD_URL+"/itineraries/"+s+'.html">';
// Hero
var hero=null;
for(var i=0;i<itin.days_plan.length;i++){var dp=itin.days_plan[i];var pid=dp.place_id||(dp.night?dp.night.place_id:null);hero=H.getPhoto(pid,photos,places);if(hero)break;}
if(!hero)hero="/assets/image_index.webp";
hero=H.optimizeHero(hero);
// SEO
var seo=itin.seo||{};
var h1=esc(seo.h1_title||itin.title);
var intro=seo.intro_paragraph||itin.subtitle||"";
var hook=esc(seo.seo_hook||intro);
var feat=seo.featured_list||[];
var ptag=seo.places_taglines||{};
var prac=itin.practical_context||{};
var bmo=(prac.best_months||[]).join(", ");
var phl=prac.highlights||[];
var pubD=(H.ITINERARIES_DATES&&H.ITINERARIES_DATES[itinId])||itin.created_at||new Date().toISOString();
var modD=new Date().toISOString().split("T")[0];
// Country guide data
var guide={weather:"",experiences:"",warning:""};
if(H.loadCountryGuide){guide=H.loadCountryGuide(cc,lang);}
// Groups
var BKLANG={fr:"fr",en:"en-gb",es:"es",pt:"pt-pt",it:"it",ar:"ar"};
var bkSuf=BKLANG[lang]||"en-gb";
var htls=H.HOTELS||{};
var grp=itin.days_plan.map(function(day,idx){
var pid2=day.place_id||(day.night?day.night.place_id:null);
var co=day.night?day.night.coords:null;
var kw=day.night?(day.night.map_keywords||[]):[];
var ph=H.getPhoto(pid2,photos,places);
ph=ph?H.optimizeCard(ph):null;
// Photos alternatives pour fallback si Wikimedia rate-limited
var phAlts=[];
if(pid2){var allPh=H.getPhotos(pid2,photos,places,4);phAlts=allPh.slice(1).map(function(p2){return H.optimizeCard(p2);}).filter(function(p2){return p2&&p2!==ph;});}
// Meilleur hotel
var htl=null;
var pName=H.placeName(pid2,places,lang);
var hd=htls[pid2]||htls[pName];
if(hd&&hd.hotels&&hd.hotels.length){
var best=hd.hotels.slice().sort(function(a,b){return(b.score||0)-(a.score||0);})[0];
if(best){
var hLink="#";
if(best.bookingUrl){var m=best.bookingUrl.match(/https:\/\/www\.booking\.com\/hotel\/([a-z]{2})\/([^.?]+)/);if(m)hLink="https://www.booking.com/hotel/"+m[1]+"/"+m[2]+"."+bkSuf+".html";}
var hImg=best.imageUrl?best.imageUrl.replace("square240","square600"):"";
htl={name:best.name||"",score:best.score||"",img:hImg,url:hLink};
}}
return{day:idx+1,pid:pid2,name:pName,tag:ptag[pid2]||"",co:co,kw:kw,vis:day.visits||[],act:day.activities||[],nxt:day.to_next_leg,rat:day.rating||H.getRating(pid2,places),photo:ph,photoAlts:phAlts,hotel:htl};
});
var photoCount=grp.filter(function(g){return g.photo;}).length;
// Calcul duree ideale
var seenPids={};var totalSugDays=0;
grp.forEach(function(g){if(g.pid&&!seenPids[g.pid]){seenPids[g.pid]=true;var pl=places.find(function(p){return p.place_id===g.pid;});totalSugDays+=(pl&&pl.suggested_days)?pl.suggested_days:1;}});
var idealMin=Math.max(1,Math.round(totalSugDays)-2);
var idealMax=Math.round(totalSugDays)+2;
var idealText=t.idealDurationText.replace("{min}",idealMin).replace("{max}",idealMax);
// Route simplifiée : noms uniques des étapes
var routeNames=[];var seenRouteNames={};
grp.forEach(function(g){if(g.name&&!seenRouteNames[g.name]){seenRouteNames[g.name]=true;routeNames.push(g.name);}});
var routeText=routeNames.join(" → ");
var mp=grp.filter(function(g){return g.co;}).map(function(g){return{day:g.day,name:g.name,lat:g.co[0],lng:g.co[1],tag:g.tag,photo:g.photo||"",photoAlts:g.photoAlts||[],htl:g.hotel||null};});
// Other places
var usedP={};grp.forEach(function(g){if(g.pid)usedP[g.pid]=1;});
var op=places.filter(function(p){return!usedP[p.place_id]&&p.coords&&p.coords[0]&&p.coords[1];}).map(function(p){var kw=(p.map_keywords||[]).slice(0,4).join(", ");return{name:p.name,lat:p.coords[0],lng:p.coords[1],rat:p.rating||0,kw:kw,pid:p.place_id};});
// Nearby — utiliser nearby_itins du JSON si disponible, sinon fallback par pays
var nbRaw=[];
var nearbyIds=itin.nearby_itins||[];
if(nearbyIds.length){
// Chercher les itinéraires correspondants dans la liste complète
nearbyIds.forEach(function(nid){
var found=nearby.find(function(it){return(it.itin_id||it.id)===nid;});
if(found&&(found.itin_id||found.id)!==itinId)nbRaw.push(found);
});
}
// Fallback : si pas assez de résultats, compléter avec le même pays
if(nbRaw.length<6){
var usedIds={};nbRaw.forEach(function(it){usedIds[it.itin_id||it.id]=true;});
nearby.forEach(function(it){
if(nbRaw.length>=6)return;
var nid=it.itin_id||it.id;if(nid===itinId||usedIds[nid])return;
var nc2=it.country||(nid?nid.split("::")[0]:"");
if(nc2.toUpperCase()===cc.toUpperCase())nbRaw.push(it);
});
}
var nb=nbRaw.slice(0,6).map(function(it){
var ns=H.stats(it.days_plan||[],it.estimated_days_base);var nsl=H.slug(it.itin_id||it.id);var nc=it.country||(it.itin_id?it.itin_id.split("::")[0]:"XX");
return{title:(it.seo&&it.seo.h1_title)||it.title,slug:nsl,days:ns.totalDays,km:ns.km,stops:ns.stops,country:H.COUNTRIES[nc]||nc};});
// Schema TouristTrip
var sch={"@context":"https://schema.org","@type":"TouristTrip","name":seo.h1_title||itin.title,"description":seo.seo_hook||intro,
"duration":"P"+Math.round(st.totalDays)+"D","image":hero,
"touristType":(itin.meta&&itin.meta.audience&&itin.meta.audience[0])||"Travelers",
"itinerary":{"@type":"ItemList","numberOfItems":grp.length,"itemListElement":grp.map(function(g,i){var it={"@type":"ListItem","position":i+1,"name":g.name};if(g.co)it.item={"@type":"Place","name":g.name,"geo":{"@type":"GeoCoordinates","latitude":g.co[0],"longitude":g.co[1]}};return it;})}};
// Schema BreadcrumbList
var bcL={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
{"@type":"ListItem","position":1,"name":"OneRoadTrip","item":PROD_URL+"/index.html"},
{"@type":"ListItem","position":2,"name":country,"item":PROD_URL+"/index.html?country="+cc},
{"@type":"ListItem","position":3,"name":seo.h1_title||itin.title}
]};
// Lang switcher
var lsw=SLANGS.map(function(l){return'<a href="/'+LSLUG[l]+"/"+s+'.html" class="lo'+(l===lang?" ac":"")+'">'+LFLG[l]+" "+LNAM[l]+"</a>";}).join("");
var adv=gAdv(cc,lang);
// Days HTML
var dH="";
grp.forEach(function(g){
// Map keywords cliquables vers Google Maps
var kwH="";if(g.kw&&g.kw.length){kwH='<div class="kw-bar">'+g.kw.map(function(k){return'<a class="kw-tag" href="https://www.google.com/maps/search/'+encodeURIComponent(k)+'" target="_blank" rel="noopener">\ud83d\udccd '+esc(k)+'</a>';}).join("")+"</div>";}
var vH=g.vis.map(function(v,vi){return'<div class="vi"><div class="vm">'+(vi+1)+'</div><div class="vc"><p>'+v.text+"</p>"+(v.visit_duration_min?'<span class="vd">\u23f1 '+v.visit_duration_min+" min</span>":"")+"</div></div>";}).join("");
var aH="";if(g.act.length)aH='<div class="ab"><h4>'+t.activities+"</h4>"+g.act.map(function(a){return'<div class="ai"><p>'+a.text+"</p>"+(a.activity_duration_min?'<span class="vd">\u23f1 '+a.activity_duration_min+" min</span>":"")+"</div>";}).join("")+"</div>";
var nH="";if(g.nxt&&g.nxt.distance_km)nH='<div class="nl"><span>\ud83d\ude97</span><span>'+t.driveToNext+": <b>"+Math.round(g.nxt.distance_km)+" km</b> \u00b7 <b>"+drvT(g.nxt.drive_min)+"</b></span></div>";
var cm="";if(g.co)cm='<span itemprop="geo" itemscope itemtype="https://schema.org/GeoCoordinates"><meta itemprop="latitude" content="'+g.co[0]+'"><meta itemprop="longitude" content="'+g.co[1]+'"></span>';
var dayPhoto="";if(g.photo){var isWk=g.photo.indexOf("wikimedia")>=0;var fbStr=g.photoAlts&&g.photoAlts.length?g.photoAlts.map(function(u){return esc(u);}).join("|"):"";var fbAttr=fbStr?' data-fallbacks="'+fbStr+'"':"";if(isWk){dayPhoto='<div class="dp-inline"><img data-src="'+g.photo+'" class="wk-lazy"'+fbAttr+' alt="'+esc(g.name)+'" loading="lazy" width="600" height="200"></div>';}else{dayPhoto='<div class="dp-inline"><img src="'+g.photo+'"'+fbAttr+' alt="'+esc(g.name)+'" loading="lazy" width="600" height="200" onerror="var fb=this.getAttribute(\'data-fallbacks\');if(fb){var arr=fb.split(\'|\');this.removeAttribute(\'data-fallbacks\');this.src=arr[0];if(arr.length>1)this.setAttribute(\'data-fallbacks\',arr.slice(1).join(\'|\'));}else{this.parentNode.style.display=\'none\';}"></div>';}}
var htlH="";if(g.hotel&&g.hotel.name){htlH='<a class="htl-inline" href="'+g.hotel.url+'" target="_blank" rel="noopener sponsored">'+(g.hotel.img?'<img src="'+g.hotel.img+'" alt="'+esc(g.hotel.name)+'" loading="lazy" width="70" height="70">':'')+'<div class="htl-info"><span class="htl-name">'+esc(g.hotel.name)+'</span>'+(g.hotel.score?'<span class="htl-score">'+g.hotel.score+'</span>':'')+'</div></a>';}
dH+='<section class="ds" id="day-'+g.day+'" data-day="'+g.day+'"'+(g.co?' data-lat="'+g.co[0]+'" data-lng="'+g.co[1]+'"':"")+">"+'<div class="dh" onclick="sD('+g.day+')">'+'<div class="db">'+t.step+" "+g.day+"</div>"+'<div class="di"><h3>'+esc(g.name)+"</h3>"+(g.tag?'<p class="dt">'+esc(g.tag)+"</p>":"")+"</div>"+(g.rat?'<div class="dr">'+stars(g.rat)+"</div>":"")+"</div>"+dayPhoto+kwH+'<div style="display:none" itemscope itemtype="https://schema.org/Place"><meta itemprop="name" content="'+esc(g.name)+'">'+cm+"</div>"+'<div class="dd">'+vH+aH+"</div>"+htlH+nH+"</section>";
});
// Highlights
var hlI=(phl.length?phl:feat).map(function(x){return"<li>"+x+"</li>";}).join("");
// Nearby HTML
var nbH="";if(nb.length)nbH='<section class="ns"><h2>'+t.nearbyItins+"</h2>"+'<div class="ng">'+nb.map(function(n){return'<a href="/'+LSLUG[lang]+"/"+n.slug+'.html" class="nc"><h3>'+esc(n.title)+"</h3>"+'<p class="nm">'+Math.round(n.days)+" "+t.days.toLowerCase()+" \u00b7 "+n.km+" km \u00b7 "+n.stops+" "+t.steps+" \u00b7 "+esc(n.country)+"</p></a>";}).join("")+"</div></section>";
// Prev/Next arrows
var prevIt=nb.length>=1?nb[0]:null;
var nextIt=nb.length>=2?nb[1]:null;
// Discover label
var discoverLabel=t.discover.replace("{country}",esc(country));

// ========== BUILD INFO PILLS DATA ==========
// Chaque pill = {id, icon, label, content}
var pills=[];
if(hlI)pills.push({id:"pill-hl",icon:"\u2728",label:t.highlights,content:"<ul>"+hlI+"</ul>"});
if(bmo)pills.push({id:"pill-bp",icon:"\ud83d\udcc6",label:t.bestPeriod,content:"<p>"+esc(bmo)+"</p>"});
pills.push({id:"pill-dur",icon:"\u23f3",label:t.faqDuration,content:"<p>"+idealText+"</p>"});
if(guide.weather)pills.push({id:"pill-wx",icon:"\u2600\ufe0f",label:t.weather,content:"<p>"+guide.weather+"</p>"});
if(guide.experiences)pills.push({id:"pill-disc",icon:"\ud83c\udf0d",label:discoverLabel,content:"<p>"+guide.experiences+"</p>"});
// Pill infos pratiques (practical_tips du JSON)
var ptips=prac.practical_tips||{};
var ptContent="";
var PT_ICONS={vehicle:"\ud83d\ude97",vol_interne:"\u2708\ufe0f",airports:"\ud83d\udee9\ufe0f",safety:"\u26a0\ufe0f",budget:"\ud83d\udcb0",visa:"\ud83d\udcdd",health:"\ud83c\udfe5",currency:"\ud83d\udcb1",electricity:"\ud83d\udd0c",language:"\ud83d\udde3\ufe0f",internet:"\ud83d\udcf6",water:"\ud83d\udca7",food:"\ud83c\udf7d\ufe0f",transport:"\ud83d\ude8c",accommodation:"\ud83c\udfe8"};
Object.keys(ptips).forEach(function(k){if(ptips[k]){var icon=PT_ICONS[k]||"\u2139\ufe0f";var label=k.replace(/_/g," ").replace(/\b\w/g,function(c){return c.toUpperCase();});ptContent+="<p>"+icon+" <strong>"+esc(label)+"</strong><br>"+esc(ptips[k])+"</p>";}});
if(ptContent)pills.push({id:"pill-prac",icon:"\ud83e\uddf3",label:t.practicalInfo,content:ptContent});
var notesContent="";
if(itin.notes)notesContent+="<p>"+esc(itin.notes)+"</p>";
if(guide.warning)notesContent+="<p>"+guide.warning+"</p>";
if(adv)notesContent+='<p><a href="'+adv.url+'" target="_blank" rel="noopener">'+t.officialAdvice+" ("+adv.name+")</a></p>";
if(notesContent)pills.push({id:"pill-notes",icon:"\ud83d\udccb",label:t.notes,content:notesContent});

// ========== FULL HTML ==========
var o="";
o+='<!DOCTYPE html>\n<html lang="'+lang+'"'+dir+">\n<head>\n";
o+='<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n';
o+='<script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","w1sbx0fb07");<\/script>\n';
o+='<script>(function(s,t,a,y,tw,to){s.Stay22=s.Stay22||{};s.Stay22.params={lmaID:"692f0c75b2478d16bb9b22fa"};tw=t.createElement(a);to=t.getElementsByTagName(a)[0];tw.async=1;tw.src=y;to.parentNode.insertBefore(tw,to);})(window,document,"script","https://scripts.stay22.com/letmeallez.js");<\/script>\n';
o+='<script async src="https://www.googletagmanager.com/gtag/js?id=G-JK3QGQGDDL"><\/script>\n';
o+='<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","G-JK3QGQGDDL");<\/script>\n';
o+='<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n';
o+='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preconnect" href="https://wsrv.nl">\n';
o+='<link rel="preload" as="image" href="'+hero+'" fetchpriority="high">\n';
o+='<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n';
o+='<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" media="print" onload="this.media=\'all\'">\n';
o+='<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" media="print" onload="this.media=\'all\'">\n';
o+="<title>"+h1+" \u2014 "+Math.round(st.totalDays)+" "+t.days.toLowerCase()+", "+esc(country)+" | OneRoadTrip</title>\n";
o+='<meta name="description" content="'+hook+'">\n';
o+='<link rel="canonical" href="'+can+'">\n'+hlg+"\n";
o+='<meta property="og:type" content="article"><meta property="og:title" content="'+h1+' | OneRoadTrip"><meta property="og:description" content="'+hook+'"><meta property="og:image" content="'+hero+'"><meta property="og:url" content="'+can+'"><meta property="og:site_name" content="OneRoadTrip">\n';
o+='<meta property="article:published_time" content="'+pubD+'"><meta property="article:modified_time" content="'+modD+'">\n';
o+='<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+h1+'"><meta name="twitter:description" content="'+hook+'"><meta name="twitter:image" content="'+hero+'">\n';
o+='<script type="application/ld+json">'+JSON.stringify(sch)+"<\/script>\n";
o+='<script type="application/ld+json">'+JSON.stringify(bcL)+"<\/script>\n";
// CSS
o+="<style>\n";
o+=":root{--p:#113f7a;--pd:#0a2a57;--s:#00b2ff;--a:#ff6b35;--t:#2c3e50;--tl:#7f8c8d;--bg:#fff;--bl:#f8f9fa;--bd:#e1e8ed;--sh:0 4px 12px rgba(0,0,0,.08);--sl:0 8px 25px rgba(0,0,0,.12);--r:8px;--rl:12px;--hh:70px;--mh:calc(100vh - 70px)}\n";
o+="*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}body{font-family:Inter,system-ui,sans-serif;color:var(--t);background:var(--bg);line-height:1.6}\n";
// Header
o+=".hd{position:sticky;top:0;z-index:1000;background:var(--pd);color:#fff;height:var(--hh);display:flex;align-items:center;padding:0 20px;justify-content:space-between}.hd a{color:#fff;text-decoration:none}.hb{display:flex;align-items:center;gap:8px;font-size:1rem;font-weight:600}.hb img{height:28px}.hn{display:flex;gap:12px;align-items:center;font-size:.85rem}\n";
o+=".ls{position:relative}.lb{background:var(--bl);border:1px solid #ddd;color:var(--t);padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem}.ld{display:none;position:absolute;top:100%;right:0;background:#fff;border-radius:8px;box-shadow:var(--sl);overflow-y:auto;max-height:calc(100vh - 80px);min-width:180px;z-index:999}.ld.open{display:block}.ld a.lo{display:flex;align-items:center;gap:8px;padding:10px 16px;color:#1a1a2e;text-decoration:none;font-size:.9rem;white-space:nowrap}.ld a.lo:hover{background:var(--bl);color:#1a1a2e}.ld a.lo.ac{background:var(--p);color:#fff}\n";
// Hero
o+=".hr{position:relative;min-height:160px;overflow:hidden;background:var(--pd)}.hr img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.55)}.hc{position:relative;display:flex;flex-direction:column;justify-content:flex-end;padding:16px 28px;color:#fff;min-height:160px}.hc h1{font-family:Playfair Display,serif;font-size:clamp(1.3rem,3vw,2rem);font-weight:700;margin-bottom:6px;line-height:1.2}.hs{display:flex;gap:16px;font-size:.88rem;opacity:.9;flex-wrap:wrap}.hr-route{margin-top:6px;font-size:.82rem;opacity:.75;letter-spacing:.3px;line-height:1.4;max-width:90%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}.hi{margin-top:4px;font-size:.88rem;opacity:.82;max-width:680px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}.hr-tip{display:none;position:absolute;left:0;right:0;bottom:0;background:rgba(10,10,30,.92);color:#fff;padding:14px 28px;font-size:.88rem;line-height:1.5;z-index:5;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);white-space:normal;word-wrap:break-word;overflow-wrap:break-word;max-height:60%;overflow-y:auto}.hr-tip.open{display:block}.hr-tip-x{position:absolute;top:6px;right:12px;background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;opacity:.7}.hr-tip-x:hover{opacity:1}\n";
// Info pills bar (remplace les accordeons)
o+=".ip-bar{display:flex;flex-wrap:wrap;gap:5px;padding:8px 28px;background:var(--bl);border-bottom:1px solid var(--bd);position:sticky;top:var(--hh);z-index:1200}\n";
o+=".ip-pill{position:static;display:inline-flex;align-items:center;gap:3px;padding:4px 9px;background:#fff;border:1px solid var(--bd);border-radius:18px;font-size:.76rem;font-weight:500;color:var(--t);cursor:pointer;transition:all .15s;white-space:nowrap;user-select:none}\n";
o+=".ip-pill:hover{background:var(--p);color:#fff;border-color:var(--p)}\n";
o+=".ip-pill .ip-lbl{pointer-events:none}\n";
// Popup flottant
o+=".ip-pop{display:none;position:fixed;left:0;right:0;z-index:1100;background:#fff;box-shadow:var(--sl);padding:16px 28px;border-top:1px solid var(--bd);word-wrap:break-word;overflow-wrap:break-word;white-space:normal;max-height:50vh;overflow-y:auto}\n";
o+=".ip-pop.open{display:block}\n";
o+=".ip-pop::before{display:none}\n";
o+=".ip-pop ul{list-style:none}.ip-pop li{padding:3px 0;font-size:.88rem;color:var(--t);white-space:normal}.ip-pop li::before{content:'\\2192 ';color:var(--s)}.ip-pop p{font-size:.88rem;color:var(--t);line-height:1.6;white-space:normal}.ip-pop a{color:var(--p)}\n";
o+=".ip-x{position:absolute;top:6px;right:10px;background:none;border:none;font-size:1.1rem;cursor:pointer;color:var(--tl);line-height:1}.ip-x:hover{color:var(--t)}\n";
o+=".ip-trips-btn{display:inline-flex;align-items:center;gap:3px;padding:4px 12px;background:linear-gradient(135deg,#d4a039,#b8860b);color:#fff;border:none;border-radius:18px;font-size:.76rem;font-weight:600;cursor:pointer;text-decoration:none;white-space:nowrap;transition:all .15s;margin-left:auto}.ip-trips-btn:hover{transform:translateY(-1px);box-shadow:0 3px 10px rgba(180,134,11,.4)}\n";
o+="@media(max-width:900px){.ip-trips-btn .ip-trips-lbl{display:none}.ip-trips-btn{padding:5px 10px;font-size:.9rem}}\n";
// Main layout
o+=".ml{display:grid;grid-template-columns:1fr 1fr}.mp{position:sticky;top:var(--hh);height:var(--mh);z-index:10;display:flex;flex-direction:column;overflow:hidden}.mp.fs{position:fixed;inset:0;z-index:9999;height:100vh;width:100vw}.mp.fs .mc{top:16px;right:16px}.mp.fs .mb{padding:8px 14px;font-size:1rem;background:rgba(255,255,255,.95);box-shadow:0 2px 8px rgba(0,0,0,.3)}#map{width:100%;flex:1;min-height:0}.mc{position:absolute;top:10px;right:10px;z-index:1000;display:flex;gap:5px;transition:top .4s ease}.mb{background:#fff;border:1px solid #ccc;border-radius:6px;padding:5px 9px;cursor:pointer;font-size:.78rem;box-shadow:0 2px 4px rgba(0,0,0,.15)}.mb:hover{background:var(--bl)}.tp{padding:20px 28px}\n";
// Day sections
// Day photo in map panel
o+=".dp-map{width:100%;height:0;overflow:hidden;transition:height .4s ease;background:#111;flex-shrink:0}.dp-map img{width:100%;height:100%;object-fit:cover;display:block}.dp-map.vis{height:180px}\n";
o+=".dp-inline{display:none;width:100%;height:180px;overflow:hidden;border-radius:var(--r);margin-bottom:12px}.dp-inline img{width:100%;height:100%;object-fit:cover;display:block}\n";
o+=".htl-inline{display:flex;align-items:center;gap:12px;padding:10px 14px;margin:8px 0;background:linear-gradient(135deg,#f0f7ff,#fff);border:1px solid var(--bd);border-radius:var(--r);text-decoration:none;color:var(--t);transition:all .2s}.htl-inline:hover{border-color:var(--s);box-shadow:0 2px 8px rgba(17,63,122,.12)}.htl-inline img{width:70px;height:70px;border-radius:8px;object-fit:cover;flex-shrink:0}.htl-info{flex:1;min-width:0}.htl-name{display:block;font-size:.82rem;font-weight:600;color:var(--p);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.htl-score{display:inline-block;margin-top:4px;background:var(--p);color:#fff;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:700}\n";
o+=".kw-bar{display:flex;flex-wrap:wrap;gap:6px;padding:8px 0;margin-bottom:4px}.kw-tag{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#f0f7ff;border:1px solid #d0dff0;border-radius:14px;font-size:.75rem;color:var(--p);text-decoration:none;transition:all .15s;white-space:nowrap}.kw-tag:hover{background:var(--p);color:#fff;border-color:var(--p)}\n";
o+=".see-itin{display:none;width:100%;padding:12px;background:linear-gradient(to bottom,transparent,rgba(17,63,122,.85));color:#fff;border:none;font-size:.9rem;font-weight:600;cursor:pointer;text-align:center;position:absolute;bottom:0;left:0;right:0;z-index:20}\n";
o+="img.wk-lazy{background:#e8edf2;background:linear-gradient(90deg,#e8edf2 25%,#f0f4f8 50%,#e8edf2 75%);background-size:200% 100%;animation:wkShimmer 1.5s infinite}@keyframes wkShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}img.wk-lazy.wk-loaded{animation:none;background:none}\n";
// Visits
o+=".vi{display:flex;gap:10px;margin-bottom:14px}.vm{flex-shrink:0;width:26px;height:26px;background:var(--s);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700}.vc p{font-size:.88rem;line-height:1.6}.vd{display:inline-block;margin-top:3px;font-size:.78rem;color:var(--tl)}\n";
// Activities
o+=".ab{margin-top:10px;padding:10px;background:var(--bl);border-radius:var(--r)}.ab h4{font-size:.88rem;color:var(--p);margin-bottom:6px}.ai p{font-size:.85rem;line-height:1.5;margin-bottom:6px}\n";
// Hotel card in map
o+=".htb{position:relative;display:block;width:56px;height:56px;border-radius:6px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.3);transition:transform .15s;flex-shrink:0}.htb:hover{transform:scale(1.08)}.htb img{width:100%;height:100%;object-fit:cover;display:block}.hts{position:absolute;bottom:2px;left:2px;background:#003580;color:#fff;font-size:.65rem;font-weight:700;padding:1px 4px;border-radius:3px}\n";
// Next leg
o+=".nl{display:flex;align-items:center;gap:7px;margin-top:10px;padding:9px 12px;background:linear-gradient(135deg,#f0f7ff,#e8f4fd);border-radius:var(--r);font-size:.83rem}\n";
// CTA
o+=".cs{background:linear-gradient(135deg,var(--pd),var(--p));color:#fff;text-align:center;padding:40px 28px}.cs h2{font-family:Playfair Display,serif;font-size:1.5rem;margin-bottom:10px}.cs p{opacity:.85;margin-bottom:20px}.cb{display:inline-block;background:var(--a);color:#fff;padding:12px 28px;border-radius:28px;text-decoration:none;font-weight:600;font-size:.95rem;transition:transform .2s}.cb:hover{transform:scale(1.05)}.cf{margin-top:8px;font-size:.82rem;opacity:.7}\n";
// Nearby
o+=".ns{padding:36px 28px;background:var(--bl)}.ns h2{font-family:Playfair Display,serif;font-size:1.3rem;margin-bottom:20px;color:var(--p)}.ng{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}.nc{background:#fff;border-radius:var(--rl);padding:16px;box-shadow:var(--sh);text-decoration:none;color:var(--t);transition:transform .2s}.nc:hover{transform:translateY(-2px);box-shadow:var(--sl)}.nc h3{font-size:.95rem;margin-bottom:4px;color:var(--p)}.nm{font-size:.82rem;color:var(--tl)}\n";
// Floating CTA
o+=".dm{pointer-events:auto!important;cursor:pointer}\n";
// Nav arrows
o+=".na{position:fixed;top:50%;z-index:850;transform:translateY(-50%);width:36px;height:80px;background:var(--pd);color:#fff;border:none;border-radius:0 8px 8px 0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.2rem;opacity:.6;transition:opacity .2s,width .2s;box-shadow:2px 0 8px rgba(0,0,0,.15);text-decoration:none}.na:hover{opacity:1;width:42px}.na.nr{left:auto;right:0;border-radius:8px 0 0 8px;box-shadow:-2px 0 8px rgba(0,0,0,.15)}.na.nl2{left:0}\n";
o+=".na-tip{display:none;position:absolute;top:50%;background:#fff;color:var(--t);border-radius:var(--r);padding:10px 14px;box-shadow:var(--sl);font-size:.8rem;line-height:1.4;max-width:220px;white-space:normal}.na.nl2 .na-tip{left:calc(100% + 8px);transform:translateY(-50%)}.na.nr .na-tip{right:calc(100% + 8px);transform:translateY(-50%)}.na:hover .na-tip{display:block}\n";
o+=".na-tt{font-weight:600;color:var(--p);display:block;margin-bottom:3px}.na-st{font-size:.72rem;color:var(--tl)}\n";
// Legend
o+=".ml-leg{position:absolute;bottom:30px;left:10px;z-index:1000;background:rgba(255,255,255,.95);border-radius:var(--r);padding:8px 12px;font-size:.73rem;box-shadow:0 2px 6px rgba(0,0,0,.2);line-height:1.8}.ml-li{display:flex;align-items:center;gap:6px;white-space:nowrap}.ml-dot{width:10px;height:10px;border-radius:50%;display:inline-block;flex-shrink:0}\n";
// Footer
o+=".ft{background:var(--pd);color:rgba(255,255,255,.6);padding:20px 28px;text-align:center;font-size:.78rem}.ft a{color:rgba(255,255,255,.8)}\n";
// Popup fullscreen map
o+=".po{display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5)}.pc{position:absolute;bottom:16px;left:16px;right:16px;max-height:40vh;background:#fff;border-radius:var(--rl);padding:18px;overflow-y:auto;box-shadow:var(--sl)}.px{position:absolute;top:8px;right:12px;background:none;border:none;font-size:1.3rem;cursor:pointer}\n";
// Back to map button (mobile only)
o+=".btm{display:none;position:fixed;bottom:80px;right:20px;z-index:950;background:var(--p);color:#fff;border:none;border-radius:28px;padding:10px 18px;font-size:.85rem;font-weight:600;cursor:pointer;box-shadow:var(--sl);transition:transform .15s;gap:6px;align-items:center}.btm:hover{transform:scale(1.05)}.btm svg{width:18px;height:18px;fill:#fff}\n";
// Mobile
o+="@media(max-width:900px){.ml{grid-template-columns:1fr}.mp{position:relative;top:auto;height:40vh}.tp{max-height:none;padding:14px}.hr{min-height:120px}.hc{padding:14px;min-height:120px}.ip-bar{padding:8px 14px;gap:5px;position:sticky;top:var(--hh);z-index:1200}.ip-pill .ip-lbl{display:none}.ip-pill{padding:5px 8px;font-size:.9rem}.ip-pop{position:fixed;top:auto;bottom:0;left:0;right:0;max-height:calc(100vh - var(--hh) - 60px);overflow-y:auto;border-radius:var(--rl) var(--rl) 0 0;z-index:1100;padding:16px 14px}.ns{padding:20px 14px}.cs{padding:28px 14px}.btm{display:flex}.mc{gap:8px}.mb{padding:8px 12px;font-size:.9rem}.dp-inline{display:block}.see-itin{display:block}.na{width:24px;height:50px;font-size:.9rem;opacity:.35}.na:hover{width:28px}.hr-tip{padding:14px}}\n";
o+="@media(max-width:600px){.hs{gap:8px}.hi{-webkit-line-clamp:2}.hr-route{white-space:normal;-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden}.dh{flex-wrap:wrap}.vi{flex-direction:column;gap:4px}}\n";
o+=".bc{padding:6px 20px;font-size:.78rem;color:var(--g);background:var(--bl);border-bottom:1px solid var(--bd)}.bc a{color:var(--p);text-decoration:none}.bc a:hover{text-decoration:underline}.bc span{margin:0 5px;color:#bbb}\n";
// CSS header ORT (compatible ort-header.js)
o+="header.ort-hdr{position:sticky;top:0;z-index:10000;background:var(--p);color:#fff;padding:6px 12px;display:flex;flex-direction:column;gap:4px;border-bottom:1px solid rgba(255,255,255,0.2)}\n";
o+="@media(min-width:640px){header.ort-hdr{padding:8px 16px;gap:6px}}\n";
o+=".header-row-1,.header-row-2{display:flex;align-items:center;gap:8px;width:100%;flex-wrap:wrap}\n";
o+=".header-row-2{justify-content:flex-end}\n";
o+="header.ort-hdr .brandlink{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none}\n";
o+="header.ort-hdr .brandlink img{width:52px;height:52px}\n";
o+="header.ort-hdr .brand{font-weight:700;font-size:1.15rem}\n";
o+="header.ort-hdr .langpick{appearance:none;background:#fff;border:1px solid var(--pd);border-radius:6px;padding:4px 8px;cursor:pointer;color:var(--pd);font-size:.82rem}\n";
o+="header.ort-hdr .auth{position:relative}\n";
o+="header.ort-hdr .btn{padding:6px 14px;border-radius:8px;border:1px solid #ffffff80;background:#ffffff1a;color:#fff;cursor:pointer;font-size:.85rem;font-weight:600}\n";
o+="header.ort-hdr .btn:hover{background:#ffffff2b}\n";
// Popup d'auth — z-index au-dessus de TOUT (Leaflet markers, panes, etc.), bouton Google en avant
o+="header.ort-hdr .auth-pop{position:absolute;right:0;top:44px;background:#fff;color:var(--pd);border:1px solid var(--bd);border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.2);padding:12px;display:none;min-width:260px;z-index:100000}\n";
o+="@media(max-width:480px){header.ort-hdr .auth-pop{min-width:220px;right:-10px}}\n";
// Bouton Google (#btnGoogle) — gros, blanc avec bordure bleue, toujours en premier
o+="#btnGoogle{display:flex!important;align-items:center;justify-content:center;gap:8px;width:100%;margin:0 0 10px!important;padding:10px 16px!important;background:#fff!important;border:2px solid #4285f4!important;color:#333!important;font-size:.92rem!important;font-weight:600!important;border-radius:8px!important;cursor:pointer}\n";
o+="#btnGoogle:hover{background:#f0f7ff!important;border-color:#1a73e8!important}\n";
// Bouton Email — plus discret, en dessous
o+="#btnEmail{display:block;width:100%;margin:6px 0;background:var(--pd);border:1px solid var(--pd);color:#fff;padding:8px 14px;border-radius:8px;font-size:.85rem}\n";
o+="#btnEmail:hover{opacity:.9}\n";
// Bouton logout
o+="header.ort-hdr .auth-pop .btn.out{background:#fff;color:var(--pd);border:1px solid var(--bd)}\n";
o+="</style>\n</head>\n<body data-cc=\""+cc+"\" data-itin-id=\""+esc(itinId)+"\" data-detail-url=\""+esc(detL)+"\">\n";
// Header (rempli dynamiquement par ort-header.js)
o+='<header id="site-header" class="ort-hdr"></header>\n';
// Info pills bar (sticky sous le header)
o+='<div class="ip-bar">\n';
pills.forEach(function(pill){
o+='<div class="ip-pill" id="'+pill.id+'" onmouseenter="hPill(this)" onmouseleave="lPill(this)" onclick="tPill(this)">'+pill.icon+'<span class="ip-lbl"> '+pill.label+'</span>';
o+='<div class="ip-pop"><button class="ip-x" onclick="event.stopPropagation();xPill(this)">\u00d7<\/button>'+pill.content+'</div>';
o+='</div>\n';
});
// Bouton "Vos voyages" — lien doré vers le dashboard utilisateur
o+='<a href="/dashboard_user.html?lang='+lang+'" class="ip-trips-btn">\u2708\ufe0f '+esc(t.tripsBtn)+'</a>\n';
o+='</div>\n';
// Breadcrumb
o+='<nav class="bc" aria-label="breadcrumb"><a href="/index.html">OneRoadTrip</a><span>›</span><a href="/index.html?country='+cc+'">'+esc(country)+'</a><span>›</span>'+esc(h1)+' <span>·</span> '+Math.round(st.totalDays)+' '+t.days.toLowerCase()+"</nav>\n";
// Hero
var heroIsWk=hero.indexOf("wikimedia")>=0;
o+='<section class="hr"><img '+(heroIsWk?'data-src="'+hero+'" class="wk-lazy wk-hero"':'src="'+hero+'"')+' alt="'+h1+'" width="1200" height="260" loading="eager">\n';
o+='<div class="hc"><h1>'+h1+"</h1>\n";
o+='<div class="hs"><span>\ud83d\udcc5 '+Math.round(st.totalDays)+" "+t.days.toLowerCase()+"</span><span>\ud83d\udccd "+st.stops+" "+t.steps+"</span><span>\ud83d\ude97 "+st.km+" "+t.km+"</span><span>\u23f1 "+drvT(st.driveMin)+"</span></div>\n";
if(routeText)o+='<p class="hr-route" onclick="tHrTip(\'hrTipRoute\')" onmouseenter="hHrTip(\'hrTipRoute\')" onmouseleave="lHrTip(\'hrTipRoute\')">'+routeText+"</p>\n";
if(routeText)o+='<div class="hr-tip" id="hrTipRoute" onmouseenter="kHrTip(\'hrTipRoute\')" onmouseleave="lHrTip(\'hrTipRoute\')"><button class="hr-tip-x" onclick="event.stopPropagation();xHrTip(\'hrTipRoute\')">\u00d7</button>'+routeText+"</div>\n";
if(intro)o+='<p class="hi" onclick="tHrTip(\'hrTipIntro\')" onmouseenter="hHrTip(\'hrTipIntro\')" onmouseleave="lHrTip(\'hrTipIntro\')">'+intro+"</p>";
if(intro)o+='<div class="hr-tip" id="hrTipIntro" onmouseenter="kHrTip(\'hrTipIntro\')" onmouseleave="lHrTip(\'hrTipIntro\')"><button class="hr-tip-x" onclick="event.stopPropagation();xHrTip(\'hrTipIntro\')">\u00d7</button>'+intro+"</div>\n";
o+="</div></section>\n";
// Main layout
o+='<div class="ml"><div class="mp" id="mapPanel"><div class="dp-map" id="dayPhoto"></div><div id="map"></div><div class="mc"><a id="htlBox" class="htb" href="#" target="_blank" rel="noopener sponsored" style="display:none"><img id="htlImg" src="" alt=""><span id="htlScore" class="hts"></span></a><button class="mb" onclick="cMap()" title="'+t.centerMap+'">\u25ce</button><button class="mb" onclick="tFs()" id="fsBtn" title="'+t.expandMap+'">\u26f6</button></div><button class="see-itin" onclick="document.getElementById(\'textPanel\').scrollIntoView({behavior:\'smooth\',block:\'start\'})">'+t.seeItinerary+'</button>';
// Légende
var lgMust={fr:"Incontournable",en:"Must-see",es:"Imprescindible",pt:"Imperd\u00edvel",it:"Imperdibile",ar:"\u0644\u0627 \u064a\u0641\u0648\u062a\u0643"};
var lgReco={fr:"Recommand\u00e9",en:"Recommended",es:"Recomendado",pt:"Recomendado",it:"Consigliato",ar:"\u0645\u0648\u0635\u0649 \u0628\u0647"};
var lgDisc={fr:"\u00c0 d\u00e9couvrir",en:"Discover",es:"Por descubrir",pt:"A descobrir",it:"Da scoprire",ar:"\u0644\u0644\u0627\u0643\u062a\u0634\u0627\u0641"};
var lgCur={fr:"\u00c9tape en cours",en:"Current stop",es:"Parada actual",pt:"Paragem atual",it:"Tappa corrente",ar:"\u0627\u0644\u0645\u062d\u0637\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629"};
o+='<div class="ml-leg" id="mapLeg">';
o+='<div class="ml-li"><svg width="14" height="14" viewBox="0 0 24 24" fill="#1565C0" stroke="#fff" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> '+(lgMust[lang]||lgMust.en)+'</div>';
o+='<div class="ml-li"><span class="ml-dot" style="background:#43A047"></span> '+(lgReco[lang]||lgReco.en)+'</div>';
o+='<div class="ml-li"><span class="ml-dot" style="background:#7CB342"></span> '+(lgDisc[lang]||lgDisc.en)+'</div>';
o+='<div class="ml-li"><span class="ml-dot" style="background:#e11d48"></span> '+(lgCur[lang]||lgCur.en)+'</div>';
o+='</div>';
o+='</div>\n';
o+='<div class="tp" id="textPanel">'+dH+"</div></div>\n";
// Popup fullscreen
o+='<div class="po" id="mapPop"><div class="pc" id="mapPopC"><button class="px" onclick="cPop()">\u00d7</button><div id="mapPopB"></div></div></div>\n';
// Back to map (mobile)
o+='<button class="btm" id="backToMap" onclick="goMap()"><svg viewBox="0 0 24 24"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>'+t.backToMap+'<\/button>\n';
// CTA
o+='<section class="cs"><h2>'+t.ctaTitle+"</h2><p>"+t.diffMarker+"</p>\n";
o+='<a href="'+detL+'" class="cb">'+t.ctaBtn+"</a>\n";
o+='<p class="cf">'+t.ctaFree+"</p></section>\n";
// Nearby
o+=nbH;
// Prev/Next arrows
if(prevIt)o+='<a href="/'+LSLUG[lang]+"/"+prevIt.slug+'.html" class="na nl2"><span>\u276e</span><div class="na-tip"><span class="na-tt">'+esc(prevIt.title)+'</span><span class="na-st">'+Math.round(prevIt.days)+" "+t.days.toLowerCase()+" \u00b7 "+prevIt.km+" km</span></div></a>\n";
if(nextIt)o+='<a href="/'+LSLUG[lang]+"/"+nextIt.slug+'.html" class="na nr"><span>\u276f</span><div class="na-tip"><span class="na-tt">'+esc(nextIt.title)+'</span><span class="na-st">'+Math.round(nextIt.days)+" "+t.days.toLowerCase()+" \u00b7 "+nextIt.km+" km</span></div></a>\n";
// Footer (rempli dynamiquement par ort-footer.js)
o+='<footer id="footer-legal"></footer>\n';
// JS
o+='<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" defer><\/script>\n';
o+='<script src="/js/ort-routing.js" defer><\/script>\n';
o+="<script>\n";
o+="var MP="+JSON.stringify(mp)+";var OP="+JSON.stringify(op)+";\n";
o+="var map,mk={},pl,isFs=false;\n";
// Hero tip panels (route & intro expand)
o+="var hrTipTimer=null;\n";
o+="function xAllHrTips(){document.querySelectorAll('.hr-tip.open').forEach(function(t){t.classList.remove('open');});}\n";
o+="function tHrTip(id){var el=document.getElementById(id);if(el.classList.contains('open')){el.classList.remove('open');}else{xAllHrTips();el.classList.add('open');}}\n";
o+="function hHrTip(id){if(window.innerWidth<=900)return;hrTipTimer=setTimeout(function(){xAllHrTips();document.getElementById(id).classList.add('open');},200);}\n";
o+="function lHrTip(id){if(window.innerWidth<=900)return;clearTimeout(hrTipTimer);setTimeout(function(){var el=document.getElementById(id);if(el&&!el.matches(':hover'))el.classList.remove('open');},250);}\n";
o+="function kHrTip(id){clearTimeout(hrTipTimer);}\n";
o+="function xHrTip(id){document.getElementById(id).classList.remove('open');}\n";
// Pill popup logic
o+="var hoverTimer=null,activePill=null;\n";
o+="function posPop(pop){var bar=document.querySelector('.ip-bar');if(bar){var r=bar.getBoundingClientRect();pop.style.top=Math.round(r.bottom)+'px';}}\n";
o+="function hPill(el){if(window.innerWidth<=900)return;hoverTimer=setTimeout(function(){closePills();var pop=el.querySelector('.ip-pop');posPop(pop);pop.classList.add('open');activePill=el;},150);}\n";
o+="function lPill(el){if(window.innerWidth<=900)return;clearTimeout(hoverTimer);setTimeout(function(){var pop=el.querySelector('.ip-pop');if(pop&&!pop.matches(':hover'))pop.classList.remove('open');},200);}\n";
o+="function tPill(el){var pop=el.querySelector('.ip-pop');if(pop.classList.contains('open')){pop.classList.remove('open');activePill=null;}else{closePills();posPop(pop);pop.classList.add('open');activePill=el;}}\n";
o+="function xPill(btn){btn.closest('.ip-pop').classList.remove('open');activePill=null;}\n";
o+="function closePills(){document.querySelectorAll('.ip-pop.open').forEach(function(p){p.classList.remove('open');});activePill=null;}\n";
o+="document.addEventListener('click',function(e){if(!e.target.closest('.ip-pill'))closePills();if(!e.target.closest('.ls'))document.querySelectorAll('.ld').forEach(function(d){d.classList.remove('open');});if(!e.target.closest('.hr-route')&&!e.target.closest('.hi')&&!e.target.closest('.hr-tip'))xAllHrTips();});\n";
// Back to map (mobile)
// Wikimedia sequential loader with retry + fallback to next photo
o+="function wkLoad(img,url,attempt,fallbacks){attempt=attempt||0;fallbacks=fallbacks||[];function tryNext(){if(attempt<2){var delay=attempt===0?2000:5000;setTimeout(function(){wkLoad(img,url,attempt+1,fallbacks);},delay);}else if(fallbacks.length>0){var next=fallbacks.shift();wkLoad(img,next,0,fallbacks);}else{img.style.display='none';}}img.onload=function(){if(img.naturalWidth<2){tryNext();return;}img.classList.add('wk-loaded');};img.onerror=function(){tryNext();};img.src=url;}\n";
o+="(function(){var imgs=document.querySelectorAll('img.wk-lazy');if(!imgs.length)return;var idx=0;function loadNext(){if(idx>=imgs.length)return;var img=imgs[idx];var url=img.getAttribute('data-src');var fb=img.getAttribute('data-fallbacks');var fallbacks=fb?fb.split('|'):[];if(url){wkLoad(img,url,0,fallbacks);idx++;setTimeout(loadNext,250);}else{idx++;loadNext();}}loadNext();})();\n";
o+="function goMap(){document.getElementById('mapPanel').scrollIntoView({behavior:'smooth',block:'start'});}\n";
o+="(function(){if(window.innerWidth>900)return;var btn=document.getElementById('backToMap');var mp2=document.getElementById('mapPanel');if(!btn||!mp2)return;\n";
o+="var io=new IntersectionObserver(function(entries){entries.forEach(function(e){btn.style.display=e.isIntersecting?'none':'flex';});},{threshold:0.1});\n";
o+="io.observe(mp2);})();\n";
// Map init
o+='document.addEventListener("DOMContentLoaded",function(){(function w(){if(typeof L==="undefined"){setTimeout(w,100);return;}iM();})();});\n';
o+="function iM(){if(!MP.length)return;map=L.map('map',{scrollWheelZoom:true,zoomControl:true});\n";
o+="L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{attribution:'\\u00a9 OSM \\u00a9 CARTO',maxZoom:19}).addTo(map);\n";
o+="var bd=L.latLngBounds(MP.map(function(p){return[p.lat,p.lng];}));\n";
o+="// Smart bounds : filtrer les outliers (ex: DOM-TOM pour la France)\n";
o+="if(MP.length>=3){var mLat=MP.map(function(p){return p.lat;}).sort(function(a,b){return a-b;});var mLng=MP.map(function(p){return p.lng;}).sort(function(a,b){return a-b;});var mi=Math.floor(mLat.length/2);var medLat=mLat[mi];var medLng=mLng[mi];\n";
o+="var mainPts=MP.filter(function(p){var dLat=Math.abs(p.lat-medLat);var dLng=Math.abs(p.lng-medLng);return(dLat<15&&dLng<20);});\n";
o+="if(mainPts.length>=2&&mainPts.length<MP.length){bd=L.latLngBounds(mainPts.map(function(p){return[p.lat,p.lng];}));console.log('[MAP] Smart bounds: '+mainPts.length+'/'+MP.length+' points (outliers exclus)');}}\n";
o+="function opColor(r){if(r>=8.8)return'#1565C0';if(r>=7.6)return'#43A047';if(r>=6.1)return'#7CB342';if(r>=3.1)return'#78909C';if(r>0)return'#B0BEC5';return'#CFD8DC';}\n";
o+="function opRadius(r){if(r>=8.8)return 10;if(r>=7.6)return 8;if(r>=6.1)return 7;if(r>=3.1)return 6;return 5;}\n";
o+="var DL='"+detL.replace(/'/g,"\\'")+"';\n";
o+="var ADD_TXT='"+esc(t.addPlace)+"';\n";
o+="OP.forEach(function(p){var c=opColor(p.rat),r=opRadius(p.rat);var m;\n";
o+="if(p.rat>=8.8){var ic2=L.divIcon({html:'<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"#1565C0\" stroke=\"#fff\" stroke-width=\"2\"><path d=\"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z\"/></svg>',className:'dm',iconSize:[20,20],iconAnchor:[10,10]});m=L.marker([p.lat,p.lng],{icon:ic2}).addTo(map);}\n";
o+="else{m=L.circleMarker([p.lat,p.lng],{radius:r,fillColor:c,color:'#fff',weight:1.5,fillOpacity:.8}).addTo(map);}\n";
o+="var tip='<strong>'+p.name+'</strong>';if(p.kw)tip+='<br><small style=\"color:#555\">'+p.kw+'</small>';tip+='<br><a href=\"#\" onclick=\"event.preventDefault();addPlaceFromMap(\\''+p.pid.replace(/'/g,\"\\\\'\")+'\\');\" style=\"color:#e11d48;font-weight:600;font-size:12px;text-decoration:none;cursor:pointer\">\\u2795 '+ADD_TXT+'</a>';m.bindPopup(tip,{maxWidth:280});});\n";
// Ligne droite
o+="var ll=MP.map(function(p){return[p.lat,p.lng];});pl=L.polyline(ll,{color:'#113f7a',weight:2,opacity:.3,dashArray:'5,10'}).addTo(map);\n";
// Route OSRM
o+="(function(){if(typeof calculateOSRMRoute==='undefined'){console.log('[ROUTE] ort-routing.js absent, ligne droite conservee');pl.setStyle({weight:3,opacity:.7,dashArray:'8,6'});return;}\n";
o+="var wps=MP.map(function(p){return[p.lat,p.lng];});if(wps.length<2)return;\n";
o+="calculateOSRMRoute(wps,'driving').then(function(result){try{map.removeLayer(pl);}catch(e){}\n";
o+="if(result&&result.coordinates&&result.coordinates.length>1){\n";
o+="pl=L.polyline(result.coordinates,{color:result.color||'#113f7a',weight:result.weight||3,opacity:.8,dashArray:result.dashArray||null}).addTo(map);\n";
o+="console.log('[ROUTE] OK:',result.type,Math.round((result.distance||0)/1000)+'km');\n";
o+="}else{pl=L.polyline(ll,{color:'#113f7a',weight:3,opacity:.7,dashArray:'8,6'}).addTo(map);}\n";
o+="}).catch(function(e){console.warn('[ROUTE] Fallback:',e);try{map.removeLayer(pl);}catch(x){}\n";
o+="pl=L.polyline(ll,{color:'#113f7a',weight:3,opacity:.7,dashArray:'8,6'}).addTo(map);});})();\n";
// Marqueurs — décaler ceux qui partagent les mêmes coordonnées
// L'offset est en PIXELS (constant visuellement) et recalculé à chaque zoom
// Initialiser le centre/zoom avant d'utiliser latLngToLayerPoint
o+="map.fitBounds(bd.pad(0.1));\n";
o+="(function(){\n";
// Détecter les groupes de points superposés
o+="var groups={};MP.forEach(function(p){var k=p.lat.toFixed(4)+'_'+p.lng.toFixed(4);if(!groups[k])groups[k]=[];groups[k].push(p);});\n";
// Stocker quels jours doivent être décalés et leur angle
o+="var fanInfo={};Object.keys(groups).forEach(function(k){var pts=groups[k];if(pts.length<=1)return;\n";
o+="pts.forEach(function(p,i){fanInfo[p.day]={angle:(2*Math.PI*i)/pts.length-Math.PI/2,count:pts.length};});});\n";
// Rayon en pixels (constant quel que soit le zoom)
o+="var FAN_PX=20;\n";
// Fonction qui calcule la position décalée en lat/lng à partir de pixels
o+="function fanPos(p){var fi=fanInfo[p.day];if(!fi)return[p.lat,p.lng];\n";
o+="var pt=map.latLngToLayerPoint([p.lat,p.lng]);\n";
o+="pt.x+=FAN_PX*Math.cos(fi.angle);pt.y+=FAN_PX*Math.sin(fi.angle);\n";
o+="var ll=map.layerPointToLatLng(pt);return[ll.lat,ll.lng];}\n";
// Créer les marqueurs
o+="MP.forEach(function(p){var pos=fanPos(p);\n";
o+="var m=L.marker(pos,{icon:mkIcon(p.day,false),zIndexOffset:p.day}).addTo(map);\n";
o+="m.bindPopup('<strong>'+p.day+'. '+p.name+'</strong>'+(p.tag?'<br><em>'+p.tag+'</em>':''));\n";
o+="m.on('click',function(){if(isFs){sPop(p.day);}else{var el=document.getElementById('day-'+p.day);if(el){el.scrollIntoView({behavior:'smooth',block:'start'});hD(p.day);}}});\n";
o+="mk[p.day]=m;});\n";
// Repositionner les marqueurs décalés à chaque changement de zoom
o+="map.on('zoomend',function(){MP.forEach(function(p){if(!fanInfo[p.day])return;\n";
o+="var pos=fanPos(p);if(mk[p.day])mk[p.day].setLatLng(pos);});});\n";
o+="})();\n";
o+="map.fitBounds(bd.pad(0.1));initBd=bd;map.on('dragstart',function(){autoFollow=false;});map.on('zoomstart',function(){autoFollow=false;});}\n";
o+="var initBd=null;\n";
o+="function cMap(){if(map&&initBd){map.fitBounds(initBd.pad(0.1));autoFollow=true;}}\n";
o+="function sD(d){var p=MP.find(function(x){return x.day===d;});if(p&&map){map.setView([p.lat,p.lng],11,{animate:true});if(mk[d])mk[d].openPopup();}hD(d);}\n";
o+="var activeDay=0;\n";
o+="function mkIcon(day,active){var bg=active?'#e11d48':'#113f7a';var sz=active?34:26;var fs=active?14:11;return L.divIcon({html:'<div style=\"background:'+bg+';color:#fff;width:'+sz+'px;height:'+sz+'px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:'+fs+'px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)'+(active?';transform:scale(1.1)':'')+'\">'+day+'</div>',className:'dm',iconSize:[sz,sz],iconAnchor:[sz/2,sz/2]});}\n";
o+="function showDayPhoto(d){var dp=document.getElementById('dayPhoto');var mc=document.querySelector('.mc');if(!dp)return;var p=MP.find(function(x){return x.day===d;});if(p&&p.photo){while(dp.firstChild)dp.removeChild(dp.firstChild);var im=document.createElement('img');im.alt=p.name;im.style.cssText='width:100%;height:100%;object-fit:cover';dp.appendChild(im);dp.classList.add('vis');wkLoad(im,p.photo,0,p.photoAlts?p.photoAlts.slice():[]);if(mc)mc.style.top='190px';if(map)setTimeout(function(){map.invalidateSize();},400);}else{dp.classList.remove('vis');while(dp.firstChild)dp.removeChild(dp.firstChild);if(mc)mc.style.top='10px';if(map)setTimeout(function(){map.invalidateSize();},400);}var hb=document.getElementById('htlBox'),hi=document.getElementById('htlImg'),hs=document.getElementById('htlScore');if(hb&&p&&p.htl&&p.htl.img){hi.src=p.htl.img;hs.textContent=p.htl.score;hb.href=p.htl.url;hb.style.display='block';}else if(hb){hb.style.display='none';}}\n";
o+="function hD(d){document.querySelectorAll('.ds').forEach(function(s){s.classList.remove('active');});var el=document.getElementById('day-'+d);if(el)el.classList.add('active');if(activeDay&&mk[activeDay])mk[activeDay].setIcon(mkIcon(activeDay,false));activeDay=d;if(mk[d])mk[d].setIcon(mkIcon(d,true));showDayPhoto(d);}\n";
o+="var autoFollow=true;\n";
o+="var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){var d=parseInt(e.target.dataset.day);if(d){hD(d);if(autoFollow&&map){var p=MP.find(function(x){return x.day===d;});if(p)map.panTo([p.lat,p.lng],{animate:true,duration:.5});}}}});},{threshold:.3});\n";
o+="document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){document.querySelectorAll('.ds').forEach(function(s){obs.observe(s);});},500);});\n";
o+="function tFs(){var pan=document.getElementById('mapPanel');isFs=!isFs;pan.classList.toggle('fs');document.getElementById('fsBtn').textContent=isFs?'\\u2715':'\\u26f6';if(map)setTimeout(function(){map.invalidateSize();},200);}\n";
o+="function sPop(d){var sec=document.getElementById('day-'+d);if(!sec)return;document.getElementById('mapPopB').innerHTML=sec.innerHTML;document.getElementById('mapPop').style.display='block';}\n";
o+="function cPop(){document.getElementById('mapPop').style.display='none';}\n";
o+="document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(document.getElementById('mapPop').style.display==='block')cPop();else if(isFs)tFs();else closePills();}});\n";
// Support box - apparaît après 60 secondes
o+="setTimeout(function(){var sb=document.getElementById('supportBox');if(sb)sb.style.display='flex';},60000);\n";
o+="function closeSupportBox(){var sb=document.getElementById('supportBox');if(sb)sb.style.display='none';var mb=document.getElementById('supportMini');if(mb)mb.style.display='flex';}\n";
o+="function openSupportBox(){var sb=document.getElementById('supportBox');if(sb)sb.style.display='flex';var mb=document.getElementById('supportMini');if(mb)mb.style.display='none';}\n";
o+="function addPlaceFromMap(pid){if(map)map.closePopup();if(!window.ORT_ITIN_EDITOR)return;if(!window.ORT_ITIN_EDITOR._isEditorActive||!window.ORT_ITIN_EDITOR._isEditorActive()){window.ORT_ITIN_EDITOR._launch();}setTimeout(function(){if(!window.ORT_ITIN_EDITOR._isReorgActive||!window.ORT_ITIN_EDITOR._isReorgActive()){window.ORT_ITIN_EDITOR._startMapReorg();}setTimeout(function(){window.ORT_ITIN_EDITOR._reorgAddOP(pid,undefined);},300);},300);}\n";
o+="<\/script>\n";
// Script pour ajuster --hh à la hauteur réelle du header (ort-header.js génère un header plus haut que 70px)
o+="<script>\n";
o+="(function(){\n";
o+="  function syncHH(){\n";
o+="    var hdr=document.querySelector('header.ort-hdr')||document.getElementById('site-header');\n";
o+="    if(!hdr)return;\n";
o+="    var h=hdr.offsetHeight;\n";
o+="    if(h>0){\n";
o+="      document.documentElement.style.setProperty('--hh',h+'px');\n";
o+="      document.documentElement.style.setProperty('--mh','calc(100vh - '+h+'px)');\n";
o+="    }\n";
o+="  }\n";
// Mesurer dès que le header est prêt, puis à chaque resize
o+="  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){setTimeout(syncHH,200);setTimeout(syncHH,1000);});}\n";
o+="  else{setTimeout(syncHH,200);setTimeout(syncHH,1000);}\n";
o+="  window.addEventListener('resize',function(){setTimeout(syncHH,100);});\n";
// Observer les changements du header (quand ort-header.js injecte son contenu)
o+="  var mo=new MutationObserver(function(){syncHH();});\n";
o+="  var target=document.getElementById('site-header');\n";
o+="  if(target)mo.observe(target,{childList:true,subtree:true});\n";
o+="  else document.addEventListener('DOMContentLoaded',function(){var t2=document.getElementById('site-header');if(t2)mo.observe(t2,{childList:true,subtree:true});});\n";
o+="})();\n";
o+="<\/script>\n";
var firstPt=mp.length?mp[0]:null;
var bkRegionLink="https://www.booking.com/searchresults."+bkSuf+".html?ss="+encodeURIComponent(country);
if(firstPt)bkRegionLink+="&latitude="+firstPt.lat+"&longitude="+firstPt.lng+"&radius=50";
var supMsg=SUPPORT_MSG[lang]||SUPPORT_MSG.en;
var supTitle=SUPPORT_TITLE[lang]||SUPPORT_TITLE.en;
var supOk=SUPPORT_OK[lang]||SUPPORT_OK.en;
var supBook=SUPPORT_BOOK[lang]||SUPPORT_BOOK.en;
// Support box modale
o+='<div id="supportBox" style="display:none;position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.5);align-items:center;justify-content:center;padding:20px">';
o+='<div style="background:#fff;border-radius:16px;max-width:460px;width:100%;padding:24px 20px;box-shadow:0 8px 32px rgba(0,0,0,.25);position:relative;text-align:center">';
o+='<button onclick="closeSupportBox()" style="position:absolute;top:10px;right:14px;background:none;border:none;font-size:1.4rem;cursor:pointer;color:#999">\u00d7</button>';
o+='<div style="font-size:1.8rem;margin-bottom:10px">\u2764\ufe0f</div>';
o+='<h3 style="font-family:Playfair Display,serif;color:#113f7a;font-size:1.05rem;margin-bottom:12px;line-height:1.3">'+esc(supTitle)+'</h3>';
o+='<p style="font-size:.85rem;line-height:1.55;color:#444;margin-bottom:16px">'+esc(supMsg)+'</p>';
o+='<a href="'+bkRegionLink+'" target="_blank" rel="noopener sponsored" style="display:inline-block;background:#ff6b35;color:#fff;padding:10px 24px;border-radius:24px;font-size:.9rem;font-weight:600;text-decoration:none;margin-bottom:10px">'+esc(supBook)+' \u2192</a><br>';
o+='<button onclick="closeSupportBox()" style="background:none;border:none;color:#888;font-size:.82rem;cursor:pointer;text-decoration:underline">'+esc(supOk)+'</button>';
o+='</div></div>\n';
// Mini badge (apparaît après fermeture, coin bas gauche)
o+='<div id="supportMini" onclick="openSupportBox()" style="display:none;position:fixed;bottom:20px;left:20px;z-index:900;background:#113f7a;color:#fff;border-radius:24px;padding:8px 14px;font-size:.78rem;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2);align-items:center;gap:6px">\u2764\ufe0f ORT</div>\n';
// Scripts header/footer/auth (ordre : config → i18n → header → footer)
o+='<script src="/js/ort-config.js"><\/script>\n';
o+='<script src="/js/ort-i18n-auth.js"><\/script>\n';
o+='<script src="/js/ort-header.js"><\/script>\n';
o+='<script src="/js/ort-footer.js"><\/script>\n';
// Redirection langue : quand l'utilisateur change la langue via le header,
// on le redirige vers la version traduite de cette page statique (via les hreflang)
o+="<script>\n";
o+="(function(){\n";
o+="  var langUrls={};\n";
o+="  document.querySelectorAll('link[hreflang]').forEach(function(el){\n";
o+="    var l=el.getAttribute('hreflang');\n";
o+="    if(l&&l!=='x-default'){\n";
o+="      try{var u=new URL(el.getAttribute('href'),window.location.origin);langUrls[l]=u.pathname;}catch(e){langUrls[l]=el.getAttribute('href');}\n";
o+="    }\n";
o+="  });\n";
o+="  // Intercepte le changement de langue du header (select.langpick ou liens .lang-link)\n";
o+="  document.addEventListener('change',function(e){\n";
o+="    var t=e.target;\n";
o+="    if(t.matches&&t.matches('.langpick,select[name=\"lang\"]')){\n";
o+="      var newLang=t.value;\n";
o+="      if(langUrls[newLang]){e.preventDefault();window.location.href=langUrls[newLang];return;}\n";
// Fallback : essayer en, puis fr
o+="      var fb=langUrls.en||langUrls.fr;\n";
o+="      if(fb){e.preventDefault();window.location.href=fb;}\n";
o+="    }\n";
o+="  });\n";
// Aussi intercepter les clics sur les liens de langue (si le header utilise des liens)
o+="  document.addEventListener('click',function(e){\n";
o+="    var a=e.target.closest&&e.target.closest('a[data-lang],a.lang-link');\n";
o+="    if(!a)return;\n";
o+="    var newLang=a.dataset.lang||a.textContent.trim().substring(0,2).toLowerCase();\n";
o+="    if(langUrls[newLang]){e.preventDefault();window.location.href=langUrls[newLang];return;}\n";
o+="    var fb=langUrls.en||langUrls.fr;\n";
o+="    if(fb){e.preventDefault();window.location.href=fb;}\n";
o+="  });\n";
o+="})();\n";
// Fix z-index : baisser le mapPanel quand la popup d'auth est visible
// pour que la popup ne passe pas derrière les marqueurs Leaflet
o+="(function(){\n";
o+="  var mp=document.getElementById('mapPanel');\n";
o+="  if(!mp)return;\n";
o+="  var obs=new MutationObserver(function(){\n";
o+="    var pop=document.getElementById('authPop');\n";
o+="    if(pop&&pop.style.display==='block'){mp.style.zIndex='1';}else{mp.style.zIndex='';}\n";
o+="  });\n";
o+="  // Observer le body pour détecter quand la popup s'ouvre (display change)\n";
o+="  setTimeout(function(){\n";
o+="    var pop=document.getElementById('authPop');\n";
o+="    if(pop)obs.observe(pop,{attributes:true,attributeFilter:['style']});\n";
o+="  },2000);\n";
o+="})();\n";
o+="<\/script>\n";
// Éditeur d'itinéraire (lazy : injecte juste un bouton, le reste au clic)
o+='<script src="/js/ort-itin-editor.js" defer><\/script>\n';
// Restauration automatique : si l'utilisateur connecté a modifié cet itinéraire,
// charger sa version personnalisée depuis Firestore
o+='<script src="/js/ort-state-manager.js" defer><\/script>\n';
o+="<script>\n";
o+="(function(){\n";
o+="  var ITIN_ID='"+esc(itinId)+"';\n";
o+="  var LANG='"+lang+"';\n";
o+="  function tryRestore(){\n";
o+="    if(!window.firebase||!window.firebase.auth||!window.ORT_STATE)return;\n";
o+="    var unsub=firebase.auth().onAuthStateChanged(function(user){\n";
o+="      unsub();\n";
o+="      if(!user)return;\n";
o+="      window.ORT_STATE.init({user:user}).then(function(){\n";
o+="        return window.ORT_STATE.getAllTrips();\n";
o+="      }).then(function(trips){\n";
o+="        if(!trips||!trips.length)return;\n";
// Chercher un voyage qui correspond à cet itinéraire
o+="        var match=null;\n";
o+="        trips.forEach(function(tr){\n";
o+="          if(tr._originalItinId===ITIN_ID&&tr.steps&&tr.steps.length>0){\n";
o+="            if(!match||tr.updatedAt>match.updatedAt)match=tr;\n";
o+="          }\n";
o+="        });\n";
o+="        if(!match)return;\n";
o+="        console.log('[ORT-RESTORE] Voyage personnalisé trouvé:',match.id,match.steps.length,'étapes');\n";
// Afficher un bandeau discret pour informer l'utilisateur — avec choix
o+="        var bar=document.createElement('div');\n";
o+="        bar.id='ort-restore-bar';\n";
o+="        bar.style.cssText='padding:10px 20px;background:linear-gradient(135deg,#f0f7ff,#e8f4fd);border-bottom:2px solid #d0dff0;text-align:center;font-size:.85rem;position:sticky;top:0;z-index:11000';\n";
o+="        var msgs={fr:'Vous avez une version personnalisée de cet itinéraire.',en:'You have a customized version of this itinerary.',es:'Tienes una versión personalizada de este itinerario.',pt:'Você tem uma versão personalizada deste itinerário.',it:'Hai una versione personalizzata di questo itinerario.',ar:'لديك نسخة مخصصة من هذا المسار.'};\n";
o+="        var loadMsgs={fr:'Charger ma version',en:'Load my version',es:'Cargar mi versión',pt:'Carregar minha versão',it:'Carica la mia versione',ar:'تحميل نسختي'};\n";
o+="        var editorMsgs={fr:'Ouvrir dans l\\'éditeur avancé',en:'Open in advanced editor',es:'Abrir en el editor avanzado',pt:'Abrir no editor avançado',it:'Apri nell\\'editor avanzato',ar:'فتح في المحرر المتقدم'};\n";
o+="        var dismissMsgs={fr:'Garder l\\'original',en:'Keep original',es:'Mantener el original',pt:'Manter o original',it:'Mantieni l\\'originale',ar:'الإبقاء على الأصلي'};\n";
o+="        var h2='<div style=\"color:#113f7a;font-weight:600;margin-bottom:8px\">\\u2728 '+(msgs[LANG]||msgs.en)+'</div>';\n";
o+="        h2+='<div style=\"display:flex;gap:8px;justify-content:center;flex-wrap:wrap\">';\n";
o+="        h2+='<button id=\"ort-restore-load\" style=\"padding:6px 14px;border:none;border-radius:8px;background:#113f7a;color:#fff;cursor:pointer;font-weight:600;font-size:.82rem\">'+(loadMsgs[LANG]||loadMsgs.en)+'</button>';\n";
o+="        h2+='<a href=\"/roadtrip_detail.html?tripId='+encodeURIComponent(match.id)+'&lang='+LANG+'\" style=\"padding:6px 14px;border:1px solid #113f7a;border-radius:8px;background:#fff;color:#113f7a;cursor:pointer;font-size:.82rem;text-decoration:none;font-weight:600\">'+(editorMsgs[LANG]||editorMsgs.en)+'</a>';\n";
o+="        h2+='<button id=\"ort-restore-dismiss\" style=\"padding:6px 14px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:.82rem;color:#555\">'+(dismissMsgs[LANG]||dismissMsgs.en)+'</button>';\n";
o+="        h2+='</div>';\n";
o+="        bar.innerHTML=h2;\n";
o+="        document.body.insertBefore(bar,document.body.firstChild);\n";
// Handlers
o+="        document.getElementById('ort-restore-load').addEventListener('click',function(){\n";
o+="          bar.remove();\n";
o+="          if(window.ORT_ITIN_EDITOR){window.ORT_ITIN_EDITOR._launch();}\n";
o+="        });\n";
o+="        document.getElementById('ort-restore-dismiss').addEventListener('click',function(){\n";
o+="          bar.remove();\n";
o+="        });\n";
o+="      }).catch(function(e){console.warn('[ORT-RESTORE]',e);});\n";
o+="    });\n";
o+="  }\n";
o+="  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(tryRestore,2000);});\n";
o+="  else setTimeout(tryRestore,2000);\n";
o+="})();\n";
o+="<\/script>\n";
o+="</body>\n</html>";
return o;
}
module.exports=generateHTML;
