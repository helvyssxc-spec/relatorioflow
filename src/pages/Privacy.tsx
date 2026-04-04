import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto py-12 px-6 space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar ao início
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
          <p className="text-muted-foreground mt-2">Em conformidade com a LGPD (Lei 13.709/2018)</p>
        </div>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">1. Dados Coletados</h2>
            <p>Coletamos as seguintes informações: nome completo, endereço de e-mail, nome da empresa, conteúdo dos relatórios gerados (texto, fotos e metadados), dados de pagamento (processados pelo PagBank) e informações de uso da plataforma.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">2. Finalidade</h2>
            <p>Os dados são utilizados exclusivamente para a prestação do serviço de geração de relatórios, processamento de pagamentos, comunicação com o usuário e melhoria contínua da plataforma.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">3. Compartilhamento</h2>
            <p>Seus dados podem ser compartilhados com: PagBank (processamento de pagamentos) e provedores de infraestrutura (hospedagem e armazenamento). Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">4. Retenção</h2>
            <p>Seus dados são mantidos enquanto sua conta estiver ativa. Após a exclusão da conta, os dados são removidos permanentemente em até 30 dias, exceto quando a retenção for necessária para cumprimento de obrigações legais.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">5. Direitos do Titular (Art. 18 LGPD)</h2>
            <p>Você tem direito a: confirmação da existência de tratamento, acesso aos dados, correção de dados incompletos ou desatualizados, anonimização ou bloqueio de dados desnecessários, portabilidade dos dados, eliminação dos dados pessoais, informação sobre compartilhamento e revogação do consentimento.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">6. Como Exercer Seus Direitos</h2>
            <p>Para exercer seus direitos, acesse Configurações → Conta → Excluir conta na plataforma, ou entre em contato conosco pelo e-mail abaixo. Responderemos em até 15 dias úteis.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">7. Contato</h2>
            <p>Para dúvidas sobre esta política ou para exercer seus direitos como titular de dados, entre em contato pelo e-mail{" "}
              <a href="mailto:contato@relatorioflow.com.br" className="text-primary hover:underline">contato@relatorioflow.com.br</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}