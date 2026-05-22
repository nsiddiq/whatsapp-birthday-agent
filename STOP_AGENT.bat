@echo off
echo Stopping Birthday Agent...
taskkill /f /im node.exe /fi "WINDOWTITLE eq *birthday*" >nul 2>nul
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /f /pid %%p >nul 2>nul
echo Done.
pause
