import NewsLatterBox from "./NewsLatterBox";

const Contact = () => {
  return (
    <section id="contact" className="landing-section overflow-hidden py-16 md:py-20 lg:py-28">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4 lg:w-7/12 xl:w-8/12">
            <div className="card-glow mb-12 overflow-hidden rounded-2xl border border-border/40 bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm px-8 py-11 sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]">
              <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl lg:text-2xl xl:text-3xl">
                Need ForgeFlow Support?
              </h2>
              <p className="mb-12 text-base text-muted-foreground">
                Our MSP success team will get back to you ASAP via email.
              </p>
              <form>
                <div className="-mx-4 flex flex-wrap">
                  <div className="w-full px-4 md:w-1/2">
                    <div className="mb-8">
                      <label
                        htmlFor="contact-name"
                        className="mb-3 block text-sm font-medium text-foreground"
                      >
                        Your Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        placeholder="Enter your name"
                        className="w-full rounded-xl border border-border/40 bg-white/50 dark:bg-white/[0.03] px-6 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>
                  <div className="w-full px-4 md:w-1/2">
                    <div className="mb-8">
                      <label
                        htmlFor="contact-email"
                        className="mb-3 block text-sm font-medium text-foreground"
                      >
                        Your Email
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        placeholder="Enter your email"
                        className="w-full rounded-xl border border-border/40 bg-white/50 dark:bg-white/[0.03] px-6 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>
                  <div className="w-full px-4">
                    <div className="mb-8">
                      <label
                        htmlFor="contact-message"
                        className="mb-3 block text-sm font-medium text-foreground"
                      >
                        Your Message
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={5}
                        placeholder="Enter your Message"
                        className="w-full resize-none rounded-xl border border-border/40 bg-white/50 dark:bg-white/[0.03] px-6 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                      ></textarea>
                    </div>
                  </div>
                  <div className="w-full px-4">
                    <button className="rounded-xl bg-primary px-9 py-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5">
                      Submit Ticket
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="w-full px-4 lg:w-5/12 xl:w-4/12">
            <NewsLatterBox />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
