import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import {
  Sparkles, Calendar, Clock, User, ArrowLeft,
  Share2, Bookmark, BookmarkCheck, Tag, Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getArticleBySlug, getPublishedArticles, type Article } from "../../api/tips";
import { getTipBySlug, getRelatedTips as getStaticRelated, CATEGORY_COLORS } from "../../data/beauty-tips";
import { useAuth } from "../../context/authUtils";
import { Button } from "../../components/ui/Button";

const BOOKMARKS_KEY = "glowup_tip_bookmarks_v2";

function loadBookmarks(): Set<string> {
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    return stored ? new Set<string>(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Separator() {
  return (
    <div className="flex items-center gap-3 my-10">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
      <Sparkles size={14} className="text-brand-300 dark:text-brand-700" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
    </div>
  );
}

interface ArticleDisplay {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string[];
  image: string;
  category: string;
  tags: string[];
  author: string;
  date: string;
  readTime: string;
}

function ArticleSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded skeleton-pulse mb-8" />
      <div className="flex gap-2 mb-5">
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full skeleton-pulse" />
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full skeleton-pulse" />
      </div>
      <div className="h-8 w-full bg-gray-200 dark:bg-gray-800 rounded skeleton-pulse mb-3" />
      <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded skeleton-pulse mb-4" />
      <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded skeleton-pulse mb-8" />
      <div className="aspect-[2/1] bg-gray-200 dark:bg-gray-800 rounded-2xl skeleton-pulse mb-8" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded skeleton-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function BeautyArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [bookmarks, setBookmarks] = useState<Set<string>>(loadBookmarks);
  const [copied, setCopied] = useState(false);
  const [article, setArticle] = useState<ArticleDisplay | null>(null);
  const [related, setRelated] = useState<ArticleDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const a = await getArticleBySlug(slug!);
        if (cancelled) return;
        setArticle({
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          content: a.content,
          image: a.image,
          category: a.category,
          tags: a.tags,
          author: a.author,
          date: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
          readTime: a.readTime,
        });

        const relatedRes = await getPublishedArticles({ category: a.category, limit: 4 });
        if (!cancelled) {
          setRelated(
            relatedRes.items
              .filter((r) => r.id !== a.id)
              .slice(0, 3)
              .map((r) => ({
                id: r.id,
                title: r.title,
                slug: r.slug,
                excerpt: r.excerpt,
                content: r.content,
                image: r.image,
                category: r.category,
                tags: r.tags,
                author: r.author,
                date: r.publishedAt ? new Date(r.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
                readTime: r.readTime,
              }))
          );
        }
      } catch {
        const fallback = getTipBySlug(slug!);
        if (fallback && !cancelled) {
          setArticle({
            id: String(fallback.id),
            title: fallback.title,
            slug: fallback.slug,
            excerpt: fallback.excerpt,
            content: fallback.content,
            image: fallback.image,
            category: fallback.category,
            tags: fallback.tags,
            author: fallback.author,
            date: fallback.date,
            readTime: fallback.readTime,
          });
          setRelated(
            getStaticRelated(fallback, 3).map((r) => ({
              id: String(r.id),
              title: r.title,
              slug: r.slug,
              excerpt: r.excerpt,
              content: r.content,
              image: r.image,
              category: r.category,
              tags: r.tags,
              author: r.author,
              date: r.date,
              readTime: r.readTime,
            }))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  const isBookmarked = article ? bookmarks.has(article.id) : false;

  const toggleBookmark = () => {
    if (!article) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(article.id)) {
        next.delete(article.id);
      } else {
        next.add(article.id);
      }
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (navigator.share) {
        navigator.share({ title: article?.title, url });
      }
    }
  };

  if (loading) {
    return (
      <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={pageTransition}
        className="min-h-screen bg-warm-50 dark:bg-surface-dark"
      >
        <main className="pt-8 pb-24">
          <div className="flex items-center justify-center py-32">
            <Loader2 size={24} className="animate-spin text-brand-500" />
          </div>
        </main>
      </motion.div>
    );
  }

  if (!article) {
    return (
      <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={pageTransition}
        className="min-h-screen bg-warm-50 dark:bg-surface-dark"
      >
        <main className="pt-16 pb-24">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/10 to-gold-500/10 flex items-center justify-center mx-auto mb-5">
              <Sparkles size={28} className="text-brand-400" />
            </div>
            <h1 className="text-h2 text-text-primary dark:text-text-dark-primary mb-2 font-display">
              Tip not found
            </h1>
            <p className="text-body-sm text-text-secondary dark:text-text-dark-secondary mb-8">
              This beauty tip may have been removed or the link is incorrect.
            </p>
            <Link to="/app/blog/beauty">
              <Button variant="primary" size="md">
                <ArrowLeft size={14} />
                Back to tips
              </Button>
            </Link>
          </div>
        </main>
      </motion.div>
    );
  }

  const colors = CATEGORY_COLORS[article.category] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-500" };

  return (
    <motion.div
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      transition={pageTransition}
      className="min-h-screen bg-warm-50 dark:bg-surface-dark"
    >
      <main className="pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/app/blog/beauty"
            className="inline-flex items-center gap-1.5 text-label text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary transition-colors mb-6 sm:mb-8"
          >
            <ArrowLeft size={14} />
            Back to all tips
          </Link>

          <FadeIn>
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.bg} ${colors.text}`}>
                {article.category}
              </span>
              {article.tags.slice(0, 2).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-caption text-text-muted dark:text-text-dark-muted bg-warm-50 dark:bg-surface-dark-tertiary px-2.5 py-1 rounded-full"
                >
                  <Tag size={9} />
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary dark:text-text-dark-primary tracking-tight mb-4 leading-tight font-display">
              {article.title}
            </h1>

            <p className="text-body-sm sm:text-body text-text-secondary dark:text-text-dark-secondary mb-6 leading-relaxed">
              {article.excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-text-muted dark:text-text-dark-muted mb-6">
              <span className="flex items-center gap-1.5">
                <User size={13} className="text-text-muted dark:text-text-dark-muted" />
                {article.author}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-text-muted dark:text-text-dark-muted" />
                {article.date}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-text-muted dark:text-text-dark-muted" />
                {article.readTime}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <Button
                onClick={toggleBookmark}
                variant={isBookmarked ? "primary" : "ghost"}
                size="sm"
              >
                {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {isBookmarked ? "Saved" : "Save"}
              </Button>
              <Button
                onClick={handleShare}
                variant="ghost"
                size="sm"
              >
                <Share2 size={14} />
                {copied ? "Copied!" : "Share"}
              </Button>
            </div>
          </FadeIn>

          <div className="relative rounded-2xl overflow-hidden mb-10 aspect-[2/1] bg-gray-100 dark:bg-gray-800 shadow-card">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>

          <Separator />

          <FadeIn delay={0.08}>
            <article className="space-y-6">
              {article.content.map((paragraph, i) => {
                if (paragraph.startsWith("**") && paragraph.includes("** —")) {
                  const parts = paragraph.match(/\*\*(.*?)\*\* — (.*)/);
                  if (parts) {
                    return (
                      <div key={i} className="mb-6">
                        <h3 className="text-h4 text-text-primary dark:text-text-dark-primary mb-2 font-display">
                          {parts[1]}
                        </h3>
                        <p className="text-body-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">
                          {parts[2]}
                        </p>
                      </div>
                    );
                  }
                }
                if (paragraph.startsWith("**Pro Tip:**")) {
                  const tipContent = paragraph.replace("**Pro Tip:** ", "");
                  return (
                    <div
                      key={i}
                      className="relative bg-gradient-to-r from-brand-500/5 to-transparent border-l-2 border-brand-400 pl-5 py-4 mb-6 rounded-r-xl"
                    >
                      <div className="absolute top-3 right-3 text-brand-300/30">
                        <Sparkles size={20} />
                      </div>
                      <p className="text-body-sm text-text-primary dark:text-text-dark-primary leading-relaxed">
                        <span className="font-semibold text-brand-500">Pro Tip: </span>
                        {tipContent}
                      </p>
                    </div>
                  );
                }
                return (
                  <p key={i} className="text-body-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </article>
          </FadeIn>

          <Separator />

          {related.length > 0 && (
            <FadeIn delay={0.1}>
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-h3 text-text-primary dark:text-text-dark-primary font-display">
                    Related Tips
                  </h2>
                  <Link
                    to="/app/blog/beauty"
                    className="text-label text-brand-500 hover:text-brand-600 transition-colors"
                  >
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {related.map((r, i) => {
                    const rc = CATEGORY_COLORS[r.category] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-500" };
                    return (
                      <FadeIn key={r.id} delay={i * 0.06}>
                        <Link
                          to={`/app/blog/beauty/${r.slug}`}
                          className="group block rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 p-5 hover:border-brand-100 dark:hover:border-brand-900/30 hover:shadow-card-hover transition-all duration-300"
                        >
                          <div className="flex items-center gap-2 text-caption text-text-muted dark:text-text-dark-muted mb-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${rc.bg} ${rc.text}`}>
                              {r.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={9} />
                              {r.readTime}
                            </span>
                          </div>
                          <h3 className="text-body-sm font-semibold text-text-primary dark:text-text-dark-primary mb-2 leading-snug line-clamp-2 group-hover:text-brand-500 transition-colors">
                            {r.title}
                          </h3>
                          <p className="text-caption text-text-secondary dark:text-text-dark-secondary leading-relaxed line-clamp-2">
                            {r.excerpt}
                          </p>
                        </Link>
                      </FadeIn>
                    );
                  })}
                </div>
              </div>
            </FadeIn>
          )}

          <div className="text-center">
            <Link to="/app/blog/beauty">
              <Button variant="primary" size="md">
                <Sparkles size={14} />
                Browse all beauty tips
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
