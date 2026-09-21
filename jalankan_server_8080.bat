@echo off
title Server Portal Open Data BMKG (Port 8080)
echo ====================================================================
echo   PORTAL OPEN DATA BMKG - LOCAL SERVER (PORT 8080)
echo ====================================================================
echo   Website sedang aktif di:
echo   - Katalog Dataset : http://localhost:8080/katalog.html
echo   - Beranda Utama   : http://localhost:8080/index.html
echo.
echo   Tekan Ctrl+C untuk menghentikan server.
echo ====================================================================
echo.

cd /d "%~dp0\ui_prototype"

REM Deteksi python di path standar Windows
if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
    "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" -m http.server 8080
) else if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" -m http.server 8080
) else if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" -m http.server 8080
) else (
    python -m http.server 8080
)

pause
