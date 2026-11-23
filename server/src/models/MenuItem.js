import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    price: { type: Number, required: true, min: 1, max: 5000 },
    category: {
      type: String,
      required: true,
      enum: ['Starters', 'Mains', 'Breads', 'Rice & Biryani', 'Desserts', 'Drinks'],
    },
    image: { type: String, required: true, trim: true },
    isVeg: { type: Boolean, default: true },
    isVegan: { type: Boolean, default: false },
    spiceLevel: { type: String, enum: ['None', 'Mild', 'Medium', 'Hot'], default: 'Mild' },
    calories: { type: Number, min: 0, default: 300 },
    available: { type: Boolean, default: true },
    popularity: { type: Number, min: 0, default: 0 },
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

menuItemSchema.index({ restaurant: 1, category: 1 });

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
