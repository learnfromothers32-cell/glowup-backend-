import {
  getTrendingTransformations,
  trackTrendingActivity,
  clearMemoryCache,
  type TrendingCursor,
} from "./trending.service";
import { Stylist } from "../models/Stylist";
import { TrendingEngagement } from "../models/TrendingEngagement";

const mockLean = jest.fn();

jest.mock("../models/Stylist");
jest.mock("../models/TrendingEngagement", () => ({
  TrendingEngagement: {
    find: jest.fn(() => ({ lean: mockLean })),
    findOneAndUpdate: jest.fn(),
  },
}));
jest.mock("../config/redis", () => {
  const mockRedis: { redisClient: any } = { redisClient: null };
  return mockRedis;
});
jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const mockStylist = (overrides = {}) => ({
  _id: "507f191e810c19729de860ea",
  name: "Test Stylist",
  image: "/images/stylist.jpg",
  category: "Braids",
  location: { area: "Lagos" },
  rating: 4.5,
  reviewCount: 120,
  createdAt: new Date("2025-01-01"),
  beforeAfter: [
    {
      _id: "507f191e810c19729de860eb",
      before: "/images/before1.jpg",
      after: "/images/after1.jpg",
      caption: "Amazing transformation",
      service: "Box Braids",
      mediaType: "image",
      createdAt: new Date("2025-05-01"),
    },
    {
      before: "/images/before2.jpg",
      after: "/images/after2.jpg",
      caption: "Another look",
      service: "Knotless Braids",
      mediaType: "image",
      createdAt: new Date("2025-05-15"),
    },
  ],
  ...overrides,
});

describe("getTrendingTransformations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearMemoryCache();
  });

  it("returns empty array when no stylists have before/after items", async () => {
    (Stylist.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    const result = await getTrendingTransformations(20);
    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeUndefined();
  });

  it("returns transformations sorted by score descending", async () => {
    const stylist = mockStylist();
    (Stylist.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([stylist]),
    });
    mockLean.mockResolvedValue([]);

    const result = await getTrendingTransformations(20);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].stylistName).toBe("Test Stylist");
    expect(result.items[0].id).toContain("507f191e810c19729de860ea");
    expect(result.items[0].before).toBe("/images/before1.jpg");
    expect(result.items[0].after).toBe("/images/after1.jpg");
  });

  it("applies cursor-based pagination correctly", async () => {
    const now = Date.now();
    const stylist = mockStylist({
      beforeAfter: Array.from({ length: 5 }, (_, i) => ({
        _id: `507f191e810c19729de860e${i}`,
        before: `/images/before${i}.jpg`,
        after: `/images/after${i}.jpg`,
        caption: `Transformation ${i}`,
        service: "Service",
        mediaType: "image",
        createdAt: new Date(now - i * 86400000),
      })),
    });

    (Stylist.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([stylist]),
    });
    mockLean.mockResolvedValue([]);

    const page1 = await getTrendingTransformations(2);
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).toBeDefined();

    const cursor: TrendingCursor = page1.nextCursor!;
    const page2 = await getTrendingTransformations(2, cursor);
    expect(page2.items).toHaveLength(2);
    expect(page2.nextCursor).toBeDefined();

    const page3 = await getTrendingTransformations(2, page2.nextCursor!);
    expect(page3.items).toHaveLength(1);
    expect(page3.nextCursor).toBeUndefined();

    const allIds = [...page1.items, ...page2.items, ...page3.items].map((i) => i.id);
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(5);
  });

  it("attaches engagement counts from MongoDB", async () => {
    const stylist = mockStylist();
    (Stylist.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([stylist]),
    });

    const transformationId = "507f191e810c19729de860ea_507f191e810c19729de860eb";
    mockLean.mockResolvedValue([
      {
        transformationId,
        likes: 42,
        views: 1500,
        commentCount: 7,
        shares: 12,
        bookmarks: 5,
      },
    ]);

    const result = await getTrendingTransformations(20);
    const item = result.items.find((i) => i.id === transformationId);
    expect(item).toBeDefined();
    expect(item!.likes).toBe(42);
    expect(item!.views).toBe(1500);
    expect(item!.commentCount).toBe(7);
    expect(item!.shares).toBe(12);
    expect(item!.bookmarks).toBe(5);
  });
});

describe("trackTrendingActivity", () => {
  beforeEach(() => {
    mockLean.mockReset();
  });

  it("writes directly to MongoDB when Redis is unavailable", async () => {
    (TrendingEngagement.findOneAndUpdate as jest.Mock).mockResolvedValue({});

    await trackTrendingActivity("test-post-1", "like", "user-1");

    expect(TrendingEngagement.findOneAndUpdate).toHaveBeenCalledWith(
      { transformationId: "test-post-1" },
      { $inc: { likes: 1 } },
      { upsert: true },
    );
  });

  it("handles unlike events correctly", async () => {
    (TrendingEngagement.findOneAndUpdate as jest.Mock).mockResolvedValue({});

    await trackTrendingActivity("test-post-1", "unlike", "user-1");

    expect(TrendingEngagement.findOneAndUpdate).toHaveBeenCalledWith(
      { transformationId: "test-post-1" },
      { $inc: { likes: -1 } },
      { upsert: true },
    );
  });

  it("handles view events without userId", async () => {
    (TrendingEngagement.findOneAndUpdate as jest.Mock).mockResolvedValue({});

    await trackTrendingActivity("test-post-1", "view");

    expect(TrendingEngagement.findOneAndUpdate).toHaveBeenCalledWith(
      { transformationId: "test-post-1" },
      { $inc: { views: 1 } },
      { upsert: true },
    );
  });
});
