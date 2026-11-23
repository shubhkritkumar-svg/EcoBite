import mongoose from 'mongoose';
import { DELIVERY_MODES, PACKAGING_OPTIONS } from '../utils/eco.js';

export const ORDER_STATUSES = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
export const ACTIVE_STATUSES = ['placed', 'confirmed', 'preparing', 'out_for_delivery'];

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    image: { type: String, default: '' },
    isVeg: { type: Boolean, default: true },
  },
  { _id: false }
);

const statusEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    items: {
      type: [orderItemSchema],
      validate: [(value) => value.length > 0, 'An order needs at least one item'],
    },
    address: {
      label: { type: String, default: 'Home' },
      line1: { type: String, required: true },
      area: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    contactPhone: { type: String, required: true },
    itemTotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    packagingFee: { type: Number, required: true, min: 0 },
    taxes: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['demo_card', 'demo_upi', 'cash_on_delivery'], default: 'demo_upi' },
    paymentStatus: {
      type: String,
      enum: ['simulated_paid', 'pending', 'refund_simulated'],
      default: 'simulated_paid',
    },
    deliveryMode: { type: String, enum: DELIVERY_MODES, default: 'standard' },
    packaging: { type: String, enum: PACKAGING_OPTIONS, default: 'compostable' },
    cutlery: { type: Boolean, default: false },
    eco: {
      baselineCo2Kg: { type: Number, default: 0 },
      actualCo2Kg: { type: Number, default: 0 },
      co2SavedKg: { type: Number, default: 0 },
      greenPointsEarned: { type: Number, default: 0 },
      distanceKm: { type: Number, default: 0 },
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed', index: true },
    statusHistory: { type: [statusEntrySchema], default: [] },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
