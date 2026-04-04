import { test, expect } from "@playwright/test";

/**
 * Esse teste realiza uma "varredura" completa (E2E) no sistema RelatórioFlow.
 * Ele ignora a página de manutenção acessando diretamente a rota de /login,
 * autentica com o usuário de automação e gera um relatório real.
 */

const BASE_URL = "https://relatorioflow.com.br";
const TEST_USER = "automation@relatorioflow.com.br";
const TEST_PASS = "admin_automation_2026";

test.describe("Varredura de Ferramenta (E2E Sweep)", () => {
  test("deve realizar login e gerar um relatório completo", async ({ page }) => {
    // 1. Acesso ao Login (Bypassing Maintenance)
    console.log("Acessando página de login...");
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator("h1")).toContainText(/Bem-vindo/i);

    // 2. Autenticação
    console.log("Realizando autenticação...");
    await page.fill('input[type="email"]', TEST_USER);
    await page.fill('input[type="password"]', TEST_PASS);
    await page.click('button:has-text("Entrar na conta")');

    // Aguarda um pouco para ver se houve erro de credenciais (opcional, mas o .toHaveURL abaixo cuidará disso)
    await page.waitForTimeout(1000);

    // 3. Verificação do Dashboard
    console.log("Verificando carregamento do Dashboard...");
    try {
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
      await expect(page.locator("h2")).toContainText(/Olá/);
    } catch (error) {
      console.error("ERRO: Falha ao carregar o Dashboard. Verifique se as credenciais do usuário de automação (automation@relatorioflow.com.br) estão corretas e se o seeder foi aplicado no banco de dados.");
      throw error;
    }

    // 4. Preenchimento de Relatório
    console.log("Preenchendo dados do relatório de teste...");
    const testNotes = `RELATÓRIO DE VARREDURA AUTOMATIZADA
Data do Teste: ${new Date().toLocaleString()}
Status: Em Homologação
Objetivo: Validar o fluxo completo de geração de IA em produção.
Descrição: Este relatório foi gerado automaticamente pelo Playwright-MCP para garantir que todos os serviços (Vercel, Supabase, Gemini API) estão operacionais.`;

    // Localiza o textarea de notas
    await page.fill('textarea[placeholder*="Descreva"]', testNotes);

    // 5. Geração via IA
    console.log("Iniciando geração via IA (isso pode levar alguns segundos)...");
    await page.click('button:has-text("Gerar Relatório Profissional")');

    // 6. Aguarda o processamento
    // O sistema exibe "Processando Inteligência Artificial..." e depois "✅ Relatório pronto!"
    await expect(page.locator("text=✅ Relatório pronto!")).toBeVisible({ timeout: 60000 });

    // 7. Validação Final
    console.log("Validando botões de exportação...");
    await expect(page.locator("button:has-text('Baixar PDF')")).toBeVisible();
    await expect(page.locator("button:has-text('Copiar')")).toBeVisible();

    console.log("Varredura concluída com sucesso! 🎉");
  });
});
