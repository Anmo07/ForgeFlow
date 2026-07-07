const AboutSectionTwo = () => {
  return (
    <section className="py-16 md:py-20 lg:py-28">
      <div className="container">
        <div className="-mx-4 flex flex-wrap items-center">
          <div className="w-full px-4 lg:w-1/2">
            <div
              className="wow fadeInUp relative mx-auto mb-12 aspect-[25/24] max-w-[500px] text-center lg:m-0"
              data-wow-delay=".15s"
            >
              <div className="flex items-center justify-center h-full rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-xl font-bold text-dark dark:text-white mb-2">Enterprise-Grade Security</h3>
                  <p className="text-body-color dark:text-body-color-dark text-sm">
                    Every layer of ForgeFlow is hardened — from Cloudflare edge protection to field-level encryption at rest.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full px-4 lg:w-1/2">
            <div className="wow fadeInUp max-w-[470px]" data-wow-delay=".2s">
              <div className="mb-9">
                <h3 className="mb-4 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
                  Zero-Trust Architecture
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  Every API request is authenticated via JWT cookies with CSRF
                  protection, rate limiting, and automatic session revocation.
                  Cloudflare Tunnel eliminates exposed ingress ports entirely.
                </p>
              </div>
              <div className="mb-9">
                <h3 className="mb-4 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
                  Tenant Data Isolation
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  SQLAlchemy event listeners automatically inject tenant
                  constraints at the ORM level — making cross-tenant data
                  leakage structurally impossible.
                </p>
              </div>
              <div className="mb-1">
                <h3 className="mb-4 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
                  Production-Ready Stack
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  Built on Next.js 15, FastAPI, PostgreSQL with PgBouncer,
                  Redis, and Celery — containerized with Docker Compose for
                  one-command deployment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSectionTwo;
