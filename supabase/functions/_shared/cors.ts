const ALLOWED_ORIGINS = [
  'https://relatorioflow.com.br',
  'https://www.relatorioflow.com.br',
  'https://app.relatorioflow.com.br',
  // Permitir localhost apenas em dev (Supabase local)
  'http://localhost:5173',
  'http://localhost:3000',
]

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin',
  }
}
