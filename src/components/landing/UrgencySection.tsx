import { Rocket, Users, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const UrgencySection = () => (
  <section className="py-16 bg-primary">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 border border-accent/30 px-4 py-1.5 text-sm font-bold text-accent">
          <Timer className="h-4 w-4" /> Acesso Antecipado
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-primary-foreground">
          Acesso antecipado em fase inicial
        </h2>
        <p className="text-lg text-primary-foreground/70">
          Garanta sua vaga e comece a usar antes da versão completa. Quem entra agora terá condições exclusivas.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
            <Rocket className="h-4 w-4 text-accent" />
            <span>Novos recursos primeiro</span>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
            <Users className="h-4 w-4 text-accent" />
            <span>Vagas limitadas</span>
          </div>
        </div>
        <Button asChild size="lg" className="h-14 px-10 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/30 text-lg font-bold">
          <Link to="/register">
            Garantir minha vaga <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
);

export default UrgencySection;
