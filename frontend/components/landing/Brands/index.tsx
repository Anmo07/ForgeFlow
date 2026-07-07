const Brands = () => {
  const techStack = [
    { name: "Next.js 15", icon: "⚡" },
    { name: "FastAPI", icon: "🐍" },
    { name: "PostgreSQL", icon: "🗄️" },
    { name: "Redis", icon: "⚡" },
    { name: "Cloudflare", icon: "🛡️" },
    { name: "Docker", icon: "🐳" },
  ];

  return (
    <section className="pt-16">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div
              className="wow fadeInUp bg-gray-light dark:bg-gray-dark flex flex-wrap items-center justify-center rounded-sm px-8 py-8 sm:px-10 md:px-[50px] md:py-[40px] xl:p-[50px] 2xl:px-[70px] 2xl:py-[60px]"
              data-wow-delay=".1s"
            >
              {techStack.map((tech, index) => (
                <div
                  key={index}
                  className="mx-3 flex w-full max-w-[160px] flex-col items-center justify-center py-[15px] sm:mx-4 lg:max-w-[130px] xl:mx-6 xl:max-w-[150px] 2xl:mx-8 2xl:max-w-[160px]"
                >
                  <span className="text-2xl mb-1">{tech.icon}</span>
                  <span className="text-sm font-semibold text-body-color dark:text-body-color-dark opacity-70 hover:opacity-100 transition">
                    {tech.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Brands;
