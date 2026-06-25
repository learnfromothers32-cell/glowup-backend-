import { Stylist } from "../models/Stylist";
import { TrendingEngagement } from "../models/TrendingEngagement";
import { redisClient } from "../config/redis";
import logger from "../utils/logger";

const TRENDING_KEY = "trending:transformations";
const CACHE_KEY = "trending:cache";
const CACHE_TTL = 60;
const getPostHashKey = (postId: string) => `trending:post:${postId}`;

export type TrendingTransformation = {
  id: string;
  stylistId: string;
  stylistName: string;
  stylistImage?: string;
  category?: string;
  location?: string;
  rating: number;
  before?: string;
  after: string;
  caption?: string;
  serviceName?: string;
  mediaType?: 'image' | 'video';
  likes: number;
  views: number;
  shares: number;
  commentCount: number;
  bookmarks: number;
  createdAt: Date;
  score: number;
};

export type TrendingCursor = {
  score: number;
  id: string;
};

const getRedisClient = () => redisClient;

const HOUR_MS = 1000 * 60 * 60;
const DAY_MS = HOUR_MS * 24;
const FRESHNESS_WINDOW_HOURS = 72;

// In-memory cache as second-level fallback when Redis is unavailable
const memoryCache: { data: TrendingTransformation[] | null; expiry: number } = {
  data: null,
  expiry: 0,
};
const MEMORY_CACHE_TTL = 30_000;

export const clearMemoryCache = () => {
  memoryCache.data = null;
  memoryCache.expiry = 0;
};

const buildFallbackScore = (stylist: any, item: any) => {
  const base = 30;
  const ageDays = Math.max(
    0,
    (Date.now() - new Date(item.createdAt || stylist.createdAt).getTime()) / DAY_MS,
  );

  return (
    base +
    Math.min(stylist.rating || 0, 5) * 12 +
    Math.min(stylist.reviewCount || 0, 200) * 0.5 +
    Math.min(stylist.viewerCount || 0, 500) * 0.08 +
    (item.service ? 10 : 0) +
    Math.max(0, 14 - ageDays) * 2
  );
};

const getTrendingScore = (rawScore: number, createdAt: Date) => {
  const ageHours = Math.max(0, (Date.now() - createdAt.getTime()) / HOUR_MS);
  const freshness = Math.max(0.3, 1 - ageHours / FRESHNESS_WINDOW_HOURS);
  return rawScore * (0.7 + freshness * 0.3);
};

const getFallbackCounts = (item: any) => {
  const base = buildFallbackScore({ rating: 0, reviewCount: 0, viewerCount: 0, createdAt: item.createdAt }, item);
  return {
    likes: Math.max(0, Math.round(base * 0.3)),
    views: Math.max(0, Math.round(base * 1.5)),
    commentCount: 0,
    shares: 0,
    bookmarks: 0,
  };
};

const fetchEngagementFromMongo = async (postIds: string[]) => {
  if (postIds.length === 0) return new Map<string, Record<string, any>>();

  const engagements = await TrendingEngagement.find({
    transformationId: { $in: postIds },
  }).lean();

  const map = new Map<string, Record<string, any>>();
  for (const eng of engagements) {
    map.set(eng.transformationId, eng as any);
  }
  return map;
};

export const getTrendingTransformations = async (
  limit = 20,
  cursor?: TrendingCursor,
): Promise<{ items: TrendingTransformation[]; nextCursor?: TrendingCursor }> => {
  const client = getRedisClient();
  let redisScores = new Map<string, number>();
  let usedCache = false;

  if (client) {
    try {
      const cached = await client.get(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as TrendingTransformation[];
        if (parsed.length >= limit) {
          usedCache = true;
          return applyCursor(parsed, limit, cursor);
        }
      }
    } catch (err) {
      logger.warn("Redis cache read failed", { error: (err as Error).message });
    }
  } else {
    // Redis unavailable â€” try in-memory cache
    if (memoryCache.data && Date.now() < memoryCache.expiry) {
      if (memoryCache.data.length >= limit) {
        return applyCursor(memoryCache.data, limit, cursor);
      }
    }
  }

  if (client) {
    try {
      const values: string[] = await client.zRange(TRENDING_KEY, 0, -1, {
        REV: true,
        BY: "BYSCORE",
        WITHSCORES: true,
      } as any);
      for (let i = 0; i < values.length; i += 2) {
        redisScores.set(values[i], Number(values[i + 1] || "0"));
      }
    } catch (err) {
      logger.warn("Redis sorted set read failed, falling back to MongoDB", { error: (err as Error).message });
    }
  }

  const stylists = await Stylist.find({
    "beforeAfter.0": { $exists: true },
  })
    .sort({ rating: -1, reviewCount: -1, isLive: -1, createdAt: -1 })
    .lean();

  const transformations: TrendingTransformation[] = [];

  for (const stylist of stylists) {
    const items = stylist.beforeAfter || [];
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const transformationId = item._id
        ? `${stylist._id}_${item._id}`
        : `${stylist._id}_${index}`;
      const redisScore = redisScores.get(transformationId);
      const score = redisScore ?? buildFallbackScore(stylist, item);
      const createdAt = item.createdAt
        ? new Date(item.createdAt)
        : stylist.createdAt;
      const finalScore = getTrendingScore(score, createdAt);

      transformations.push({
        id: transformationId,
        stylistId: stylist._id.toString(),
        stylistName: stylist.name,
        stylistImage: stylist.image || "",
        category: stylist.category || "",
        location: stylist.location?.area || "",
        rating: stylist.rating || 0,
        before: item.before,
        after: item.after,
        caption: item.caption || `${stylist.name}'s transformation`,
        serviceName: item.service,
        mediaType: item.mediaType || 'image',
        likes: 0,
        views: 0,
        commentCount: 0,
        shares: 0,
        bookmarks: 0,
        createdAt,
        score: finalScore,
      });
    }
  }

  transformations.sort((a, b) => b.score - a.score);

  const postIds = transformations.map((t) => t.id);
  const mongoEngagements = await fetchEngagementFromMongo(postIds);

  for (const t of transformations) {
    let counts: { likes: number; views: number; commentCount: number; shares: number; bookmarks: number } | null = null;

    if (client) {
      try {
        const hash = await client.hGetAll(getPostHashKey(t.id));
        if (hash && Object.keys(hash).length > 0) {
          counts = {
            likes: Number(hash.likes || 0),
            views: Number(hash.views || 0),
            commentCount: Number(hash.commentCount || 0),
            shares: Number(hash.shares || 0),
            bookmarks: Number(hash.bookmarks || 0),
          };
        }
      } catch (err) {
        logger.warn("Redis hash read failed for post", { postId: t.id, error: (err as Error).message });
      }
    }

    if (!counts) {
      const mongoEng = mongoEngagements.get(t.id);
      if (mongoEng) {
        counts = {
          likes: mongoEng.likes || 0,
          views: mongoEng.views || 0,
          commentCount: mongoEng.commentCount || 0,
          shares: mongoEng.shares || 0,
          bookmarks: mongoEng.bookmarks || 0,
        };
      } else {
        counts = getFallbackCounts({ createdAt: t.createdAt });
      }
    }

    t.likes = counts.likes;
    t.views = counts.views;
    t.commentCount = counts.commentCount;
    t.shares = counts.shares;
    t.bookmarks = counts.bookmarks;
  }

  for (const t of transformations) {
    const views = t.views || 1;
    const engagementRate = (t.likes + t.commentCount) / views;
    t.score = t.score * (1 + engagementRate * 10);
  }

  transformations.sort((a, b) => b.score - a.score);

  if (client && !usedCache) {
    try {
      await client.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(transformations));
    } catch (err) {
      logger.warn("Failed to cache trending results in Redis", { error: (err as Error).message });
    }
  } else if (!client) {
    memoryCache.data = transformations;
    memoryCache.expiry = Date.now() + MEMORY_CACHE_TTL;
  }

  return applyCursor(transformations, limit, cursor);
};

function applyCursor(
  all: TrendingTransformation[],
  limit: number,
  cursor?: TrendingCursor,
): { items: TrendingTransformation[]; nextCursor?: TrendingCursor } {
  let startIndex = 0;

  if (cursor) {
    const cursorIndex = all.findIndex((t) => t.id === cursor.id);
    startIndex = cursorIndex !== -1 ? cursorIndex + 1 : all.length;
  }

  const items = all.slice(startIndex, startIndex + limit);
  const nextCursor =
    items.length === limit
      ? { score: items[items.length - 1].score, id: items[items.length - 1].id }
      : undefined;

  return { items, nextCursor };
}

export const trackTrendingActivity = async (
  postId: string,
  event: "view" | "like" | "unlike" | "share" | "comment" | "bookmark",
  userId?: string,
) => {
  const client = getRedisClient();
  if (!client) {
    const update: Record<string, number> = {};
    if (event === "view") update.views = 1;
    if (event === "like") update.likes = 1;
    if (event === "unlike") update.likes = -1;
    if (event === "comment") update.commentCount = 1;
    if (event === "share") update.shares = 1;
    if (event === "bookmark") update.bookmarks = 1;
    await TrendingEngagement.findOneAndUpdate(
      { transformationId: postId },
      { $inc: update },
      { upsert: true },
    );
    return;
  }

  const weights: Record<string, number> = {
    view: 1,
    like: 10,
    unlike: -10,
    share: 6,
    comment: 12,
    bookmark: 5,
  };

  const scoreDelta = weights[event] || 1;
  const hashKey = getPostHashKey(postId);
  const updates: Record<string, number> = {
    likes: 0,
    views: 0,
    commentCount: 0,
    shares: 0,
    bookmarks: 0,
  };

  if (event === "view") updates.views = 1;
  if (event === "like") updates.likes = 1;
  if (event === "unlike") updates.likes = -1;
  if (event === "comment") updates.commentCount = 1;
  if (event === "share") updates.shares = 1;
  if (event === "bookmark") updates.bookmarks = 1;

  try {
    await client.zIncrBy(TRENDING_KEY, scoreDelta, postId);
    await Promise.all(
      Object.entries(updates)
        .filter(([, increment]) => increment !== 0)
        .map(([field, increment]) =>
          client.hIncrBy(hashKey, field, increment),
        ),
    );

    try {
      await client.del(CACHE_KEY);
    } catch {
      // cache invalidation is best-effort
    }
  } catch (error) {
    logger.error("Failed to track trending event in Redis, falling back to MongoDB", { error: (error as Error).message });
    const update: Record<string, number> = {};
    if (event === "view") update.views = 1;
    if (event === "like") update.likes = 1;
    if (event === "unlike") update.likes = -1;
    if (event === "comment") update.commentCount = 1;
    if (event === "share") update.shares = 1;
    if (event === "bookmark") update.bookmarks = 1;
    await TrendingEngagement.findOneAndUpdate(
      { transformationId: postId },
      { $inc: update },
      { upsert: true },
    );
  }
};

export const syncRedisEngagementToMongo = async () => {
  const client = getRedisClient();
  if (!client) return;

  try {
    const keys = await client.keys("trending:post:*");
    for (const key of keys) {
      const hash = await client.hGetAll(key);
      if (!hash || Object.keys(hash).length === 0) continue;

      const transformationId = key.replace("trending:post:", "");
      const likes = Number(hash.likes || 0);
      const views = Number(hash.views || 0);
      const shares = Number(hash.shares || 0);
      const commentCount = Number(hash.commentCount || 0);
      const bookmarks = Number(hash.bookmarks || 0);

      const score = await client.zScore(TRENDING_KEY, transformationId);

      const underscoreIndex = transformationId.indexOf("_");
      const stylistId = transformationId.slice(0, underscoreIndex);
      const afterFirst = transformationId.slice(underscoreIndex + 1);
      const isObjectId = /^[a-fA-F0-9]{24}$/.test(afterFirst);

      let beforeAfterIndex = 0;
      if (isObjectId) {
        const stylist = await Stylist.findById(stylistId).lean();
        if (stylist) {
          const idx = stylist.beforeAfter.findIndex(
            (item) => item._id && item._id.toString() === afterFirst,
          );
          beforeAfterIndex = idx !== -1 ? idx : 0;
        }
      } else {
        beforeAfterIndex = parseInt(afterFirst, 10) || 0;
      }

      await TrendingEngagement.findOneAndUpdate(
        { transformationId },
        {
          $set: {
            stylistId,
            beforeAfterIndex,
            likes,
            views,
            shares,
            commentCount,
            bookmarks,
            score: score || 0,
          },
        },
        { upsert: true },
      );
    }
  } catch (error) {
    logger.error("Failed to sync Redis engagement to MongoDB", { error: (error as Error).message });
  }
};
