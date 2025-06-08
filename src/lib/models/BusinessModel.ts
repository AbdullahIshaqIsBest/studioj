
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { BusinessCategory } from '@/contexts/AppContext';

// Re-using the BusinessCategory type from AppContext for consistency
const businessCategoriesArray: BusinessCategory[] = [
  "Restaurant & Cafe",
  "Grocery & Farm Goods",
  "Bakery & Sweets",
  "General Store",
  "Services",
  "Other"
];

export interface IBusiness extends Document {
  // id will be handled by MongoDB's _id, but we can define a virtual if needed.
  name: string;
  description: string;
  address: string;
  city: string;
  category: BusinessCategory;
  phone: string;
  email: string;
  password?: string; // Password should be hashed before saving
  image?: string;
  isSponsored: boolean;
  adExpiryDate?: Date;
}

const BusinessSchema: Schema<IBusiness> = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    required: true, 
    enum: businessCategoriesArray 
  },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // Select: false might be useful to not return it by default
  image: { type: String, trim: true },
  isSponsored: { type: Boolean, default: false },
  adExpiryDate: { type: Date },
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

// For Next.js hot reloading, ensure the model is not recompiled if it already exists.
const BusinessModel: Model<IBusiness> = models.Business || mongoose.model<IBusiness>('Business', BusinessSchema);

export default BusinessModel;
