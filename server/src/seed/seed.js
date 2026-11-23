import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { Reward } from '../models/Reward.js';
import { computeTotals } from '../utils/pricing.js';
import { computeEcoImpact } from '../utils/eco.js';
import { seedRestaurants, seedUsers } from './data.js';

const FLOW = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
const HISTORY_OFFSETS_MIN = [0, 4, 10, 22, 38];

const sampleOrders = [
  {
    email: 'demo@ecobite.in',
    restaurantSlug: 'the-green-tiffin',
    items: [
      ['Paneer Butter Masala', 1],
      ['Tandoori Roti', 2],
      ['Jeera Rice', 1],
    ],
    status: 'delivered',
    deliveryMode: 'bicycle',
    packaging: 'reusable',
    cutlery: false,
    daysAgo: 9,
  },
  {
    email: 'demo@ecobite.in',
    restaurantSlug: 'sprout-and-sip',
    items: [
      ['Avocado Buddha Bowl', 1],
      ['Cold Brew Coffee', 1],
      ['Vegan Chocolate Brownie', 1],
    ],
    status: 'delivered',
    deliveryMode: 'bicycle',
    packaging: 'compostable',
    cutlery: true,
    daysAgo: 6,
  },
  {
    email: 'demo@ecobite.in',
    restaurantSlug: 'coastal-cravings',
    items: [
      ['Ghee Roast Dosa', 1],
      ['Kerala Fish Curry', 1],
      ['Filter Coffee', 1],
    ],
    status: 'out_for_delivery',
    deliveryMode: 'ev',
    packaging: 'compostable',
    cutlery: false,
    hoursAgo: 2,
  },
  {
    email: 'demo@ecobite.in',
    restaurantSlug: 'mango-tree-meals',
    items: [
      ['Banana Leaf Thali', 2],
      ['Curd Rice', 1],
    ],
    status: 'delivered',
    deliveryMode: 'bicycle',
    packaging: 'reusable',
    cutlery: false,
    daysAgo: 3,
  },
  {
    email: 'demo@ecobite.in',
    restaurantSlug: 'pizzeria-basilico',
    items: [
      ['Margherita Pizza', 1],
      ['Tiramisu', 1],
    ],
    status: 'delivered',
    deliveryMode: 'ev',
    packaging: 'reusable',
    cutlery: false,
    daysAgo: 12,
  },
  {
    email: 'demo@ecobite.in',
    restaurantSlug: 'chaat-chronicles',
    items: [
      ['Pani Puri', 2],
      ['Pav Bhaji', 1],
    ],
    status: 'cancelled',
    deliveryMode: 'standard',
    packaging: 'standard',
    cutlery: true,
    daysAgo: 5,
  },
  {
    email: 'kabir@ecobite.in',
    restaurantSlug: 'tandoor-trail',
    items: [
      ['Butter Chicken', 1],
      ['Laccha Paratha', 2],
      ['Chicken Dum Biryani', 1],
    ],
    status: 'delivered',
    deliveryMode: 'standard',
    packaging: 'standard',
    cutlery: true,
    daysAgo: 8,
  },
  {
    email: 'kabir@ecobite.in',
    restaurantSlug: 'wok-of-fame',
    items: [
      ['Veg Hakka Noodles', 1],
      ['Steamed Veg Momos', 2],
      ['Jasmine Green Tea', 1],
    ],
    status: 'delivered',
    deliveryMode: 'ev',
    packaging: 'compostable',
    cutlery: false,
    daysAgo: 2,
  },
];

function historyFor(status, base) {
  if (status === 'cancelled') {
    return [
      { status: 'placed', at: base },
      { status: 'cancelled', at: new Date(base.getTime() + 6 * 60 * 1000) },
    ];
  }
  const lastIndex = FLOW.indexOf(status);
  return FLOW.slice(0, lastIndex + 1).map((value, index) => ({
    status: value,
    at: new Date(base.getTime() + HISTORY_OFFSETS_MIN[index] * 60 * 1000),
  }));
}

export async function seedDatabase({ reset = false } = {}) {
  if (reset) {
    await Promise.all([
      Reward.deleteMany({}),
      Order.deleteMany({}),
      MenuItem.deleteMany({}),
      Restaurant.deleteMany({}),
      User.deleteMany({}),
    ]);
  }

  const existing = await Restaurant.countDocuments();
  if (existing > 0) {
    return { seeded: false, restaurants: existing };
  }

  const usersByEmail = new Map();
  for (const userData of seedUsers) {
    const { password, ...fields } = userData;
    const user = new User(fields);
    await user.setPassword(password);
    await user.save();
    usersByEmail.set(user.email, user);
  }

  const restaurantsBySlug = new Map();
  for (const restaurantData of seedRestaurants) {
    const { menu, ...fields } = restaurantData;
    const restaurant = await Restaurant.create(fields);
    restaurantsBySlug.set(restaurant.slug, restaurant);

    await MenuItem.insertMany(menu.map((menuItem) => ({ ...menuItem, restaurant: restaurant._id })));
  }

  const pointsByUser = new Map();
  const savingsByUser = new Map();

  for (const sample of sampleOrders) {
    const user = usersByEmail.get(sample.email);
    const restaurant = restaurantsBySlug.get(sample.restaurantSlug);
    if (!user || !restaurant) continue;

    const menuItems = await MenuItem.find({
      restaurant: restaurant._id,
      name: { $in: sample.items.map(([name]) => name) },
    });
    const items = sample.items.map(([name, quantity]) => {
      const menuItem = menuItems.find((entry) => entry.name === name);
      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        image: menuItem.image,
        isVeg: menuItem.isVeg,
      };
    });

    const totals = computeTotals(items);
    const eco = computeEcoImpact({
      distanceKm: restaurant.distanceKm,
      deliveryMode: sample.deliveryMode,
      packaging: sample.packaging,
      cutlery: sample.cutlery,
    });

    const base = new Date(
      Date.now() - (sample.daysAgo ? sample.daysAgo * 24 * 60 * 60 * 1000 : (sample.hoursAgo || 0) * 60 * 60 * 1000)
    );
    const address = user.addresses[0]
      ? {
          label: user.addresses[0].label,
          line1: user.addresses[0].line1,
          area: user.addresses[0].area,
          city: user.addresses[0].city,
          pincode: user.addresses[0].pincode,
        }
      : {
          label: 'Home',
          line1: `${user.name.split(' ')[0]}'s apartment`,
          area: restaurant.area,
          city: restaurant.city,
          pincode: '560001',
        };

    const order = await Order.create({
      user: user._id,
      restaurant: restaurant._id,
      items,
      address,
      contactPhone: user.phone || '9876543210',
      ...totals,
      paymentMethod: 'demo_upi',
      paymentStatus: sample.status === 'cancelled' ? 'refund_simulated' : 'simulated_paid',
      deliveryMode: eco.deliveryMode,
      packaging: eco.packaging,
      cutlery: eco.cutlery,
      eco: {
        baselineCo2Kg: eco.baselineCo2Kg,
        actualCo2Kg: eco.actualCo2Kg,
        co2SavedKg: eco.co2SavedKg,
        greenPointsEarned: eco.greenPoints,
        distanceKm: eco.distanceKm,
      },
      status: sample.status,
      statusHistory: historyFor(sample.status, base),
      deliveredAt: sample.status === 'delivered' ? new Date(base.getTime() + 38 * 60 * 1000) : null,
      cancelledAt: sample.status === 'cancelled' ? new Date(base.getTime() + 6 * 60 * 1000) : null,
    });

    // Keep the demo timeline realistic without fighting Mongoose timestamps.
    await Order.collection.updateOne(
      { _id: order._id },
      { $set: { createdAt: base, updatedAt: base } }
    );

    if (eco.greenPoints > 0) {
      const reward = await Reward.create({
        user: user._id,
        order: order._id,
        type: 'eco_order',
        points: eco.greenPoints,
        co2SavedKg: eco.co2SavedKg,
        description: `Eco order at ${restaurant.name}`,
      });
      await Reward.collection.updateOne(
        { _id: reward._id },
        { $set: { createdAt: base, updatedAt: base } }
      );
    }

    if (sample.status === 'cancelled' && eco.greenPoints > 0) {
      await Reward.create({
        user: user._id,
        order: order._id,
        type: 'order_cancelled',
        points: -eco.greenPoints,
        co2SavedKg: -eco.co2SavedKg,
        description: 'Order cancelled - Green Points reversed',
      });
    }

    if (sample.status !== 'cancelled') {
      pointsByUser.set(sample.email, (pointsByUser.get(sample.email) || 0) + eco.greenPoints);
      savingsByUser.set(sample.email, (savingsByUser.get(sample.email) || 0) + eco.co2SavedKg);
    }
  }

  for (const [email, points] of pointsByUser) {
    await User.updateOne(
      { email },
      {
        $set: {
          greenPoints: points,
          lifetimeSavingsKg: Math.round((savingsByUser.get(email) || 0) * 1000) / 1000,
        },
      }
    );
  }

  return {
    seeded: true,
    users: usersByEmail.size,
    restaurants: restaurantsBySlug.size,
    menuItems: await MenuItem.countDocuments(),
    orders: await Order.countDocuments(),
  };
}
