import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto py-12 px-6 space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar ao início
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Termos de Uso</h1>
          <p className="text-muted-foreground mt-2">Última atualização: {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
        </div>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">1. Objeto</h2>
            <p>O RelatórioFlow é uma plataforma de geração de relatórios profissionais com auxílio de inteligência artificial. O serviço transforma anotações do usuário em documentos estruturados, incluindo relatórios técnicos, diários de obra, vistorias, laudos e outros tipos de documentos profissionais.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">2. Cadastro e Conta</h2>
            <p>O usuário é responsável por manter a confidencialidade de suas credenciais de acesso. Todas as atividades realizadas através da sua conta são de sua responsabilidade. O usuário deve fornecer informações verdadeiras e mantê-las atualizadas.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">3. Planos e Pagamento</h2>
            <p>O RelatórioFlow oferece planos gratuitos e pagos. Os pagamentos são processados via PagBank, com cobranças mensais ou anuais conforme o plano escolhido. Os valores dos planos podem ser consultados na página de preços da plataforma.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">4. Cancelamento e Reembolso</h2>
            <p>O cancelamento pode ser feito a qualquer momento pela plataforma. Oferecemos garantia de reembolso integral em até 7 (sete) dias corridos após a contratação do plano pago. Após esse período, o cancelamento encerra o acesso ao final do período já pago.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">5. Uso Aceitável</h2>
            <p>É vedado o uso da plataforma para fins ilegais, fraudulentos ou que violem direitos de terceiros. O usuário não deve tentar acessar áreas restritas, interferir no funcionamento do serviço ou utilizar a plataforma para gerar conteúdo ilícito.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">6. Propriedade Intelectual</h2>
            <p>Os relatórios gerados pertencem integralmente ao usuário. A plataforma RelatórioFlow, sua marca, design, código-fonte e tecnologia são de propriedade exclusiva dos seus desenvolvedores.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">7. Exclusão de Dados</h2>
            <p>O usuário pode solicitar a exclusão de seus dados a qualquer momento através de Configurações → Conta → Excluir conta. A exclusão é permanente e irreversível.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">8. Limitação de Responsabilidade</h2>
            <p>O RelatórioFlow não se responsabiliza por danos diretos ou indiretos resultantes do uso ou impossibilidade de uso do serviço. Os relatórios gerados pela IA devem ser revisados pelo usuário antes de uso profissional.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">9. Foro</h2>
            <p>Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes destes Termos de Uso.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">10. Contato</h2>
            <p>Para dúvidas sobre estes termos, entre em contato pelo e-mail{" "}
              <a href="mailto:contato@relatorioflow.com.br" className="text-primary hover:underline">contato@relatorioflow.com.br</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}