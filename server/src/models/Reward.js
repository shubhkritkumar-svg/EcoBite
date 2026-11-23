import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    type: {
      type: String,
      enum: ['eco_order', 'order_cancelled', 'welcome_bonus'],
      default: 'eco_order',
    },
    points: { type: Number, required: true },
    co2SavedKg: { type: Number, default: 0 },
    description: { type: String, required: true, maxlength: 200 },
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

rewardSchema.index({ user: 1, createdAt: -1 });

export const Reward = mongoose.model('Reward', rewardSchema);
