const SectionTitle = ({
  title,
  paragraph,
  width = "570px",
  center,
  mb = "100px",
}: {
  title: string;
  paragraph: string;
  width?: string;
  center?: boolean;
  mb?: string;
}) => {
  return (
    <>
      <div
        className={`w-full ${center ? "mx-auto text-center" : ""}`}
        style={{ maxWidth: width, marginBottom: mb }}
      >
        {center && (
          <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-gradient-to-r from-primary via-[#0ea5e9] to-[#a855f7]" />
        )}
        <h2 className="mb-4 text-3xl font-extrabold !leading-tight tracking-tight text-foreground sm:text-4xl md:text-[45px]">
          {title}
        </h2>
        <p className="text-base !leading-relaxed text-muted-foreground md:text-lg">
          {paragraph}
        </p>
      </div>
    </>
  );
};

export default SectionTitle;
