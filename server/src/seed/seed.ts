import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { appConfig } from '../config/app';
import { Service } from '../models/Service';
import { Stylist } from '../models/Stylist';
import { User } from '../models/User';

const seedStylists = [
// ... (keep seedStylists data)
  {
    name: 'Ama Stylez',
    rating: 4.8,
    reviewCount: 42,
    location: { area: 'Airport', lat: 5.6037, lng: -0.187 },
    category: 'Braids',
    bio: 'Protective styles specialist.',
    isLive: true,
    isVerified: true,
    image: 'https://i.pravatar.cc/150?img=5',
    price: '$45',
    priceRange: '$45 - $120',
    queuePosition: 2,
    estimatedWaitMinutes: 15,
    portfolioImages: [
      'https://images.unsplash.com/photo-1595476108010-b4d1a102d1b2?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&h=1000&fit=crop'
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
    isLive: false,
    isVerified: true,
    image: 'https://i.pravatar.cc/150?img=2',
    price: '$30',
    priceRange: '$30 - $95',
    portfolioImages: [
      'https://images.unsplash.com/photo-1604654894610-df6e3a5c1d4c?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1596755094514-f87e3d6a3a2b?w=800&h=1000&fit=crop'
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
    isLive: false,
    isVerified: true,
    image: 'https://i.pravatar.cc/150?img=68',
    price: '$20',
    priceRange: '$20 - $60',
    portfolioImages: [
      'https://images.unsplash.com/photo-1593702288056-f8e5ab2c9a7d?w=800&h=1000&fit=crop'
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
    isLive: true,
    isVerified: false,
    image: 'https://i.pravatar.cc/150?img=45',
    price: '$50',
    priceRange: '$50 - $150',
    queuePosition: 1,
    estimatedWaitMinutes: 5,
    portfolioImages: [
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=1000&fit=crop'
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
    isLive: false,
    isVerified: true,
    image: 'https://i.pravatar.cc/150?img=32',
    price: '$40',
    priceRange: '$40 - $100',
    portfolioImages: [
      'https://images.unsplash.com/photo-1609608569820-a1d7fb1dcd6c?w=800&h=1000&fit=crop'
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

  await Service.deleteMany({});
  await Stylist.deleteMany({});
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create Demo Client
  await User.create({
    name: 'Demo Client',
    email: 'client@example.com',
    passwordHash,
    role: 'client',
    points: 150
  });

  // Create Demo Stylist User
  const stylistUser = await User.create({
    name: 'Ama Stylez',
    email: 'stylist@example.com',
    passwordHash,
    role: 'stylist'
  });

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
  }

  console.log(`Seeded ${seedStylists.length} stylists and 2 demo users`);
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
