import {
  Bike,
  CheckCircle2,
  ChefHat,
  ClipboardCheck,
  Package,
  PackageCheck,
  Recycle,
  Sparkles,
  Sprout,
  Truck,
  XCircle,
  Zap,
} from 'lucide-react';

export const DELIVERY_MODE_META = {
  bicycle: {
    label: 'Bicycle courier',
    icon: Bike,
    description: 'Zero tailpipe emissions. Available within 4 km.',
    badge: 'Lowest CO₂',
    tone: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  },
  ev: {
    label: 'Electric scooter',
    icon: Zap,
    description: 'Electric fleet, ~50% lower delivery emissions.',
    badge: 'Low CO₂',
    tone: 'text-lime-800 bg-lime-50 border-lime-100',
  },
  standard: {
    label: 'Petrol scooter',
    icon: Truck,
    description: 'Standard delivery on a petrol two-wheeler.',
    badge: null,
    tone: 'text-stone-600 bg-stone-50 border-stone-200',
  },
};

export const PACKAGING_META = {
  compostable: {
    label: 'Compostable',
    icon: Sprout,
    description: 'Bagasse and paper containers. Breaks down in 90 days.',
    badge: 'Recommended',
  },
  reusable: {
    label: 'Reusable tiffin',
    icon: Recycle,
    description: 'Steel containers collected on your next order.',
    badge: 'Lowest waste',
  },
  standard: {
    label: 'Standard',
    icon: Package,
    description: 'Conventional takeaway packaging.',
    badge: null,
  },
};

export const STATUS_META = {
  placed: {
    label: 'Order placed',
    short: 'Placed',
    icon: ClipboardCheck,
    description: 'We received your order and sent it to the kitchen.',
    color: 'text-blue-700 bg-blue-50 border-blue-100',
  },
  confirmed: {
    label: 'Restaurant confirmed',
    short: 'Confirmed',
    icon: CheckCircle2,
    description: 'The kitchen accepted your order and started prep.',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-100',
  },
  preparing: {
    label: 'Preparing your food',
    short: 'Preparing',
    icon: ChefHat,
    description: 'Your food is being cooked fresh, with eco packaging ready.',
    color: 'text-amber-700 bg-amber-50 border-amber-100',
  },
  out_for_delivery: {
    label: 'Out for delivery',
    short: 'On the way',
    icon: Bike,
    description: 'Your eco courier has picked up the order and is on the way.',
    color: 'text-forest bg-mint border-emerald-100',
  },
  delivered: {
    label: 'Delivered',
    short: 'Delivered',
    icon: PackageCheck,
    description: 'Delivered. Green Points have been added to your account.',
    color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    short: 'Cancelled',
    icon: XCircle,
    description: 'This order was cancelled and points were reversed.',
    color: 'text-red-700 bg-red-50 border-red-100',
  },
};

export const ORDER_FLOW = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

export const REWARD_TIER_META = {
  Seedling: { icon: Sprout, color: 'text-lime-700', ring: 'from-lime-300 to-emerald-400' },
  Sprout: { icon: Sprout, color: 'text-emerald-700', ring: 'from-emerald-300 to-green-500' },
  Sapling: { icon: Sparkles, color: 'text-green-800', ring: 'from-green-400 to-emerald-600' },
  'Forest Guardian': { icon: Sparkles, color: 'text-forest', ring: 'from-emerald-500 to-forest' },
};

export const CUISINE_CARDS = [
  { name: 'North Indian', emoji: '🍛', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=500&q=80' },
  { name: 'South Indian', emoji: '🥘', image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=500&q=80' },
  { name: 'Healthy', emoji: '🥗', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80' },
  { name: 'Italian', emoji: '🍕', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80' },
  { name: 'Chinese', emoji: '🍜', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=500&q=80' },
  { name: 'Street Food', emoji: '🥙', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80' },
  { name: 'Seafood', emoji: '🐟', image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=500&q=80' },
  { name: 'Desserts', emoji: '🍮', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=500&q=80' },
];

export const MENU_CATEGORY_ORDER = ['Starters', 'Mains', 'Breads', 'Rice & Biryani', 'Desserts', 'Drinks'];
