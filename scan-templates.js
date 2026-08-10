"use strict";
// Scanne un dossier de pages générées et compte quel template chaque page utilise.
// Usage : node scan-templates.js "C:\Ort test v4"
var fs=require("fs"),path=require("path");
var root=process.argv[2]||process.cwd();
var count={3:0,5:0,6:0,7:0,8:0};
var total=0,withTracking=0;
function walk(dir){
  var items;try{items=fs.readdirSync(dir,{withFileTypes:true});}catch(e){return;}
  items.forEach(function(it){
    var p=path.join(dir,it.name);
    if(it.isDirectory()){walk(p);return;}
    if(!it.name.toLowerCase().endsWith(".html"))return;
    var html;try{html=fs.readFileSync(p,"utf8");}catch(e){return;}
    total++;
    if(html.indexOf("template_events")!==-1)withTracking++;
    var tpl=3;
    if(html.indexOf("--c5-primary")!==-1)tpl=5;
    else if(html.indexOf("minmax(360px,44%)")!==-1)tpl=6;
    else if(html.indexOf("imm-card")!==-1)tpl=7;
    else if(html.indexOf("tl-day")!==-1)tpl=8;
    count[tpl]++;
  });
}
walk(root);
console.log("Dossier scanne   : "+root);
console.log("Pages HTML       : "+total);
console.log("Avec tracking V4 : "+withTracking+(total?(" ("+Math.round(withTracking/total*100)+"%)"):""));
console.log("Repartition par template :");
[3,5,6,7,8].forEach(function(n){
  var c=count[n];var pct=total?Math.round(c/total*100):0;
  var label={3:"3 (V3 actuel)",5:"5 Classique",6:"6 Deux colonnes",7:"7 Immersif",8:"8 Timeline"}[n];
  console.log("  template "+label+" : "+c+" ("+pct+"%)");
});
if(withTracking===0&&total>0)console.log("\n[ALERTE] Aucune page ne contient le tracking V4 : tu regardes sans doute l'ancien dossier (C:\\Ort test) au lieu de C:\\Ort test v4.");
if(count[3]===total&&total>0)console.log("\n[ALERTE] Toutes les pages sont en template 3. Le routage n'a pas pris : verifie que template-5/6/7/8.js sont bien dans tools\\script.");
