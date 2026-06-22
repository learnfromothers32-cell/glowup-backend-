import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import {
  Sparkles, Calendar, Clock, User, ArrowLeft,
  Share2, Bookmark, BookmarkCheck, Tag, Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";
import { getArticleBySlug, getPublishedArticles, type Article } from "../../api/tips";
import { getTipBySlug, getRelatedTips as getStaticRelated, CATEGORY_COLORS } from "../../data/beauty-tips";
import { useAuth } from "../../context/authUtils";

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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
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
      alert("Copy the URL manually.");
    }
  };

  if (loading) {
    return (
      <motion.div
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          transition={pageTransition}
          className="min-h-screen bg-neutral-950"
        >
        <LandingNavbar />
        <main className="pt-28 pb-24">
          <div className="flex items-center justify-center py-32">
            <Loader2 size={24} className="animate-spin text-neutral-500" />
          </div>
        </main>
        <AppFooter variant="landing" />
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
          className="min-h-screen bg-neutral-950"
        >
        <LandingNavbar />
        <main className="pt-28 pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium tracking-wide mb-6">
              <Sparkles size={12} />
              Article not found
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Tip not found</h1>
            <p className="text-neutral-400 mb-8">This beauty tip may have been removed or the link is incorrect.</p>
            <Link
              to="/blog/beauty"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to tips
            </Link>
          </div>
        </main>
        <AppFooter variant="landing" />
      </motion.div>
    );
  }

  const colors = CATEGORY_COLORS[article.category] || { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" };

  return (
    <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={pageTransition}
        className="min-h-screen bg-neutral-950"
      >
      <LandingNavbar />

      <main className="pt-24 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors mb-8"
          >
            <ArrowLeft size={13} />
            Back to blog
          </Link>

          <FadeIn>
            <div className="flex items-center gap-3 mb-5">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                {article.category}
              </span>
              {article.tags.slice(0, 2).map(tag => (
                <span key={tag} className="flex items-center gap-1 text-[11px] text-neutral-500">
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4 leading-tight">
              {article.title}
            </h1>

            <p className="text-base sm:text-lg text-neutral-400 mb-6 leading-relaxed">
              {article.excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 mb-8">
              <span className="flex items-center gap-1.5">
                <User size={13} className="text-neutral-600" />
                {article.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-neutral-600" />
                {article.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-neutral-600" />
                {article.readTime}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-10">
              <button
                onClick={toggleBookmark}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isBookmarked
                    ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                    : "bg-white/[0.04] text-neutral-400 border border-white/[0.06] hover:text-neutral-300 hover:bg-white/[0.06]"
                }`}
              >
                {isBookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                {isBookmarked ? "Saved" : "Save"}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/[0.04] text-neutral-400 border border-white/[0.06] text-xs font-medium hover:text-neutral-300 hover:bg-white/[0.06] transition-all"
              >
                <Share2 size={13} />
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </FadeIn>

          <div className="relative rounded-2xl overflow-hidden mb-10 aspect-[2/1] bg-neutral-800">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent" />
          </div>

          <FadeIn delay={0.1}>
            <article className="prose prose-invert prose-sm max-w-none">
              {article.content.map((paragraph, i) => {
                if (paragraph.startsWith("**") && paragraph.includes("** —")) {
                  const parts = paragraph.match(/\*\*(.*?)\*\* — (.*)/);
                  if (parts) {
                    return (
                      <div key={i} className="mb-6">
                        <h3 className="text-base font-semibold text-white mb-2">{parts[1]}</h3>
                        <p className="text-sm text-neutral-400 leading-relaxed">{parts[2]}</p>
                      </div>
                    );
                  }
                }
                if (paragraph.startsWith("**Pro Tip:**")) {
                  return (
                    <div key={i} className="bg-gradient-to-r from-amber-500/5 to-transparent border-l-2 border-amber-500/40 pl-4 py-3 mb-6 rounded-r-lg">
                      <p className="text-sm text-amber-300/90 leading-relaxed">
                        <span className="font-semibold text-amber-400">Pro Tip: </span>
                        {paragraph.replace("**Pro Tip:** ", "")}
                      </p>
                    </div>
                  );
                }
                return (
                  <p key={i} className="text-sm text-neutral-400 leading-relaxed mb-5">
                    {paragraph}
                  </p>
                );
              })}
            </article>
          </FadeIn>

          {related.length > 0 && (
            <div className="border-t border-white/[0.06] pt-8 mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-white">Related Tips</h2>
                <Link
                  to="/blog/beauty"
                  className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                >
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((r, i) => {
                  const rc = CATEGORY_COLORS[r.category] || { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" };
                  return (
                    <FadeIn key={r.id} delay={i * 0.08}>
                      <Link
                        to={`/blog/beauty/${r.slug}`}
                        className="group block p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
                      >
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500 mb-3">
                          <span className={`px-2 py-0.5 rounded ${rc.bg} ${rc.text}`}>{r.category}</span>
                          <span className="flex items-center gap-1"><Clock size={10} />{r.readTime}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-2 leading-snug group-hover:text-amber-400 transition-colors line-clamp-2">
                          {r.title}
                        </h3>
                        <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">{r.excerpt}</p>
                      </Link>
                    </FadeIn>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/blog/beauty"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:from-amber-500/20 hover:to-orange-500/20 transition-all"
            >
              <Sparkles size={14} />
              Browse all beauty tips
            </Link>
          </div>
        </div>
      </main>

      <AppFooter variant="landing" />
    </motion.div>
  );
}
