@echo off
title e COH v2.0 Vercel Deployer
echo ===================================================
echo     e COH v2.0 - Vercel Deployment Assistant
echo ===================================================
echo.
echo Deploying e COH v2.0 Web ^& Android APK to Vercel...
echo.

where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo Vercel CLI is not installed. Installing Vercel globally via npm...
    call npm install -g vercel
)

echo.
echo Starting Vercel Production Deployment...
call vercel --prod

echo.
echo ===================================================
echo Deployment completed!
echo Copy your Vercel URL and generate a QR Code using:
echo https://api.qrserver.com/v1/create-qr-code/?size=300x300^&data=YOUR_VERCEL_URL
echo ===================================================
pause
