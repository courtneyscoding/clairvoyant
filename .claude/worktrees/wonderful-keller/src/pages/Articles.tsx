import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import CosmicBackground from "@/components/CosmicBackground";
import SiteHeader from "@/components/SiteHeader";
import { articles } from "@/lib/articles";

const Articles = () => {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-6 py-8">
      <CosmicBackground />
      <SiteHeader />

      <main className="relative z-[1] mx-auto flex w-full max-w-4xl flex-col gap-8 pt-28 pb-12">
        <section className="rounded-[32px] border border-purple-dim bg-[linear-gradient(180deg,rgba(18,14,30,0.9),rgba(11,8,18,0.88))] px-8 py-10 shadow-[0_25px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.34em] text-purple-light">Courtney&apos;s Journal</p>
          <h1 className="mt-4 font-display text-5xl font-light text-foreground sm:text-6xl">
            Articles
          </h1>
          <p className="mt-4 max-w-2xl font-body text-base leading-8 text-foreground/78">
            A simple library of spiritual pieces people can actually read. Pick a title and it opens like a real article.
          </p>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,10,24,0.96),rgba(9,7,16,0.98))] px-6 py-4 shadow-[0_25px_80px_rgba(0,0,0,0.38)] backdrop-blur-sm sm:px-8 sm:py-6">
          <div className="divide-y divide-white/8">
            {articles.map((article) => (
              <Link
                key={article.slug}
                to={`/articles/${article.slug}`}
                className="group block py-6 transition-colors hover:text-foreground"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-purple-light">
                      {article.category}
                    </p>
                    <h2 className="mt-3 font-display text-3xl leading-tight text-foreground transition-colors group-hover:text-[#f2e7ff] sm:text-[2.35rem]">
                      {article.title}
                    </h2>
                    <p className="mt-3 font-body text-sm leading-7 text-muted-foreground sm:text-base">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 text-sm text-foreground/70 sm:pt-1">
                    <span>{article.readTime}</span>
                    <ChevronRight
                      size={18}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Articles;
