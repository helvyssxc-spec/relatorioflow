$git = "C:\Users\HelvysCastro\AppData\Local\Programs\Git\cmd\git.exe"
& $git config --global user.name "RelatorioFlow Admin"
& $git config --global user.email "admin@relatorioflow.com"
Write-Host "Configuração atualizada." -ForegroundColor Green
& $git add .
Write-Host "Arquivos adicionados." -ForegroundColor Green
& $git commit -m "fix(db): Add missing professional_role, register routes and fix marking notifications read"
Write-Host "Commit efetuado." -ForegroundColor Green
& $git push origin main
Write-Host "Push finalizado." -ForegroundColor Green
