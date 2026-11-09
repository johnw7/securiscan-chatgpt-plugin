@echo off
rem NOAMIS - Espace Projet : lanceur pour Windows (double-clic)
chcp 65001 >nul
cd /d "%~dp0"
title NOAMIS - Espace Projet
echo NOAMIS - Espace Projet
echo ======================
echo.
where node >nul 2>nul
if errorlevel 1 goto nonode
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)"
if errorlevel 1 goto oldnode
if exist node_modules goto run
echo Première utilisation : installation en cours, 1 à 2 minutes, connexion internet nécessaire...
call npm install --omit=dev --no-audit --no-fund
if errorlevel 1 goto installfail
:run
set OPEN_BROWSER=1
node --disable-warning=ExperimentalWarning server.js
echo.
echo Application arrêtée.
pause
exit /b 0
:nonode
echo Node.js n'est pas installé sur cet ordinateur.
echo La page de téléchargement va s'ouvrir : installez la version LTS,
echo puis double-cliquez de nouveau sur ce lanceur.
start "" "https://nodejs.org/fr/download"
pause
exit /b 1
:oldnode
echo Votre version de Node.js est trop ancienne : il faut la version 22.13 ou plus récente.
start "" "https://nodejs.org/fr/download"
pause
exit /b 1
:installfail
echo L'installation a échoué. Vérifiez votre connexion internet puis réessayez.
pause
exit /b 1
