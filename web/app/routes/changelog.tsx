import { Suspense, use, lazy } from "react";
import { useLoaderData, Link } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface ChangelogEntry {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags?: string[];
  version?: string;
}

export async function loader() {
  // Import all MDX files from changelog/content
  const modules = import.meta.glob("../changelog/content/*.mdx", {
    eager: true,
  }) as Record<string, any>;

  const changelogsPromise = Promise.resolve(
    Object.entries(modules)
      .map(([path, mod]) => {
        const slug = path.split("/").pop()?.replace(".mdx", "") || "";
        return {
          slug,
          title: mod.frontmatter?.title || "Untitled",
          description: mod.frontmatter?.description || "",
          date: mod.frontmatter?.date || "",
          tags: mod.frontmatter?.tags || [],
          version: mod.frontmatter?.version,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );

  return { changelogsPromise };
}

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="p-6 flex items-center justify-between">
            <h1 className="text-3xl font-semibold tracking-tight">Changelog</h1>
            <nav className="flex items-center gap-4">
              <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth/signup">Sign Up</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <Suspense fallback={<ChangelogSkeleton />}>
        <ChangelogContent />
      </Suspense>
    </main>
  );
}

function ChangelogContent() {
  const { changelogsPromise } = useLoaderData<typeof loader>();
  const changelogs = use(changelogsPromise);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <section className="max-w-5xl mx-auto px-6 lg:px-10 pt-10">
      <div className="relative">
        {changelogs.map((changelog: ChangelogEntry) => {
          const Content = lazy(
            () => import(`../changelog/content/${changelog.slug}.mdx`)
          );

          return (
            <article key={changelog.slug} className="relative">
              <div className="flex flex-col md:flex-row gap-y-6">
                {/* Left side - Date & Version */}
                <aside className="md:w-48 shrink-0">
                  <div className="md:sticky md:top-8 pb-10">
                    <time className="text-sm font-medium text-muted-foreground block mb-3">
                      {formatDate(changelog.date)}
                    </time>

                    {changelog.version && (
                      <div className="inline-flex relative z-10 items-center justify-center w-fit px-2 h-10 text-foreground border border-border rounded-lg text-sm font-bold">
                        {changelog.version}
                      </div>
                    )}
                  </div>
                </aside>

                {/* Right side - Content */}
                <div className="flex-1 md:pl-8 relative pb-10">
                  {/* Vertical timeline line */}
                  <div className="hidden md:block absolute top-2 left-0 w-px h-full bg-border">
                    {/* Timeline dot */}
                    <div className="hidden md:block absolute -translate-x-1/2 size-3 bg-primary rounded-full z-10" />
                  </div>

                  <div className="space-y-6">
                    <header className="relative z-10 flex flex-col gap-2">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        {changelog.title}
                      </h2>

                      {/* Tags */}
                      {changelog.tags && changelog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {changelog.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="h-6 w-fit px-2 text-xs font-medium bg-muted text-muted-foreground rounded-full border flex items-center justify-center"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </header>
                    <section className="prose dark:prose-invert max-w-none prose-headings:scroll-mt-8 prose-headings:font-semibold prose-a:no-underline prose-headings:tracking-tight prose-p:tracking-tight">
                      <Suspense
                        fallback={
                          <div className="text-sm text-muted-foreground">
                            Loading...
                          </div>
                        }
                      >
                        <Content />
                      </Suspense>
                    </section>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ChangelogSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 pt-10">
      <div className="relative">
        {[1, 2].map((i) => (
          <div key={i} className="relative">
            <div className="flex flex-col md:flex-row gap-y-6">
              <div className="md:w-48 shrink-0">
                <div className="md:sticky md:top-8 pb-10">
                  <Skeleton className="h-4 w-32 mb-3" />
                  <Skeleton className="w-10 h-10 rounded-lg" />
                </div>
              </div>
              <div className="flex-1 md:pl-8 relative pb-10">
                <div className="hidden md:block absolute top-2 left-0 w-px h-full bg-border">
                  <div className="hidden md:block absolute -translate-x-1/2 size-3 bg-muted rounded-full z-10" />
                </div>
                <div className="space-y-6">
                  <div className="relative z-10 flex flex-col gap-2">
                    <Skeleton className="h-8 w-64" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
