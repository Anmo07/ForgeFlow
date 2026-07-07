"use client";

import SectionTitle from "../Common/SectionTitle";

const Video = () => {
  return (
    <section className="relative z-10 py-16 md:py-20 lg:py-28">
      <div className="container">
        <SectionTitle
          title="See ForgeFlow in Action"
          paragraph="Watch how ForgeFlow streamlines your entire MSP operation — from lead capture to invoice collection, all in one unified platform."
          center
          mb="80px"
        />

        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div
              className="wow fadeInUp mx-auto max-w-[770px] overflow-hidden rounded-md"
              data-wow-delay=".15s"
            >
              <div className="relative aspect-[77/40] items-center justify-center bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10 dark:border-primary/20">
                <div className="absolute right-0 top-0 flex h-full w-full items-center justify-center">
                  <div className="text-center p-8">
                    <div className="flex items-center justify-center h-[70px] w-[70px] mx-auto rounded-full bg-white bg-opacity-75 text-primary mb-4">
                      <svg
                        width="16"
                        height="18"
                        viewBox="0 0 16 18"
                        className="fill-current"
                      >
                        <path d="M15.5 8.13397C16.1667 8.51888 16.1667 9.48112 15.5 9.86602L2 17.6603C1.33333 18.0452 0.499999 17.564 0.499999 16.7942L0.5 1.20577C0.5 0.43597 1.33333 -0.0451549 2 0.339745L15.5 8.13397Z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-dark dark:text-white">Product Demo</h3>
                    <p className="text-sm text-body-color dark:text-body-color-dark mt-1">Coming Soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Video;
