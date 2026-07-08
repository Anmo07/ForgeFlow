"use client";

const NewsLatterBox = () => {
  return (
    <div className="card-glow relative z-10 overflow-hidden rounded-2xl border border-border/40 bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm p-8 sm:p-11 lg:p-8 xl:p-11">
      <h3 className="mb-4 text-2xl font-bold leading-tight text-foreground">
        Subscribe to receive future updates
      </h3>
      <p className="mb-11 border-b border-border/30 pb-11 text-base leading-relaxed text-muted-foreground">
        Get the latest product updates, MSP growth strategies, and security
        best practices delivered directly to your inbox.
      </p>
      <div>
        <input
          type="text"
          name="name"
          placeholder="Enter your name"
          className="mb-4 w-full rounded-xl border border-border/40 bg-white/50 dark:bg-white/[0.03] px-6 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
        />
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          className="mb-4 w-full rounded-xl border border-border/40 bg-white/50 dark:bg-white/[0.03] px-6 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
        />
        <input
          type="submit"
          value="Subscribe"
          className="mb-5 flex w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-9 py-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
        />
        <p className="text-center text-xs text-muted-foreground">
          No spam, ever. Unsubscribe at any time.
        </p>
      </div>
    </div>
  );
};

export default NewsLatterBox;
