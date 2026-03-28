#!/usr/bin/env node
/**
 * ORT - Vérification des licences Wikimedia
 * Vérifie les photos Wikimedia et supprime les NC (Non-Commercial)
 * Nettoie le JSON ET les fichiers Excel
 */

import fs from 'fs/promises';
import path from 'path';
import ExcelJS from 'exceljs';

const BATCH_SIZE = 50; // Wikimedia accepte 50 titres par requête
const DELAY_BETWEEN_BATCHES = 1000; // 1 seconde

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Extraire le nom de fichier depuis l'URL Wikimedia
function extractFileName(url) {
  const match = url.match(/\/([^\/]+\.(jpg|jpeg|png|gif|svg|webp|tif|tiff))$/i);
  if (match) {
    return decodeURIComponent(match[1]).replace(/_/g, ' ');
  }
  return null;
}

// Vérifier les licences d'un batch de fichiers
async function checkLicensesBatch(fileNames) {
  const titles = fileNames.map(f => 'File:' + f).join('|');
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata&titles=${encodeURIComponent(titles)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  ⚠️ API error: ${response.status}`);
      return {};
    }
    
    const data = await response.json();
    const pages = data.query?.pages || {};
    
    const results = {};
    for (const pageId in pages) {
      const page = pages[pageId];
      if (!page.title) continue;
      
      const fileName = page.title.replace(/^File:/, '');
      const meta = page.imageinfo?.[0]?.extmetadata || {};
      const license = (meta.LicenseShortName?.value || 'unknown').toLowerCase();
      const licenseUrl = (meta.LicenseUrl?.value || '').toLowerCase();
      
      // Détecter NC (Non-Commercial)
      const isNC = license.includes('nc') || 
                   license.includes('non-commercial') || 
                   licenseUrl.includes('-nc');
      
      results[fileName] = {
        license: meta.LicenseShortName?.value || 'unknown',
        isNC,
        isOK: !isNC
      };
    }
    
    return results;
  } catch (error) {
    console.warn(`  ⚠️ Fetch error: ${error.message}`);
    return {};
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Trouver le fichier JSON
  let jsonPath = args[0];
  if (!jsonPath) {
    // Chercher dans les emplacements courants
    const possiblePaths = [
      './photos_lieux.json',
      '../photos-json/photos_lieux.json',
      'C:/OneRoadTrip/data/photos-json/photos_lieux.json'
    ];
    for (const p of possiblePaths) {
      try {
        await fs.access(p);
        jsonPath = p;
        break;
      } catch {}
    }
  }
  
  if (!jsonPath) {
    console.error('❌ Usage: node check-wiki-licenses.mjs <chemin/vers/photos_lieux.json>');
    process.exit(1);
  }

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       ORT - Vérification Licences Wikimedia               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\n📂 Fichier: ${jsonPath}`);

  // Charger le JSON
  const content = await fs.readFile(jsonPath, 'utf-8');
  const data = JSON.parse(content);
  
  // Extraire les URLs Wikimedia
  const wikiUrlToPlaces = new Map(); // url -> [placeId, ...]
  let totalPhotos = 0;
  let pexelsCount = 0;
  
  for (const placeId in data) {
    const photos = data[placeId].photos || [];
    for (const url of photos) {
      totalPhotos++;
      if (url.includes('pexels.com')) {
        pexelsCount++;
      } else if (url.includes('wikimedia.org') || url.includes('wikipedia.org')) {
        if (!wikiUrlToPlaces.has(url)) {
          wikiUrlToPlaces.set(url, []);
        }
        wikiUrlToPlaces.get(url).push(placeId);
      }
    }
  }
  
  console.log(`\n📊 Statistiques:`);
  console.log(`   Total photos: ${totalPhotos}`);
  console.log(`   Pexels: ${pexelsCount} (OK)`);
  console.log(`   Wikimedia à vérifier: ${wikiUrlToPlaces.size}`);
  
  // Extraire les noms de fichiers
  const urlToFileName = new Map();
  for (const url of wikiUrlToPlaces.keys()) {
    const fileName = extractFileName(url);
    if (fileName) {
      urlToFileName.set(url, fileName);
    }
  }
  
  console.log(`   Fichiers identifiés: ${urlToFileName.size}`);
  
  // Vérifier les licences par batches
  console.log(`\n🔍 Vérification des licences...`);
  
  const fileNames = [...new Set(urlToFileName.values())];
  const licenseResults = {};
  
  const totalBatches = Math.ceil(fileNames.length / BATCH_SIZE);
  
  for (let i = 0; i < fileNames.length; i += BATCH_SIZE) {
    const batch = fileNames.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    process.stdout.write(`\r   Batch ${batchNum}/${totalBatches}...`);
    
    const results = await checkLicensesBatch(batch);
    Object.assign(licenseResults, results);
    
    if (i + BATCH_SIZE < fileNames.length) {
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }
  
  console.log(`\r   ✓ ${Object.keys(licenseResults).length} fichiers vérifiés`);
  
  // Analyser les résultats
  let okCount = 0;
  let ncCount = 0;
  let unknownCount = 0;
  const ncUrls = [];
  
  for (const [url, fileName] of urlToFileName) {
    const result = licenseResults[fileName];
    if (!result) {
      unknownCount++;
    } else if (result.isNC) {
      ncCount++;
      ncUrls.push({ url, fileName, license: result.license, places: wikiUrlToPlaces.get(url) });
    } else {
      okCount++;
    }
  }
  
  console.log(`\n📋 Résultats:`);
  console.log(`   ✅ OK (commercial): ${okCount}`);
  console.log(`   ❌ NC (non-commercial): ${ncCount}`);
  console.log(`   ❓ Inconnu: ${unknownCount}`);
  
  if (ncCount > 0) {
    console.log(`\n❌ Photos NC à supprimer:`);
    for (const nc of ncUrls.slice(0, 20)) {
      console.log(`   - ${nc.fileName.substring(0, 50)}... [${nc.license}]`);
    }
    if (ncUrls.length > 20) {
      console.log(`   ... et ${ncUrls.length - 20} autres`);
    }
  }
  
  // Générer le JSON nettoyé
  console.log(`\n🧹 Génération du JSON nettoyé...`);
  
  const ncUrlSet = new Set(ncUrls.map(nc => nc.url));
  const cleanedData = {};
  let removedCount = 0;
  
  for (const placeId in data) {
    const place = data[placeId];
    const photos = place.photos || [];
    const cleanedPhotos = photos.filter(url => {
      if (ncUrlSet.has(url)) {
        removedCount++;
        return false;
      }
      return true;
    });
    
    cleanedData[placeId] = {
      name: place.name,
      photos: cleanedPhotos
    };
  }
  
  // Sauvegarder
  const outputPath = jsonPath.replace('.json', '_clean.json');
  await fs.writeFile(outputPath, JSON.stringify(cleanedData, null, 2), 'utf-8');
  
  // Sauvegarder aussi la liste des NC pour référence
  const ncReportPath = jsonPath.replace('.json', '_nc_report.json');
  await fs.writeFile(ncReportPath, JSON.stringify(ncUrls, null, 2), 'utf-8');
  
  console.log(`\n   JSON nettoyé: ${outputPath}`);
  console.log(`   Rapport NC: ${ncReportPath}`);
  
  // Nettoyer les fichiers Excel
  console.log(`\n🧹 Nettoyage des fichiers Excel...`);
  
  const photosDir = path.resolve(path.dirname(jsonPath), '..', 'photos');
  let excelsCleaned = 0;
  let excelsErrors = 0;
  
  try {
    const files = await fs.readdir(photosDir);
    const excelFiles = files.filter(f => f.endsWith('_photos.xlsx'));
    
    for (const excelFile of excelFiles) {
      const excelPath = path.join(photosDir, excelFile);
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelPath);
        
        const sheet = workbook.getWorksheet('Places');
        if (!sheet) continue;
        
        let modified = false;
        
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Header
          
          // Colonnes photo_1 à photo_N (à partir de la colonne 3)
          for (let col = 3; col <= row.cellCount; col++) {
            const cell = row.getCell(col);
            const url = cell.value;
            
            if (url && typeof url === 'string' && ncUrlSet.has(url)) {
              cell.value = ''; // Supprimer l'URL NC
              modified = true;
            }
          }
        });
        
        if (modified) {
          await workbook.xlsx.writeFile(excelPath);
          excelsCleaned++;
          process.stdout.write(`\r   ✓ ${excelsCleaned} Excel nettoyés...`);
        }
      } catch (err) {
        excelsErrors++;
      }
    }
    
    console.log(`\r   ✓ ${excelsCleaned} fichiers Excel nettoyés`);
    if (excelsErrors > 0) {
      console.log(`   ⚠️ ${excelsErrors} erreurs`);
    }
  } catch (err) {
    console.log(`   ⚠️ Dossier photos non trouvé: ${photosDir}`);
  }
  
  console.log(`\n✅ Terminé!`);
  console.log(`   Photos NC supprimées: ${removedCount}`);
}

main().catch(error => {
  console.error('\n❌ Erreur:', error.message);
  process.exit(1);
});
