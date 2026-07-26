@echo off
REM --- Lancement local du site TEST ---

set "ROOT=C:\Ort test\"
set "PORT=8040"

if not exist "%ROOT%ort_server.py" (
  echo [ERREUR] ort_server.py introuvable dans %ROOT%
  pause
  exit /b 1
)

echo ========================================
echo   OneRoadTrip TEST
echo   Dossier : %ROOT%
echo   Port    : %PORT%
echo ========================================

REM --- Lancer le serveur dans le dossier test ---
start "ORT TEST %PORT%" cmd /k "cd /d ""%ROOT%"" && python ort_server.py %PORT%"

REM --- Laisser 2s au serveur pour demarrer ---
>nul ping 127.0.0.1 -n 3

REM --- Ouvrir le navigateur (Firefox, navigation privee) ---
start "" "firefox.exe" -private-window "http://127.0.0.1:%PORT%/index.html"
