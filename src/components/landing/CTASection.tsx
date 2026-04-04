import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto text-center rounded-2xl p-12 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(213,94%,52%,0.2),transparent_60%)]" />
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary-foreground">
            Pare de perder tempo com relatórios manuais
          </h2>
          <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto">
            Comece agora e gere seu primeiro relatório em segundos.
          </p>
          <Button asChild size="lg" className="h-14 px-10 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg shadow-lg shadow-accent/30">
            <Link to="/register">
              Começar agora grátis <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-primary-foreground/40 text-sm">Sem cartão de crédito • Cancele quando quiser</p>
        </div>
      </div>
    </div>
  </section>
);

export default CTASection;
