// src/api/mock/stylists.mock.ts


export const mockStylists: any[] = [
  {
    id: "1",
    name: "Ama Stylez",
    rating: 4.8,
    location: { area: "Airport", lat: 5.6037, lng: -0.187 },
    category: "Braids",
    bio: "Protective styles specialist.",
    isLive: true,
    isVerified: true,
    createdAt: new Date().toISOString(),
    services: ["Box Braids", "Knotless Braids", "Cornrows"],
    image: "https://i.pravatar.cc/150?img=5",
    beforeAfter: [
      {
        before: "https://images.unsplash.com/photo-1595476108010-b4d1a102d1b2?w=400&h=600&fit=crop",
        after: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=600&fit=crop",
        caption: "Stunning box braids transformation",
        service: "Box Braids"
      },
      {
        before: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=600&fit=crop",
        after: "https://images.unsplash.com/photo-1607083206869-4c76d0b1c5e8?w=400&h=600&fit=crop",
        caption: "Knotless braids fresh install",
        service: "Knotless Braids"
      
      }
    ]
  },
  {
    id: "2",
    name: "Nails by Efua",
    rating: 4.9,
    location: { area: "Osu", lat: 5.556, lng: -0.178 },
    category: "Nails",
    bio: "Luxury nail art at its finest.",
    isLive: false,
    isVerified: true,
    createdAt: new Date().toISOString(),
    services: ["Gel Manicure", "French Tips", "Nail Art"],
    image: "https://i.pravatar.cc/150?img=2",
    beforeAfter: [
      {
        before: "https://images.unsplash.com/photo-1604654894610-df6e3a5c1d4c?w=400&h=600&fit=crop",
        after: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=600&fit=crop",
        caption: "Elegant nail art – from plain to perfection",
        service: "Nail Art"
      },
      {
        before: "https://images.unsplash.com/photo-1596755094514-f87e3d6a3a2b?w=400&h=600&fit=crop",
        after: "https://images.unsplash.com/photo-1607082350899-7e105aa8862e?w=400&h=600&fit=crop",
        caption: "Fresh French tips set",
        service: "French Tips"
      }
    ]
  },
  {
    id: "3",
    name: "Kwame's Barber Shop",
    rating: 4.6,
    location: { area: "East Legon", lat: 5.644, lng: -0.166 },
    category: "Barber",
    bio: "Precision cuts & beard sculpting.",
    isLive: false,
    isVerified: true,
    createdAt: new Date().toISOString(),
    services: ["Haircut", "Beard Trim", "Hot Towel Shave"],
    image: "https://i.pravatar.cc/150?img=68",
    beforeAfter: [
      {
        before: "https://images.unsplash.com/photo-1593702288056-f8e5ab2c9a7d?w=400&h=600&fit=crop",
        after: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=600&fit=crop",
        caption: "Fresh fade & lineup",
        service: "Haircut"
      }
    ]
  },
  {
    id: "4",
    name: "Glow by Adwoa",
    rating: 4.9,
    location: { area: "Labone", lat: 5.568, lng: -0.173 },
    category: "Skin",
    bio: "Facials, waxing & skincare.",
    isLive: true,
    isVerified: false,
    createdAt: new Date().toISOString(),
    services: ["Facial", "Waxing", "Vajacial"],
    image: "https://i.pravatar.cc/150?img=45",
    beforeAfter: [
      {
        before: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=600&fit=crop",
        after: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=600&fit=crop",
        caption: "Post‑facial glow up",
        service: "Facial"
      }
    ]
  },
  {
    id: "5",
    name: "Lashes by Maame",
    rating: 4.7,
    location: { area: "Tema", lat: 5.669, lng: -0.017 },
    category: "Lashes",
    bio: "Volume lashes & lash lifts.",
    isLive: false,
    isVerified: true,
    createdAt: new Date().toISOString(),
    services: ["Classic Lashes", "Volume Lashes", "Lash Lift"],
    image: "https://i.pravatar.cc/150?img=32",
    beforeAfter: [
      {
        before: "https://images.unsplash.com/photo-1609608569820-a1d7fb1dcd6c?w=400&h=600&fit=crop",
        after: "https://images.unsplash.com/photo-1609608569820-a1d7fb1dcd6c?w=400&h=600&fit=crop",
        caption: "Volume lash set – instant drama",
        service: "Volume Lashes"
      }
    ]
  }
];