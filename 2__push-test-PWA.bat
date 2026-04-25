@echo off
echo ================================================================
echo               ONE ROAD TRIP - PUSH TEST ONLY (PWA)
echo ================================================================
echo.

echo [1/3] Verification et scraping des hotels manquants...
echo ----------------------------------------------------------------
node "C:\OneRoadTrip\data\Roadtripsprefabriques\tools\script\check-and-scrape-hotels.js"

if errorlevel 1 (
    echo.
    echo [ERREUR] Probleme lors du traitement des hotels
    pause
    exit /b 1
)

echo.
echo [2/3] Decoupe des hotels par pays/initiale...
echo ----------------------------------------------------------------
node "C:\OneRoadTrip\data\Roadtripsprefabriques\tools\script\divide-hotels.js"

if errorlevel 1 (
    echo.
    echo [ERREUR] Probleme lors du decoupe des hotels
    pause
    exit /b 1
)

echo.
echo [2.5/3] Injection du snippet PWA dans les HTML (TEST ONLY)...
echo ----------------------------------------------------------------
node "C:\OneRoadTrip\data\Roadtripsprefabriques\tools\script\inject-pwa-snippet.mjs" --test

if errorlevel 1 (
    echo.
    echo [WARN] Erreurs lors de l'injection PWA, mais on continue
)

echo.
echo [3/3] Push UNIQUEMENT vers Ort test...
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
    git commit -m "PWA test %date% %time%"
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
