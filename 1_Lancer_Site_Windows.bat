@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM --- Base = dossier du .bat ---
set "BASE=%~dp0"

REM --- Détermine la racine à servir (V26 si présent, sinon BASE) ---
set "ROOT="
if exist "%BASE%index.html" set "ROOT=%BASE%"
if not defined ROOT if exist "%BASE%web\index.html" set "ROOT=%BASE%web\"
if not defined ROOT if exist "%BASE%V26\web\index.html" set "ROOT=%BASE%V26\web\"
if not defined ROOT (
  echo Introuvable: "%BASE%index.html" ou "%BASE%web\index.html" ou "%BASE%V26\web\index.html"
  pause
  exit /b 1
)

REM --- Vérifier que ort_server.py existe ---
if not exist "%ROOT%ort_server.py" (
  echo [ERREUR] ort_server.py non trouvé dans %ROOT%
  echo Copiez ort_server.py dans le dossier racine du site.
  pause
  exit /b 1
)

REM --- Choisir un port libre (8030 -> 8049) ---
for /l %%P in (8030,1,8049) do (
  (netstat -ano | findstr /r /c:":%%P .*LISTENING" >nul) || (set "PORT=%%P" & goto :gotPort)
)
echo Aucun port libre entre 8030 et 8049.
pause
exit /b 1
:gotPort

REM --- Cache-buster (timestamp) ---
for /f "delims=" %%a in ('powershell -NoProfile -Command "(Get-Date).ToFileTimeUtc()"') do set "BUST=%%a"

echo.
echo ========================================
echo   OneRoadTrip Server
echo ========================================
echo Racine     : %ROOT%
echo Port       : %PORT%
echo Cache-bust : %BUST%
echo.

REM --- Tue toute instance python sur ce port (au cas où) ---
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING') do taskkill /PID %%p /F >nul 2>&1

REM --- Lancer le serveur custom DANS le bon dossier ---
start "ORT SERVER %PORT%" cmd /k "cd /d ""%ROOT%"" && python ort_server.py %PORT%"

REM --- Attendre que le serveur écoute (jusqu'à ~4s) ---
set /a tries=0
:waitSrv
set /a tries+=1
>nul ping 127.0.0.1 -n 2
netstat -ano | findstr /r /c:":%PORT% .*LISTENING" >nul && goto :openBrowser
if %tries% LSS 4 goto :waitSrv
echo Le serveur ne semble pas demarrer. Regarde la fenetre "ORT SERVER %PORT%" pour l'erreur.
pause
exit /b 1

:openBrowser
REM --- Vérif rapide: telecharge index pour contrôler la version servie
curl -s "http://127.0.0.1:%PORT%/index.html?v=%BUST%" | findstr /c:"OneRoadTrip" >nul
if errorlevel 1 echo [Alerte] index.html ne contient pas la chaine attendue (verifie le bon dossier).

REM --- Ouvrir en navigation privée (Firefox) avec cache-buster
start "" "firefox.exe" -private-window "http://127.0.0.1:%PORT%/index.html?v=%BUST%"
REM Si tu utilises Edge : 
REM start "" "msedge.exe" -inprivate "http://127.0.0.1:%PORT%/index.html?v=%BUST%"

endlocal
