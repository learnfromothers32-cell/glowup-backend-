import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { appConfig } from '../config/app';
import { Service } from '../models/Service';
import { Stylist } from '../models/Stylist';
import { User } from '../models/User';
import { Availability } from '../models/Availability';
import { Client } from '../models/Client';
import { Product } from '../models/Product';
import { Package } from '../models/Package';
import { MembershipTier } from '../models/Membership';
import { PromoCode, GiftCard } from '../models/PromoCode';
import { StylistSettings } from '../models/StylistSettings';
import { Area } from '../models/Area';
import { seedHairstyles } from './hairstyles';
import { seedCreditPackages } from './creditPackages';

const seedStylists = [
// ... (keep seedStylists data)
  {
    name: 'Ama Stylez',
    rating: 4.8,
    reviewCount: 42,
    location: { area: 'Airport', lat: 5.6037, lng: -0.187 },
    category: 'Braids',
    bio: 'Protective styles specialist.',
    isVerified: true,
    image: 'https://i.pravatar.cc/150?img=5',
    price: '$45',
    priceRange: '$45 - $120',
    queuePosition: 2,
    estimatedWaitMinutes: 15,
    portfolioImages: [
      { url: 'https://images.unsplash.com/photo-1595476108010-b4d1a102d1b2?w=800&h=1000&fit=crop', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&h=1000&fit=crop', type: 'image' }
    ],
    beforeAfter: [
      {
        before:
          'https://images.unsplash.com/photo-1595476108010-b4d1a102d1b2?w=400&h=600&fit=crop',
        after:
          'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=600&fit=crop',
        caption: 'Stunning box braids transformation',
        service: 'Box Braids'
      },
      {
        before:
          'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=600&fit=crop',
        after:
          'https://images.unsplash.com/photo-1607083206869-4c76d0b1c5e8?w=400&h=600&fit=crop',
        caption: 'Knotless braids fresh install',
        service: 'Knotless Braids'
      }
    ],
    services: [
      { name: 'Box Braids', category: 'Braids', price: 85, duration: 180, popular: true },
      { name: 'Knotless Braids', category: 'Braids', price: 110, duration: 210, popular: true },
      { name: 'Cornrows', category: 'Braids', price: 45, duration: 90, popular: false }
    ]
  },
  {
    name: 'Nails by Efua',
    rating: 4.9,
    reviewCount: 67,
    location: { area: 'Osu', lat: 5.556, lng: -0.178 },
    category: 'Nails',
    bio: 'Luxury nail art at its finest.',
    isVerified: true,
    image: 'https://i.pravatar.cc/150?img=2',
    price: '$30',
    priceRange: '$30 - $95',
    portfolioImages: [
      { url: 'https://images.unsplash.com/photo-1604654894610-df6e3a5c1d4c?w=800&h=1000&fit=crop', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1596755094514-f87e3d6a3a2b?w=800&h=1000&fit=crop', type: 'image' }
    ],
    beforeAfter: [
      {
        before:
          'https://images.unsplash.com/photo-1604654894610-df6e3a5c1d4c?w=400&h=600&fit=crop',
        after:
          'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=600&fit=crop',
        caption: 'Elegant nail art from plain to perfection',
        service: 'Nail Art'
      },
      {
        before:
          'https://images.unsplash.com/photo-1596755094514-f87e3d6a3a2b?w=400&h=600&fit=crop',
        after:
          'https://images.unsplash.com/photo-1607082350899-7e105aa8862e?w=400&h=600&fit=crop',
        caption: 'Fresh French tips set',
        service: 'French Tips'
      }
    ],
    services: [
      { name: 'Gel Manicure', category: 'Nails', price: 35, duration: 45, popular: true },
      { name: 'French Tips', category: 'Nails', price: 45, duration: 60, popular: false },
      { name: 'Nail Art', category: 'Nails', price: 65, duration: 90, popular: true }
    ]
  },
  {
    name: "Kwame's Barber Shop",
    rating: 4.6,
    reviewCount: 31,
    location: { area: 'East Legon', lat: 5.644, lng: -0.166 },
    category: 'Barber',
    bio: 'Precision cuts and beard sculpting.',
    isVerified: true,
    image: 'https://i.pravatar.cc/150?img=68',
    price: '$20',
    priceRange: '$20 - $60',
    portfolioImages: [
      { url: 'https://images.unsplash.com/photo-1593702288056-f8e5ab2c9a7d?w=800&h=1000&fit=crop', type: 'image' }
    ],
    beforeAfter: [
      {
        before:
          'https://images.unsplash.com/photo-1593702288056-f8e5ab2c9a7d?w=400&h=600&fit=crop',
        after:
          'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=600&fit=crop',
        caption: 'Fresh fade and lineup',
        service: 'Haircut'
      }
    ],
    services: [
      { name: 'Haircut', category: 'Barber', price: 25, duration: 35, popular: true },
      { name: 'Beard Trim', category: 'Barber', price: 20, duration: 20, popular: false },
      { name: 'Hot Towel Shave', category: 'Barber', price: 35, duration: 40, popular: false }
    ]
  },
  {
    name: 'Glow by Adwoa',
    rating: 4.9,
    reviewCount: 54,
    location: { area: 'Labone', lat: 5.568, lng: -0.173 },
    category: 'Skin',
    bio: 'Facials, waxing and skincare.',
    isVerified: false,
    image: 'https://i.pravatar.cc/150?img=45',
    price: '$50',
    priceRange: '$50 - $150',
    queuePosition: 1,
    estimatedWaitMinutes: 5,
    portfolioImages: [
      { url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=1000&fit=crop', type: 'image' }
    ],
    beforeAfter: [
      {
        before:
          'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=600&fit=crop',
        after:
          'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=600&fit=crop',
        caption: 'Post-facial glow up',
        service: 'Facial'
      }
    ],
    services: [
      { name: 'Facial', category: 'Skin', price: 75, duration: 60, popular: true },
      { name: 'Waxing', category: 'Skin', price: 50, duration: 45, popular: false },
      { name: 'Vajacial', category: 'Skin', price: 95, duration: 75, popular: true }
    ]
  },
  {
    name: 'Lashes by Maame',
    rating: 4.7,
    reviewCount: 28,
    location: { area: 'Tema', lat: 5.669, lng: -0.017 },
    category: 'Lashes',
    bio: 'Volume lashes and lash lifts.',
    isVerified: true,
    image: 'https://i.pravatar.cc/150?img=32',
    price: '$40',
    priceRange: '$40 - $100',
    portfolioImages: [
      { url: 'https://images.unsplash.com/photo-1609608569820-a1d7fb1dcd6c?w=800&h=1000&fit=crop', type: 'image' }
    ],
    beforeAfter: [
      {
        before:
          'https://images.unsplash.com/photo-1609608569820-a1d7fb1dcd6c?w=400&h=600&fit=crop',
        after:
          'https://images.unsplash.com/photo-1609608569820-a1d7fb1dcd6c?w=400&h=600&fit=crop',
        caption: 'Volume lash set with instant drama',
        service: 'Volume Lashes'
      }
    ],
    services: [
      { name: 'Classic Lashes', category: 'Lashes', price: 55, duration: 75, popular: false },
      { name: 'Volume Lashes', category: 'Lashes', price: 85, duration: 105, popular: true },
      { name: 'Lash Lift', category: 'Lashes', price: 45, duration: 45, popular: false }
    ]
  }
];

const seed = async () => {
  if (!appConfig.mongoUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(appConfig.mongoUri);

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create Demo Client (skip if exists)
  const existingClient = await User.findOne({ email: 'client@example.com' });
  if (!existingClient) {
    await User.create({
      name: 'Demo Client',
      email: 'client@example.com',
      passwordHash,
      role: 'client',
      points: 150
    });
    console.log('Created demo client user');
  }

  // Create Demo Stylist User (skip if exists)
  let stylistUser = await User.findOne({ email: 'stylist@example.com' });
  if (!stylistUser) {
    stylistUser = await User.create({
      name: 'Ama Stylez',
      email: 'stylist@example.com',
      passwordHash,
      role: 'stylist'
    });
    console.log('Created demo stylist user');
  }

  // Clear existing stylist data to ensure fresh beforeAfter data
  await Promise.all([
    Stylist.deleteMany({}),
    Service.deleteMany({})
  ]);
  console.log('Cleared existing stylists and services');

  for (let i = 0; i < seedStylists.length; i++) {
    const item = seedStylists[i];
    const { services, ...stylistInput } = item;

    // Link first stylist to the demo stylist user
    const input = i === 0
      ? { ...stylistInput, userId: stylistUser._id }
      : stylistInput;

    const stylist = await Stylist.create(input);

    await Service.insertMany(
      services.map((service) => ({
        ...service,
        stylistId: stylist._id,
        isActive: true
      }))
    );
    console.log(`Created stylist: ${item.name}`);
  }

  // Seed new models for the demo stylist
  const demoStylist = await Stylist.findOne({ userId: stylistUser._id });
  if (demoStylist) {
    const stylistId = demoStylist._id;

    // Availability
    if (!(await Availability.findOne({ stylistId }))) {
      await Availability.create({
        stylistId,
        schedule: {
          monday: { enabled: true, start: '09:00', end: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
          tuesday: { enabled: true, start: '09:00', end: '17:00', breaks: [] },
          wednesday: { enabled: true, start: '09:00', end: '17:00', breaks: [] },
          thursday: { enabled: true, start: '09:00', end: '17:00', breaks: [] },
          friday: { enabled: true, start: '09:00', end: '16:00', breaks: [] },
          saturday: { enabled: true, start: '10:00', end: '14:00', breaks: [] },
          sunday: { enabled: false, start: '09:00', end: '17:00', breaks: [] }
        },
        bufferMinutes: 15,
        dateOverrides: []
      });
      console.log('Seeded availability');
    }

    // Client profile for demo client
    const demoClientUser = await User.findOne({ email: 'client@example.com' });
    if (demoClientUser && !(await Client.findOne({ userId: demoClientUser._id, stylistId }))) {
      await Client.create({
        userId: demoClientUser._id,
        stylistId,
        totalVisits: 3,
        totalSpent: 340,
        lastVisit: new Date(),
        favorite: true,
        tags: ['VIP', 'Regular'],
        notes: 'Prefers morning appointments. Allergic to peppermint oil.'
      });
      console.log('Seeded client profile');
    }

    // Products
    if (!(await Product.findOne({ stylistId }))) {
      await Product.insertMany([
        { stylistId, name: 'Hair Moisturizer', description: 'Deep conditioning leave-in moisturizer for braids', price: 45, costPrice: 20, sku: 'HR-001', stock: 50, lowStockThreshold: 10, category: 'Hair', isActive: true, taxable: true },
        { stylistId, name: 'Edge Control Gel', description: 'Strong hold edge control with aloe vera', price: 25, costPrice: 10, sku: 'HR-002', stock: 100, lowStockThreshold: 20, category: 'Hair', isActive: true, taxable: true },
        { stylistId, name: 'Silk Scarf', description: '100% mulberry silk scarf for hair protection', price: 35, costPrice: 18, sku: 'AC-001', stock: 25, lowStockThreshold: 5, category: 'Products', isActive: true, taxable: false },
        { stylistId, name: 'Nourishing Hair Oil', description: 'Jojoba and argan oil blend for scalp health', price: 55, costPrice: 25, sku: 'HR-003', stock: 30, lowStockThreshold: 8, category: 'Hair', isActive: true, taxable: true }
      ]);
      console.log('Seeded products');
    }

    // Packages
    if (!(await Package.findOne({ stylistId }))) {
      await Package.create({
        stylistId,
        name: 'Braids Bundle',
        description: '3 braid sessions at a discounted rate',
        price: 195,
        originalPrice: 255,
        totalSessions: 3,
        expiryDays: 180,
        popular: true,
        isActive: true
      });
      await Package.create({
        stylistId,
        name: 'Pamper Package',
        description: 'Facial + manicure + scalp treatment',
        price: 150,
        originalPrice: 190,
        totalSessions: 3,
        expiryDays: 90,
        popular: false,
        isActive: true
      });
      console.log('Seeded packages');
    }

    // Membership Tiers
    if (!(await MembershipTier.findOne({ stylistId }))) {
      await MembershipTier.create({
        stylistId,
        name: 'Gold',
        description: 'Priority booking and 10% off all services',
        price: 49,
        billingCycle: 'monthly',
        benefits: ['Priority booking', '10% off services', 'Free consultation annually'],
        discountPercent: 10,
        isActive: true
      });
      await MembershipTier.create({
        stylistId,
        name: 'Platinum',
        description: 'VIP perks with 20% off everything',
        price: 99,
        billingCycle: 'monthly',
        benefits: ['Unlimited priority booking', '20% off all services', 'Free products monthly', 'Monthly VIP event access'],
        discountPercent: 20,
        isActive: true
      });
      console.log('Seeded membership tiers');
    }

    // Promo Codes
    if (!(await PromoCode.findOne({ stylistId }))) {
      await PromoCode.create({
        stylistId,
        code: 'WELCOME10',
        description: '10% off for first-time clients',
        discountType: 'percentage',
        discountValue: 10,
        minBookingValue: 50,
        maxUses: 50,
        maxUsesPerClient: 1,
        isActive: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });
      await PromoCode.create({
        stylistId,
        code: 'BRAIDS20',
        description: 'GH₵20 off any braid service',
        discountType: 'fixed',
        discountValue: 20,
        minBookingValue: 80,
        maxUses: 20,
        maxUsesPerClient: 1,
        isActive: true,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      });
      console.log('Seeded promo codes');
    }

    // Gift Cards
    if (demoClientUser && !(await GiftCard.findOne({ stylistId }))) {
      await GiftCard.create({
        stylistId,
        purchasedBy: demoClientUser._id,
        code: 'GIFT-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        initialBalance: 100,
        remainingBalance: 100,
        senderName: 'John Doe',
        recipientEmail: 'client@example.com',
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });
      console.log('Seeded gift cards');
    }

    // StylistSettings
    if (!(await StylistSettings.findOne({ stylistId }))) {
      await StylistSettings.create({
        stylistId,
        notifications: { newBooking: true, cancellationAlert: true, reviewNotify: true, marketingEmails: false, reminderEmails: true },
        privacy: { showInSearch: true, showEmailToClients: false, showPhoneToClients: false }
      });
      console.log('Seeded stylist settings');
    }
  }

  // Areas (seed once)
  if ((await Area.countDocuments()) === 0) {
    const areaData = [
      { name: 'Airport', lat: 5.6037, lng: -0.187, tag: 'Residential', order: 1 },
      { name: 'Cantonments', lat: 5.5944, lng: -0.178, tag: 'Upscale', order: 2 },
      { name: 'Osu', lat: 5.5589, lng: -0.185, tag: 'Vibrant', order: 3 },
      { name: 'East Legon', lat: 5.6516, lng: -0.1866, tag: 'Popular', order: 4 },
      { name: 'Labone', lat: 5.5612, lng: -0.1798, tag: 'Trendy', order: 5 },
      { name: 'Dzorwulu', lat: 5.6, lng: -0.215, tag: 'Central', order: 6 },
      { name: 'Tema', lat: 5.6699, lng: -0.0164, tag: 'Metro', order: 7 },
      { name: 'Spintex', lat: 5.6099, lng: -0.1293, tag: 'Growing', order: 8 },
      { name: 'Madina', lat: 5.6826, lng: -0.172, tag: 'Bustling', order: 9 },
      { name: 'Adenta', lat: 5.7069, lng: -0.1562, tag: 'Suburban', order: 10 },
      { name: 'Achimota', lat: 5.615, lng: -0.2297, tag: 'Green', order: 11 },
      { name: 'Teshie', lat: 5.5833, lng: -0.1, tag: 'Coastal', order: 12 },
    ];
    await Area.insertMany(areaData);
    console.log(`Seeded ${areaData.length} areas`);
  }

  await seedHairstyles();
  await seedCreditPackages();

  console.log(`Seed complete. ${await Stylist.countDocuments()} stylists in DB`);
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
