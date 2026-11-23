import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  real,
  text,
} from "drizzle-orm/pg-core";

export const restaurants = pgTable("restaurants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  cuisine: text("cuisine").notNull(),
  city: text("city").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  rating: real("rating").notNull().default(4.2),
  deliveryMins: integer("delivery_mins").notNull().default(30),
  distanceKm: real("distance_km").notNull().default(3),
  ecoCertified: boolean("eco_certified").notNull().default(false),
  isVeg: boolean("is_veg").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const menuItems = pgTable("menu_items", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("Mains"),
  priceInr: integer("price_inr").notNull(),
  isVeg: boolean("is_veg").notNull().default(true),
  available: boolean("available").notNull().default(true),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  restaurantId: text("restaurant_id").notNull(),
  restaurantName: text("restaurant_name").notNull(),
  status: text("status").notNull().default("placed"),
  deliveryMode: text("delivery_mode").notNull().default("standard"),
  ecoPackaging: boolean("eco_packaging").notNull().default(true),
  address: text("address").notNull(),
  paymentMethod: text("payment_method").notNull().default("simulated-upi"),
  subtotalInr: integer("subtotal_inr").notNull(),
  deliveryFeeInr: integer("delivery_fee_inr").notNull(),
  packagingFeeInr: integer("packaging_fee_inr").notNull(),
  taxInr: integer("tax_inr").notNull(),
  totalInr: integer("total_inr").notNull(),
  co2SavedGrams: integer("co2_saved_grams").notNull().default(0),
  ecoPointsEarned: integer("eco_points_earned").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
});

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  menuItemId: text("menu_item_id").notNull(),
  name: text("name").notNull(),
  unitPriceInr: integer("unit_price_inr").notNull(),
  quantity: integer("quantity").notNull(),
});

export const rewards = pgTable("rewards", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  orderId: text("order_id").notNull(),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()`),
});
