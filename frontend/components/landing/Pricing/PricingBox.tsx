const PricingBox = (props: {
  price: string;
  duration: string;
  packageName: string;
  subtitle: string;
  popular?: boolean;
  children: React.ReactNode;
}) => {
  const { price, duration, packageName, subtitle, popular, children } = props;

  return (
    <div className="w-full">
      <div
        className={`card-glow relative z-10 overflow-hidden rounded-2xl border backdrop-blur-sm p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/[0.04] ${
          popular
            ? "border-primary/40 bg-gradient-to-b from-primary/[0.04] to-transparent dark:from-primary/[0.08] shadow-lg shadow-primary/[0.06]"
            : "border-border/40 bg-white/40 dark:bg-white/[0.02]"
        }`}
      >
        {/* Gradient top accent */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
          popular
            ? "from-primary via-[#0ea5e9] to-[#a855f7] opacity-100"
            : "from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100"
        }`} />

        {/* Popular badge */}
        {popular && (
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary animate-pulse-glow">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Most Popular
          </div>
        )}

        <div className={popular ? "" : "mt-2"}>
          <h4 className="mb-1 text-lg font-bold text-foreground">
            {packageName}
          </h4>
          <p className="mb-5 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-4xl font-extrabold text-foreground">
            ${price}
            <span className="text-lg font-medium text-muted-foreground">/{duration}</span>
          </h3>
        </div>

        <div className="mb-8 border-b border-border/30 pb-8">
          <button className={`flex w-full items-center justify-center rounded-xl p-3.5 text-sm font-semibold transition-all duration-300 ${
            popular
              ? "bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              : "bg-foreground/5 dark:bg-white/5 text-foreground hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/25"
          }`}>
            Start Free Trial
          </button>
        </div>
        <div className="space-y-0">{children}</div>
      </div>
    </div>
  );
};

export default PricingBox;
