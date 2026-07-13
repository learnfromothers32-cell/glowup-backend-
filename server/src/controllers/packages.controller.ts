import { Request, Response } from 'express';
import { Package, PackagePurchase } from '../models/Package';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import { verifyPaymentReference } from '../services/payment/verify-payment';

export const getStylistPackages = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findById(req.params.stylistId);
  if (!stylist) throw new ApiError(404, 'Stylist not found');

  const packages = await Package.find({ stylistId: stylist.id, isActive: true })
    .populate('services.serviceId', 'name duration price')
    .sort({ popular: -1, name: 1 });
  return sendSuccess(res, { packages });
});

export const getMyPackages = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const packages = await Package.find({ stylistId: stylist.id })
    .populate('services.serviceId', 'name duration price')
    .sort({ popular: -1, name: 1 });

  return sendSuccess(res, { packages });
});

export const createPackage = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { name, description, price, services, totalSessions, expiryDays, popular } = req.body;
  if (!name || price === undefined || !totalSessions) {
    throw new ApiError(400, 'Name, price, and total sessions are required');
  }

  const pkg = await Package.create({
    stylistId: stylist.id, name, description, price, services: services || [],
    totalSessions, expiryDays: expiryDays || 90, popular: popular || false
  });

  return sendSuccess(res, { package: pkg }, 'Package created', 201);
});

export const updatePackage = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const pkg = await Package.findOne({ _id: req.params.id, stylistId: stylist.id });
  if (!pkg) throw new ApiError(404, 'Package not found');

  const { name, description, price, services, totalSessions, expiryDays, isActive, popular } = req.body;
  if (name !== undefined) pkg.name = name;
  if (description !== undefined) pkg.description = description;
  if (price !== undefined) pkg.price = price;
  if (services !== undefined) pkg.services = services;
  if (totalSessions !== undefined) pkg.totalSessions = totalSessions;
  if (expiryDays !== undefined) pkg.expiryDays = expiryDays;
  if (isActive !== undefined) pkg.isActive = isActive;
  if (popular !== undefined) pkg.popular = popular;

  await pkg.save();
  return sendSuccess(res, { package: pkg }, 'Package updated');
});

export const deletePackage = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const pkg = await Package.findOneAndDelete({ _id: req.params.id, stylistId: stylist.id });
  if (!pkg) throw new ApiError(404, 'Package not found');

  return sendSuccess(res, null, 'Package deleted');
});

export const purchasePackage = asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.user?.id;
  const { packageId, paymentRef } = req.body;

  if (!packageId) throw new ApiError(400, 'Package ID is required');
  if (!paymentRef || typeof paymentRef !== 'string') throw new ApiError(400, 'paymentRef is required');

  const pkg = await Package.findById(packageId);
  if (!pkg) throw new ApiError(404, 'Package not found');
  if (!pkg.isActive) throw new ApiError(400, 'Package is no longer available');

  const existing = await PackagePurchase.findOne({ packageId, clientId, status: 'active' });
  if (existing) throw new ApiError(400, 'You already have an active purchase for this package');

  await verifyPaymentReference(paymentRef, pkg.price);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + pkg.expiryDays);

  const purchase = await PackagePurchase.create({
    packageId: pkg._id,
    stylistId: pkg.stylistId,
    clientId,
    remainingSessions: pkg.totalSessions,
    totalSessions: pkg.totalSessions,
    amountPaid: pkg.price,
    expiresAt,
    status: 'active',
  });

  return sendSuccess(res, { purchase }, 'Package purchased successfully', 201);
});

export const getPackagePurchases = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const purchases = await PackagePurchase.find({ stylistId: stylist.id })
    .populate('clientId', 'name email avatar')
    .populate('packageId', 'name')
    .sort({ createdAt: -1 });

  return sendSuccess(res, { purchases });
});
