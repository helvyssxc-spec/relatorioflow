import { test, expect } from "@playwright/test";
import path from "path";

/**
 * MASTER SWEEP - RelatórioFlow
 * Valida os 12 tipos de relatórios, upload de fotos e exportação.
 */

const BASE_URL = "https://relatorioflow.com.br";
const TEST_USER = "automation@relatorioflow.com.br";
const TEST_PASS = "admin_automation_2026";

const REPORT_TYPES = [
  "relatorio_tecnico", "vistoria", "laudo_tecnico", "diario_de_obra", 
  "proposta_comercial", "orcamento", "ata_reuniao", "parecer_tecnico", 
  "inspecao", "manutencao", "auditoria", "outro"
];

test.describe.serial("Varredura Global de Estabilidade (12 Modelos)", () => {
  
  test.beforeEach(async ({ page }) => {
    console.log("Iniciando sessão de teste...");
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[id="email"]', TEST_USER);
    await page.fill('input[id="password"]', TEST_PASS);
    await page.click('button:has-text("Entrar na plataforma")');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
  });

  for (const type of REPORT_TYPES) {
    test(`deve gerar e validar modelo: ${type}`, async ({ page }) => {
      console.log(`Testando modelo: ${type}`);
      
      // 1. Seleciona o Tipo de Relatório
      await page.locator('button[role="combobox"]').first().click(); // Abre o Select de tipos
      await page.getByRole('option', { name: getLabel(type), exact: true }).click();
      
      // 2. Preenchimento de Campos Obrigatórios
      await page.fill('textarea[placeholder*="Descreva o que aconteceu"]', `RELATÓRIO DE ESTABILIDADE - MODELO ${type.toUpperCase()}.\nGerado automaticamente para validação de estética premium.\nItens: Verificado, Aprovado, Pendente.`);

      // 3. Upload de Foto de Teste
      console.log("Fazendo upload de foto de teste...");
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.click('button:has-text("Adicionar fotos")'),
      ]);
      await fileChooser.setFiles(path.join(__dirname, 'test-image.jpg'));
      
      // Aguarda o upload e o preview
      await expect(page.locator('img[alt*="Foto 1"]')).toBeVisible({ timeout: 20000 });

      // 4. Aciona a IA
      console.log("Gerando conteúdo via IA...");
      await page.click('button:has-text("Gerar Relatório Profissional")');
      
      // 5. Aguarda processamento
      await expect(page.locator("text=✅ Relatório pronto!")).toBeVisible({ timeout: 120000 });

      // 6. Validação do Motor de PDF
      console.log("Validando botões de exportação...");
      await expect(page.locator("button:has-text('Baixar PDF')")).toBeVisible();
      
      // Captura evidência visual
      await page.screenshot({ path: `tests/e2e/results/sweep-${type}.png`, fullPage: true });
      
      console.log(`Modelo ${type} validado com sucesso!`);
    });
  }
});

function getLabel(type: string) {
  const labels: Record<string, string> = {
    "relatorio_tecnico": "Relatório Técnico",
    "vistoria": "Vistoria",
    "laudo_tecnico": "Laudo Técnico",
    "diario_de_obra": "Diário de Obra",
    "proposta_comercial": "Proposta Comercial",
    "orcamento": "Orçamento",
    "ata_reuniao": "Ata de Reunião",
    "parecer_tecnico": "Parecer Técnico",
    "inspecao": "Inspeção",
    "manutencao": "Rel. de Manutenção",
    "auditoria": "Auditoria",
    "outro": "Outro"
  };
  return labels[type] || type;
}
