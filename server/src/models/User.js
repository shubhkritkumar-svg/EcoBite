import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 30, default: 'Home' },
    line1: { type: String, required: true, trim: true, maxlength: 160 },
    area: { type: String, required: true, trim: true, maxlength: 80 },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    pincode: { type: String, required: true, match: [/^[1-9][0-9]{5}$/, 'Pincode must be 6 digits'] },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    passwordHash: { type: String, required: true, select: false },
    phone: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (value) => !value || /^[6-9]\d{9}$/.test(value),
        message: 'Phone must be a valid 10-digit Indian mobile number',
      },
    },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    addresses: { type: [addressSchema], default: [] },
    greenPoints: { type: Number, default: 0, min: 0 },
    lifetimeSavingsKg: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

userSchema.methods.setPassword = async function setPassword(plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, 12);
};

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
