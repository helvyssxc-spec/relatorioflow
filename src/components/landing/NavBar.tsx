import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

const NavBar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <FileText className="h-7 w-7 text-accent" />
        <span className="font-bold text-xl text-foreground">RelatórioFlow</span>
      </Link>
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
        <a href="#demonstracao" className="hover:text-accent transition-colors">Demonstração</a>
        <a href="#como-funciona" className="hover:text-accent transition-colors">Como funciona</a>
        <a href="#precos" className="hover:text-accent transition-colors">Preços</a>
        <a href="#faq" className="hover:text-accent transition-colors">FAQ</a>
      </div>
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/login">Entrar</Link>
        </Button>
        <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/register">Começar grátis</Link>
        </Button>
      </div>
    </div>
  </nav>
);

export default NavBar;
