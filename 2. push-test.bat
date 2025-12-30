@echo off
cd /d C:\Ort test
git add .
git commit -m "update %date% %time%"
git push
pause