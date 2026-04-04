interface Props {
  billingCycle: "monthly" | "yearly";
  onToggle: (cycle: "monthly" | "yearly") => void;
}

export default function BillingCycleToggle({ billingCycle, onToggle }: Props) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => onToggle("monthly")}
        className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === "monthly" ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground"}`}
      >
        Mensal
      </button>
      <button
        onClick={() => onToggle("yearly")}
        className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === "yearly" ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground"}`}
      >
        Anual <span className="text-xs font-bold ml-1 text-emerald-500">2 meses grátis</span>
      </button>
    </div>
  );
}
