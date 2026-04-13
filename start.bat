@echo off
:: =============================================================================
::  HESTIM Planner — Script de démarrage Windows (CMD)
::  Utilise Git Bash pour exécuter start.sh
:: =============================================================================

setlocal EnableDelayedExpansion
title HESTIM Planner — Démarrage

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║        HESTIM Planner — Démarrage           ║
echo  ║   Projet PACTE - École d'Ingénierie HESTIM  ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: Détecter Git Bash
set "GITBASH="
if exist "C:\Program Files\Git\bin\bash.exe" (
    set "GITBASH=C:\Program Files\Git\bin\bash.exe"
) else if exist "C:\Program Files (x86)\Git\bin\bash.exe" (
    set "GITBASH=C:\Program Files (x86)\Git\bin\bash.exe"
) else (
    :: Essayer via PATH
    where bash >nul 2>&1
    if !errorlevel! == 0 (
        set "GITBASH=bash"
    )
)

if "!GITBASH!"=="" (
    echo  [ERREUR] Git Bash introuvable.
    echo  Installez Git for Windows : https://git-scm.com/download/win
    echo  Ou utilisez manuellement :
    echo    1. cd backend ^&^& node server.js
    echo    2. node seed.js
    echo    3. cd ..\frontend ^&^& npm run dev
    pause
    exit /b 1
)

echo  Git Bash trouvé : !GITBASH!
echo.

:: Récupérer le répertoire du script
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

:: Options (passer les arguments du bat)
set "ARGS=%*"

echo  Lancement via Git Bash...
echo  (Fermez cette fenêtre ou appuyez sur Ctrl+C pour arrêter)
echo.

"!GITBASH!" "%SCRIPT_DIR%\start.sh" !ARGS!

pause
