import mongoose from 'mongoose';
import { DELIVERY_MODES, PACKAGING_OPTIONS } from '../utils/eco.js';

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 400 },
    cuisines: {
      type: [{ type: String, enum: ['North Indian', 'South Indian', 'Healthy', 'Italian', 'Chinese', 'Street Food', 'Mughlai', 'Seafood', 'Continental', 'Desserts', 'Beverages'] }],
      validate: [(value) => value.length > 0, 'At least one cuisine is required'],
    },
    area: { type: String, required: true, trim: true, maxlength: 60 },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    image: { type: String, required: true, trim: true },
    rating: { type: Number, min: 0, max: 5, default: 4.2 },
    ratingCount: { type: Number, min: 0, default: 0 },
    priceForTwo: { type: Number, required: true, min: 100 },
    deliveryTimeMins: { type: Number, required: true, min: 5, max: 120 },
    distanceKm: { type: Number, required: true, min: 0, max: 30 },
    isEcoCertified: { type: Boolean, default: false },
    ecoCriteria: { type: [String], default: [] },
    deliveryModes: {
      type: [{ type: String, enum: DELIVERY_MODES }],
      default: ['standard'],
    },
    packagingOptions: {
      type: [{ type: String, enum: PACKAGING_OPTIONS }],
      default: ['standard', 'compostable'],
    },
    isActive: { type: Boolean, default: true },
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

restaurantSchema.virtual('ecoBadge').get(function ecoBadge() {
  if (this.isEcoCertified) return 'Eco Certified';
  if (this.ecoCriteria?.length >= 3) return 'Eco Friendly';
  return null;
});

restaurantSchema.index({ area: 1, city: 1 });

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
