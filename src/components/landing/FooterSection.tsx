import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

const FooterSection = () => (
  <footer className="border-t border-border py-12 bg-primary text-primary-foreground">
    <div className="container mx-auto px-4">
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-accent" />
            <span className="font-bold text-lg">RelatórioFlow</span>
          </div>
          <p className="text-sm text-primary-foreground/60">
            Transforme anotações em relatórios profissionais com IA.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Produto</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/60">
            <li><a href="#como-funciona" className="hover:text-accent transition-colors">Como funciona</a></li>
            <li><a href="#precos" className="hover:text-accent transition-colors">Preços</a></li>
            <li><a href="#faq" className="hover:text-accent transition-colors">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Legal</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/60">
            <li><Link to="/terms" className="hover:text-accent transition-colors">Termos de Uso</Link></li>
            <li><Link to="/privacy" className="hover:text-accent transition-colors">Privacidade</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Contato</h4>
          <Link to="/support" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">Abrir chamado (Suporte)</Link>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 mt-8 pt-8 text-center text-sm text-primary-foreground/40">
        © {new Date().getFullYear()} RelatórioFlow. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);

export default FooterSection;
