import { Restaurant } from '../models/Restaurant.js';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { Reward } from '../models/Reward.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { computeTotals } from '../utils/pricing.js';
import { computeEcoImpact } from '../utils/eco.js';

const FLOW = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

function toAddressSnapshot(address) {
  return {
    label: address.label || 'Home',
    line1: address.line1,
    area: address.area,
    city: address.city,
    pincode: address.pincode,
  };
}

/**
 * Creates an order with prices, totals and eco metrics recalculated on the
 * server. The client only sends item ids, quantities and preferences.
 */
export async function placeOrder(user, payload) {
  const restaurant = await Restaurant.findById(payload.restaurantId);
  if (!restaurant || !restaurant.isActive) throw new ApiError(404, 'Restaurant not found.');

  if (!restaurant.deliveryModes.includes(payload.deliveryMode)) {
    throw new ApiError(400, 'This restaurant does not offer the selected delivery mode.');
  }
  if (!restaurant.packagingOptions.includes(payload.packaging)) {
    throw new ApiError(400, 'This restaurant does not offer the selected packaging option.');
  }

  const quantities = new Map();
  for (const item of payload.items) {
    quantities.set(item.menuItemId, (quantities.get(item.menuItemId) || 0) + item.quantity);
  }
  for (const quantity of quantities.values()) {
    if (quantity > 10) throw new ApiError(400, 'Maximum quantity per item is 10.');
  }

  const menuItems = await MenuItem.find({
    _id: { $in: [...quantities.keys()] },
    restaurant: restaurant._id,
  });

  if (menuItems.length !== quantities.size) {
    throw new ApiError(400, 'One or more items are not on this restaurant menu.');
  }

  const items = menuItems.map((menuItem) => {
    if (!menuItem.available) {
      throw new ApiError(400, `${menuItem.name} is currently unavailable.`);
    }
    const quantity = quantities.get(String(menuItem._id));
    return {
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
      image: menuItem.image,
      isVeg: menuItem.isVeg,
    };
  });

  let address;
  if (payload.addressId) {
    const saved = user.addresses.id(payload.addressId);
    if (!saved) throw new ApiError(400, 'The selected saved address was not found.');
    address = toAddressSnapshot(saved);
  } else {
    address = toAddressSnapshot(payload.address);
    if (payload.saveAddress) {
      if (user.addresses.length === 0) payload.address.isDefault = true;
      user.addresses.push(payload.address);
      await user.save();
    }
  }

  const totals = computeTotals(items);
  const eco = computeEcoImpact({
    distanceKm: restaurant.distanceKm,
    deliveryMode: payload.deliveryMode,
    packaging: payload.packaging,
    cutlery: payload.cutlery,
  });

  const order = await Order.create({
    user: user._id,
    restaurant: restaurant._id,
    items,
    address,
    contactPhone: payload.contactPhone,
    ...totals,
    paymentMethod: payload.paymentMethod,
    paymentStatus: payload.paymentMethod === 'cash_on_delivery' ? 'pending' : 'simulated_paid',
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
    status: 'placed',
    statusHistory: [{ status: 'placed', at: new Date() }],
  });

  let reward = null;
  if (eco.greenPoints > 0) {
    try {
      reward = await Reward.create({
        user: user._id,
        order: order._id,
        type: 'eco_order',
        points: eco.greenPoints,
        co2SavedKg: eco.co2SavedKg,
        description: `Eco order at ${restaurant.name}`,
      });
      await User.updateOne(
        { _id: user._id },
        { $inc: { greenPoints: eco.greenPoints, lifetimeSavingsKg: eco.co2SavedKg } }
      );
    } catch (error) {
      if (reward) await Reward.deleteOne({ _id: reward._id });
      await Order.deleteOne({ _id: order._id });
      throw error;
    }
  }

  return { order, greenPointsEarned: eco.greenPoints };
}

export async function advanceOrder(order) {
  if (order.status === 'cancelled') throw new ApiError(400, 'Cancelled orders cannot be tracked.');
  if (order.status === 'delivered') throw new ApiError(400, 'This order has already been delivered.');

  const index = FLOW.indexOf(order.status);
  order.status = FLOW[Math.min(index + 1, FLOW.length - 1)];
  order.statusHistory.push({ status: order.status, at: new Date() });
  if (order.status === 'delivered') order.deliveredAt = new Date();
  await order.save();
  return order;
}

export async function cancelOrder(order) {
  if (order.status === 'cancelled') throw new ApiError(400, 'This order is already cancelled.');
  if (order.status === 'delivered') throw new ApiError(400, 'Delivered orders cannot be cancelled.');

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  if (order.paymentStatus === 'simulated_paid') order.paymentStatus = 'refund_simulated';
  order.statusHistory.push({ status: 'cancelled', at: new Date() });
  await order.save();

  if (order.eco.greenPointsEarned > 0) {
    const user = await User.findById(order.user);
    if (user) {
      user.greenPoints = Math.max(0, user.greenPoints - order.eco.greenPointsEarned);
      user.lifetimeSavingsKg = Math.max(0, user.lifetimeSavingsKg - order.eco.co2SavedKg);
      await user.save();
      await Reward.create({
        user: user._id,
        order: order._id,
        type: 'order_cancelled',
        points: -order.eco.greenPointsEarned,
        co2SavedKg: -order.eco.co2SavedKg,
        description: 'Order cancelled - Green Points reversed',
      });
    }
  }

  return order;
}

export async function setOrderStatus(order, status) {
  if (status === 'cancelled') return cancelOrder(order);
  if (order.status === 'cancelled') throw new ApiError(400, 'Cancelled orders cannot be updated.');
  if (order.status === 'delivered') throw new ApiError(400, 'Delivered orders are final.');

  order.status = status;
  order.statusHistory.push({ status, at: new Date() });
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    order.paymentStatus = 'simulated_paid';
  }
  await order.save();
  return order;
}
