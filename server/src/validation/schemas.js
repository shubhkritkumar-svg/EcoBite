import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id');
const phone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');
const pincode = z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode');
const imageUrl = z.string().trim().url('Enter a valid image URL');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long')
    .regex(/[A-Za-z]/, 'Password must include a letter')
    .regex(/\d/, 'Password must include a number'),
  phone: z.union([phone, z.literal('')]).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  phone: z.union([phone, z.literal('')]).optional(),
});

export const addressSchema = z.object({
  label: z.string().trim().max(30).optional().default('Home'),
  line1: z.string().trim().min(5, 'Address is too short').max(160),
  area: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(60),
  pincode,
  isDefault: z.boolean().optional().default(false),
});

const deliveryMode = z.enum(['standard', 'ev', 'bicycle']);
const packaging = z.enum(['standard', 'compostable', 'reusable']);

export const createOrderSchema = z
  .object({
    restaurantId: objectId,
    items: z
      .array(
        z.object({
          menuItemId: objectId,
          quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 per item'),
        })
      )
      .min(1, 'Add at least one item to your order')
      .max(25),
    addressId: objectId.optional(),
    address: addressSchema.optional(),
    saveAddress: z.boolean().optional().default(false),
    contactPhone: phone,
    deliveryMode: deliveryMode.default('standard'),
    packaging: packaging.default('compostable'),
    cutlery: z.boolean().default(false),
    paymentMethod: z.enum(['demo_card', 'demo_upi', 'cash_on_delivery']).default('demo_upi'),
  })
  .refine((data) => data.addressId || data.address, {
    message: 'Choose a saved address or enter a delivery address.',
    path: ['address'],
  });

export const orderStatusSchema = z.object({
  status: z.enum(['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']),
});

const cuisines = [
  'North Indian',
  'South Indian',
  'Healthy',
  'Italian',
  'Chinese',
  'Street Food',
  'Mughlai',
  'Seafood',
  'Continental',
  'Desserts',
  'Beverages',
];

export const restaurantSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens')
    .optional(),
  description: z.string().trim().min(10, 'Write a short description').max(400),
  cuisines: z.array(z.enum(cuisines)).min(1, 'Pick at least one cuisine'),
  area: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(60),
  image: imageUrl,
  rating: z.number().min(0).max(5).optional(),
  ratingCount: z.number().int().min(0).optional(),
  priceForTwo: z.number().int().min(100).max(10000),
  deliveryTimeMins: z.number().int().min(5).max(120),
  distanceKm: z.number().min(0).max(30),
  isEcoCertified: z.boolean().optional(),
  ecoCriteria: z.array(z.string().trim().max(60)).max(10).optional(),
  deliveryModes: z.array(deliveryMode).min(1).optional(),
  packagingOptions: z.array(packaging).min(1).optional(),
  isActive: z.boolean().optional(),
});

export const restaurantUpdateSchema = restaurantSchema.partial();

export const menuItemSchema = z.object({
  restaurant: objectId,
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(5).max(300),
  price: z.number().int().min(1).max(5000),
  category: z.enum(['Starters', 'Mains', 'Breads', 'Rice & Biryani', 'Desserts', 'Drinks']),
  image: imageUrl,
  isVeg: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  spiceLevel: z.enum(['None', 'Mild', 'Medium', 'Hot']).optional(),
  calories: z.number().int().min(0).max(3000).optional(),
  available: z.boolean().optional(),
  popularity: z.number().int().min(0).optional(),
});

export const menuItemUpdateSchema = menuItemSchema.omit({ restaurant: true }).partial();
