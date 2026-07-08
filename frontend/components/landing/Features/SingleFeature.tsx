import { Feature } from "@/types/feature";

const SingleFeature = ({ feature }: { feature: Feature }) => {
  const { icon, title, paragraph } = feature;
  return (
    <div className="group h-full">
      <div className="card-glow relative h-full overflow-hidden rounded-2xl border border-border/40 bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm p-8 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/[0.04]">
        {/* Gradient accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="mb-8 flex h-[60px] w-[60px] items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-[#0ea5e9]/10 dark:from-primary/15 dark:to-[#0ea5e9]/15 text-primary ring-1 ring-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10">
          {icon}
        </div>
        <h3 className="mb-4 text-xl font-bold text-foreground sm:text-2xl lg:text-xl xl:text-2xl">
          {title}
        </h3>
        <p className="text-base leading-relaxed text-muted-foreground">
          {paragraph}
        </p>
      </div>
    </div>
  );
};

export default SingleFeature;
