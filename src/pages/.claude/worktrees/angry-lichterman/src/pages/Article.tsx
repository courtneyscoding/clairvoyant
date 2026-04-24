import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CosmicBackground from "@/components/CosmicBackground";
import SiteHeader from "@/components/SiteHeader";
import { getArticleBySlug } from "@/lib/articles";

const Article = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : null;

  if (!article) {
    return <Navigate to="/articles" replace />;
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-6 py-8">
      <CosmicBackground />
      <SiteHeader />

      <main className="relative z-[1] mx-auto flex w-full max-w-4xl flex-col gap-8 pt-28 pb-12">
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 self-start rounded-full border border-purple-dim bg-black/30 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to Articles
        </Link>

        <article className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,11,25,0.96),rgba(9,7,16,0.99))] px-8 py-10 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:px-10 sm:py-12">
          <header className="border-b border-white/8 pb-8">
            <p className="text-xs uppercase tracking-[0.34em] text-purple-light">{article.eyebrow}</p>
            <h1 className="mt-4 font-display text-4xl font-light leading-tight text-foreground sm:text-6xl">
              {article.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-foreground/65">
              <span>{article.category}</span>
              <span className="h-1 w-1 rounded-full bg-foreground/35" />
              <span>{article.readTime}</span>
            </div>
            <p className="mt-6 max-w-3xl font-body text-base leading-8 text-foreground/82">
              {article.excerpt}
            </p>
          </header>

          <div className="mt-8 space-y-10">
            {article.sections.map((section) => (
              <section key={section.heading} className="space-y-4">
                <h2 className="font-display text-[2rem] leading-tight text-foreground sm:text-[2.35rem]">
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="font-body text-base leading-8 text-foreground/88">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </main>
    </div>
  );
};

export default Article;
