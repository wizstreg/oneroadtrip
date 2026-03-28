@echo off
chcp 65001 >nul
title Gestionnaire de Photos JSON - Serveur Local
color 0A

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║        🚀 Gestionnaire de Photos JSON - Démarrage        ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo ⏳ Démarrage du serveur web local...
echo.

REM Se placer dans le dossier du script
cd /d "%~dp0"

REM Démarrer le serveur Python en arrière-plan
echo 📡 Serveur démarré sur http://localhost:8000
echo.
start /B python -m http.server 8000 2>nul

REM Attendre que le serveur soit prêt
timeout /t 3 /nobreak >nul

REM Ouvrir le navigateur
echo 🌐 Ouverture du navigateur...
start http://localhost:8000/photo-manager.html

echo.
echo ✅ Application lancée avec succès !
echo.
echo ┌─────────────────────────────────────────────────────────┐
echo │  L'application est maintenant ouverte dans votre        │
echo │  navigateur. Vous pouvez voir toutes vos photos !       │
echo │                                                          │
echo │  ⚠️  NE FERMEZ PAS CETTE FENÊTRE tant que vous          │
echo │      utilisez l'application !                           │
echo │                                                          │
echo │  Pour arrêter : Appuyez sur Ctrl+C ou fermez            │
echo │  cette fenêtre                                          │
echo └─────────────────────────────────────────────────────────┘
echo.

REM Garder la fenêtre ouverte et attendre
pause >nul