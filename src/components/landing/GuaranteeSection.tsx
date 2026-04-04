import { ShieldCheck, CreditCard, X, RotateCcw } from "lucide-react";

const guarantees = [
  { icon: CreditCard, text: "Sem cartão de crédito para começar" },
  { icon: X,          text: "Cancele quando quiser, sem burocracia" },
  { icon: RotateCcw,  text: "7 dias de garantia nos planos pagos" },
  { icon: ShieldCheck,text: "Seus dados excluídos se você sair" },
];

const GuaranteeSection = () => (
  <section className="py-16 bg-card">
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8
          bg-green-50 dark:bg-green-950/20
          border-2 border-green-200 dark:border-green-900
          rounded-2xl p-8">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/40
            border-4 border-green-200 dark:border-green-800
            flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-10 w-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold
              text-green-900 dark:text-green-100 mb-2">
              Risco zero para você
            </h2>
            <p className="text-green-800 dark:text-green-300 mb-5 leading-relaxed">
              Comece grátis hoje. Se assinar e não gostar, devolvemos 100%
              em até 7 dias — sem perguntas, sem burocracia.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {guarantees.map((g, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/60
                    flex items-center justify-center flex-shrink-0">
                    <g.icon className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium
                    text-green-900 dark:text-green-200">
                    {g.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default GuaranteeSection;
