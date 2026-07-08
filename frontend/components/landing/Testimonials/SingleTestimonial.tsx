import { Testimonial } from "@/types/testimonial";

const starIcon = (
  <svg width="18" height="16" viewBox="0 0 18 16" className="fill-current">
    <path d="M9.09815 0.361679L11.1054 6.06601H17.601L12.3459 9.59149L14.3532 15.2958L9.09815 11.7703L3.84309 15.2958L5.85035 9.59149L0.595291 6.06601H7.0909L9.09815 0.361679Z" />
  </svg>
);

const avatarColors = [
  "from-primary to-[#0ea5e9]",
  "from-[#0ea5e9] to-[#a855f7]",
  "from-[#a855f7] to-primary",
];

const SingleTestimonial = ({ testimonial }: { testimonial: Testimonial }) => {
  const { star, name, content, designation, id } = testimonial;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colorIndex = ((id || 0) - 1) % avatarColors.length;

  let ratingIcons = [];
  for (let index = 0; index < star; index++) {
    ratingIcons.push(
      <span key={index} className="text-amber-400">
        {starIcon}
      </span>,
    );
  }

  return (
    <div className="h-full">
      <div className="card-glow relative h-full overflow-hidden rounded-2xl border border-border/40 bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm p-8 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/[0.04]">
        {/* Large decorative quote */}
        <div className="absolute top-4 right-6 text-6xl font-serif text-primary/[0.06] dark:text-primary/[0.08] leading-none select-none">
          &ldquo;
        </div>

        <div className="mb-5 flex items-center space-x-1">{ratingIcons}</div>
        <p className="mb-8 text-base leading-relaxed text-muted-foreground">
          &ldquo;{content}&rdquo;
        </p>
        <div className="flex items-center gap-4 border-t border-border/30 pt-6">
          {/* Initials avatar with gradient */}
          <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${avatarColors[colorIndex]} text-white text-sm font-bold shadow-lg`}>
            {initials}
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground">{designation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleTestimonial;
