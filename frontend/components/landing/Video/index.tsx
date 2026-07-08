"use client";

import SectionTitle from "../Common/SectionTitle";

const Video = () => {
  return (
    <section className="landing-section-alt relative z-10 py-16 md:py-20 lg:py-28">
      <div className="container">
        <SectionTitle
          title="See ForgeFlow in Action"
          paragraph="Watch how ForgeFlow streamlines your entire MSP operation — from lead capture to invoice collection, all in one unified platform."
          center
          mb="80px"
        />

        <div className="mx-auto max-w-[770px]">
          <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 via-[#0ea5e9]/5 to-[#a855f7]/5 dark:from-primary/10 dark:via-[#0ea5e9]/8 dark:to-[#a855f7]/8 backdrop-blur-sm shadow-xl shadow-primary/[0.04]">
            <div className="relative aspect-[77/40] flex items-center justify-center">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-[#a855f7]/10 animate-gradient-shift" />

              {/* Grid overlay */}
              <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
                style={{
                  backgroundImage: `radial-gradient(circle, rgba(74, 108, 247, 0.4) 1px, transparent 1px)`,
                  backgroundSize: "24px 24px",
                }}
              />

              <div className="relative text-center p-8 z-10">
                {/* Play button with pulse rings */}
                <div className="relative mx-auto mb-6 h-[80px] w-[80px]">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-play-pulse" />
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-play-pulse" style={{ animationDelay: "0.5s" }} />
                  <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white/90 dark:bg-white/10 backdrop-blur-md shadow-xl shadow-primary/20 cursor-pointer transition-transform duration-300 group-hover:scale-110">
                    <svg
                      width="20"
                      height="22"
                      viewBox="0 0 16 18"
                      className="fill-primary ml-1"
                    >
                      <path d="M15.5 8.13397C16.1667 8.51888 16.1667 9.48112 15.5 9.86602L2 17.6603C1.33333 18.0452 0.499999 17.564 0.499999 16.7942L0.5 1.20577C0.5 0.43597 1.33333 -0.0451549 2 0.339745L15.5 8.13397Z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-foreground">Product Demo</h3>
                <p className="text-sm text-muted-foreground mt-1">Coming Soon — Stay Tuned</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Video;
