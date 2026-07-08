import { Blog } from "@/types/blog";
import Link from "next/link";

const tagColors: Record<string, string> = {
  billing: "from-amber-500 to-orange-500",
  security: "from-emerald-500 to-teal-500",
  architecture: "from-primary to-[#0ea5e9]",
};

const SingleBlog = ({ blog }: { blog: Blog }) => {
  const { title, paragraph, author, tags, publishDate } = blog;
  const tagColor = tagColors[tags[0]] || "from-primary to-[#a855f7]";

  const authorInitials = author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <div className="card-glow group relative overflow-hidden rounded-2xl border border-border/40 bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/[0.04]">
        {/* Gradient thumbnail placeholder */}
        <Link
          href="#"
          className="relative block aspect-[37/22] w-full overflow-hidden"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${tagColor} opacity-80`} />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
              backgroundSize: "16px 16px",
            }}
          />
          <span className="absolute right-4 top-4 z-20 inline-flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold capitalize text-white border border-white/20">
            {tags[0]}
          </span>
        </Link>
        <div className="p-6 sm:p-8 md:px-6 md:py-8 lg:p-8 xl:px-5 xl:py-8 2xl:p-8">
          <h3>
            <Link
              href="#"
              className="mb-4 block text-xl font-bold text-foreground hover:text-primary transition-colors sm:text-2xl"
            >
              {title}
            </Link>
          </h3>
          <p className="mb-6 border-b border-border/30 pb-6 text-base text-muted-foreground">
            {paragraph}
          </p>
          <div className="flex items-center">
            <div className="mr-5 flex items-center border-r border-border/30 pr-5 xl:mr-3 xl:pr-3 2xl:mr-5 2xl:pr-5">
              {/* Author initials avatar */}
              <div className="mr-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#0ea5e9] text-white text-xs font-bold">
                  {authorInitials}
                </div>
              </div>
              <div>
                <h4 className="mb-0.5 text-sm font-medium text-foreground">
                  By {author.name}
                </h4>
                <p className="text-xs text-muted-foreground">{author.designation}</p>
              </div>
            </div>
            <div className="inline-block">
              <h4 className="mb-0.5 text-sm font-medium text-foreground">
                Date
              </h4>
              <p className="text-xs text-muted-foreground">{publishDate}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SingleBlog;
