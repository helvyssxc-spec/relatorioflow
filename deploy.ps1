Write-Host "====== Sincronizando Segredos (Production) ======"
# Umami
npx supabase secrets set UMAMI_API_KEY="api_qDSTGZzsQ3bz7bBrw6OetfedcPuKDzuE" --project-ref lmydxgmiytiwgfmjjxdb
npx supabase secrets set UMAMI_WEBSITE_ID="1d79c38e-f228-48c8-973f-4a8bfc15e0d2" --project-ref lmydxgmiytiwgfmjjxdb

# PagBank Sandbox (Homologação)
Write-Host "Configurando PagBank para modo Sandbox/Homologação..."
npx supabase secrets set PAGBANK_API_URL="https://sandbox.api.pagseguro.com" --project-ref lmydxgmiytiwgfmjjxdb

Write-Host "`n====== Enviando Migrations ======"
npx supabase db push --project-ref lmydxgmiytiwgfmjjxdb

Write-Host "`n====== Implantando Todas as Edge Functions ======"
$functions = @("generate-report", "api-generate-report", "pagbank-checkout", "pagbank-cancel", "pagbank-webhook", "sync-umami-stats")

foreach ($fn in $functions) {
    Write-Host "Implantando: $fn..."
    npx supabase functions deploy $fn --project-ref lmydxgmiytiwgfmjjxdb --no-verify-jwt
}

Write-Host "`n====== Deploy Finalizado com Sucesso! ======"
Write-Host "O sistema está pronto para a varredura final."
