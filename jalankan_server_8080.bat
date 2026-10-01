@echo off
title Server Portal Open Data BMKG (Port 8080 - JavaScript Engine)
echo ====================================================================
echo   PORTAL OPEN DATA BMKG - PURE JAVASCRIPT ENGINE (PORT 8080)
echo ====================================================================
echo   Aplikasi web kini murni menggunakan JavaScript (.js) tanpa file HTML!
echo.
echo   Akses cepat antarmuka:
echo   - Beranda Utama   : http://localhost:8080/
echo   - Katalog Dataset : http://localhost:8080/katalog
echo.
echo   Tekan Ctrl+C untuk menghentikan server.
echo ====================================================================
echo.

cd /d "%~dp0"
node ui_prototype/server.js
pause
