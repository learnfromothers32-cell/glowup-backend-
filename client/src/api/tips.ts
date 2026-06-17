import api from './axios';

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string[];
  image: string;
  category: string;
  tags: string[];
  author: string;
  authorId: string;
  readTime: string;
  published: boolean;
  publishedAt: string | null;
  featured: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export const getPublishedArticles = async (params?: {
  category?: string;
  tag?: string;
  search?: string;
  featured?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Article>> => {
  const { data } = await api.get('/articles/published', { params });
  return {
    items: data.data || [],
    total: data.pagination?.total || 0,
    page: data.pagination?.page || 1,
    limit: data.pagination?.limit || 12,
    totalPages: data.pagination?.totalPages || 0,
    hasMore: data.pagination?.hasMore || false,
  };
};

export const getArticleBySlug = async (slug: string): Promise<Article> => {
  const { data } = await api.get(`/articles/published/${slug}`);
  return data.data.article;
};

export const getArticleById = async (id: string): Promise<Article> => {
  const { data } = await api.get(`/articles/${id}`);
  return data.data.article;
};

export const getMyArticles = async (params?: {
  published?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Article>> => {
  const { data } = await api.get('/articles/my', { params });
  return {
    items: data.data || [],
    total: data.pagination?.total || 0,
    page: data.pagination?.page || 1,
    limit: data.pagination?.limit || 20,
    totalPages: data.pagination?.totalPages || 0,
    hasMore: data.pagination?.hasMore || false,
  };
};

export const createArticle = async (payload: {
  title: string;
  excerpt: string;
  content: string[];
  image: string;
  category: string;
  tags?: string[];
}): Promise<Article> => {
  const { data } = await api.post('/articles', payload);
  return data.data.article;
};

export const updateArticle = async (
  id: string,
  payload: Partial<{
    title: string;
    excerpt: string;
    content: string[];
    image: string;
    category: string;
    tags: string[];
    published: boolean;
  }>
): Promise<Article> => {
  const { data } = await api.put(`/articles/${id}`, payload);
  return data.data.article;
};

export const deleteArticle = async (id: string): Promise<void> => {
  await api.delete(`/articles/${id}`);
};
