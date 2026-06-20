@echo off
echo ================================================================
echo               ONE ROAD TRIP - PUSH TEST ONLY (PWA)
echo ================================================================
echo.

echo [1/2] Hotels : nettoyage + divide vers Ort test (sans recherche ni photos)...
echo ----------------------------------------------------------------
node "C:\OneRoadTrip\data\Roadtripsprefabriques\tools\script\fix-hotels-all-in-one.js" --no-replace --no-enrich --no-distance --divide=test

if errorlevel 1 (
    echo.
    echo [ERREUR] Probleme lors du traitement des hotels
    pause
    exit /b 1
)

echo.
echo [1.5/2] Injection du snippet PWA dans les HTML (TEST ONLY)...
echo ----------------------------------------------------------------
node "C:\OneRoadTrip\data\Roadtripsprefabriques\tools\script\inject-pwa-snippet.mjs" --test

if errorlevel 1 (
    echo.
    echo [WARN] Erreurs lors de l'injection PWA, mais on continue
)

echo.
echo [2/2] Push UNIQUEMENT vers Ort test...
echo ----------------------------------------------------------------

echo.
echo --- Nettoyage lock Git ---
if exist "C:\Ort test\.git\index.lock" (
    del "C:\Ort test\.git\index.lock"
    echo Lock supprime: Ort test
)

echo.
echo --- Ort test ---
cd /d "C:\Ort test"

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [WARN] Pas de remote configure - skip push
) else (
    git add .
    git commit -m "update %date% %time%"
    git push
    if errorlevel 1 (
        echo [WARN] Erreur push Ort test
    )
)

echo.
echo ================================================================
echo                    TERMINE - ORT TEST DEPLOYE
echo ================================================================
pause
