import { Request, Response } from 'express';
import { Article, IArticle } from '../models/Article';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';

function sanitize(article: IArticle) {
  return {
    id: article._id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    image: article.image,
    category: article.category,
    tags: article.tags,
    author: article.author,
    authorId: article.authorId,
    readTime: article.readTime,
    published: article.published,
    publishedAt: article.publishedAt,
    featured: article.featured,
    viewCount: article.viewCount,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}

export const getPublishedArticles = asyncHandler(async (req: Request, res: Response) => {
  const { category, tag, search, featured, page = '1', limit = '12' } = req.query;

  const filter: any = { published: true };

  if (category && category !== 'All') filter.category = category;
  if (tag) filter.tags = tag;
  if (featured === 'true') filter.featured = true;
  if (search) {
    const q = (search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { excerpt: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const [articles, total] = await Promise.all([
    Article.find(filter).sort({ featured: -1, createdAt: -1 }).skip(skip).limit(limitNum),
    Article.countDocuments(filter),
  ]);

  return sendPaginated(res, articles.map(sanitize), total, pageNum, limitNum);
});

export const getArticleBySlug = asyncHandler(async (req: Request, res: Response) => {
  const article = await Article.findOne({ slug: req.params.slug, published: true });
  if (!article) throw new ApiError(404, 'Article not found');

  article.viewCount += 1;
  await article.save();

  return sendSuccess(res, { article: sanitize(article) });
});

export const getArticleById = asyncHandler(async (req: Request, res: Response) => {
  const article = await Article.findById(req.params.id);
  if (!article) throw new ApiError(404, 'Article not found');

  return sendSuccess(res, { article: sanitize(article) });
});

export const getMyArticles = asyncHandler(async (req: Request, res: Response) => {
  const { published, page = '1', limit = '20' } = req.query;

  const filter: any = { authorId: req.user?.id };
  if (published === 'true') filter.published = true;
  if (published === 'false') filter.published = false;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [articles, total] = await Promise.all([
    Article.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Article.countDocuments(filter),
  ]);

  return sendPaginated(res, articles.map(sanitize), total, pageNum, limitNum);
});

export const createArticle = asyncHandler(async (req: Request, res: Response) => {
  const { title, excerpt, content, image, category, tags } = req.body;

  if (!title || !excerpt || !content || !image || !category) {
    throw new ApiError(400, 'Title, excerpt, content, image, and category are required');
  }

  const user = await User.findById(req.user?.id).select('name');
  const authorName = user?.name || 'Anonymous';

  const article = await Article.create({
    title,
    excerpt,
    content: Array.isArray(content) ? content : [content],
    image,
    category,
    tags: tags || [],
    author: authorName,
    authorId: req.user?.id,
  });

  return sendSuccess(res, { article: sanitize(article) }, 'Article created', 201);
});

export const updateArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await Article.findById(req.params.id);
  if (!article) throw new ApiError(404, 'Article not found');

  if (article.authorId.toString() !== req.user?.id && req.user?.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to update this article');
  }

  const { title, excerpt, content, image, category, tags, published, featured } = req.body;

  if (title !== undefined) article.title = title;
  if (excerpt !== undefined) article.excerpt = excerpt;
  if (content !== undefined) article.content = Array.isArray(content) ? content : [content];
  if (image !== undefined) article.image = image;
  if (category !== undefined) article.category = category;
  if (tags !== undefined) article.tags = tags;
  if (published !== undefined) {
    article.published = published;
    if (published && !article.publishedAt) article.publishedAt = new Date();
  }
  if (featured !== undefined && req.user?.role === 'admin') article.featured = featured;

  await article.save();
  return sendSuccess(res, { article: sanitize(article) }, 'Article updated');
});

export const deleteArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await Article.findById(req.params.id);
  if (!article) throw new ApiError(404, 'Article not found');

  if (article.authorId.toString() !== req.user?.id && req.user?.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to delete this article');
  }

  await article.deleteOne();
  return sendSuccess(res, null, 'Article deleted');
});

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = ['Hair', 'Barber', 'Skin', 'Nails', 'Lashes'];
  return sendSuccess(res, { categories });
});
