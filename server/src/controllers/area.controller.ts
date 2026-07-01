import { Request, Response } from 'express';
import { Area } from '../models/Area';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const getAreas = asyncHandler(async (_req: Request, res: Response) => {
  const [seeded, stylistAreas] = await Promise.all([
    Area.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Stylist.aggregate([
      { $match: { 'location.area': { $nin: ['', null, 'My location'] }, 'location.lat': { $ne: 0 }, 'location.lng': { $ne: 0 } } },
      { $group: { _id: '$location.area', lat: { $avg: '$location.lat' }, lng: { $avg: '$location.lng' } } },
      { $project: { name: '$_id', lat: { $ifNull: ['$lat', 0] }, lng: { $ifNull: ['$lng', 0] }, _id: 0 } },
    ]),
  ]);

  const seededNames = new Set(seeded.map((a) => a.name.toLowerCase()));
  const extra = stylistAreas
    .filter((a: any) => !seededNames.has(a.name.toLowerCase()))
    .map((a: any) => ({
      _id: '',
      name: a.name,
      lat: a.lat || 0,
      lng: a.lng || 0,
      tag: '',
      city: '',
      region: '',
      order: 99,
    }));

  const areas = [...seeded, ...extra].sort((a, b) => a.name.localeCompare(b.name));
  return sendSuccess(res, { areas, total: areas.length });
});

export const getCities = asyncHandler(async (_req: Request, res: Response) => {
  const cities = await Area.distinct('city', { active: true });
  return sendSuccess(res, cities );
});
