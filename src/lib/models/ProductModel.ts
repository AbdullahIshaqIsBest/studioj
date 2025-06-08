
import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Interface matches the one in AppContext for consistency in frontend-backend data structure
export interface IProduct extends Document {
  // id will be handled by MongoDB's _id, we define a virtual 'id' for frontend use.
  businessId: mongoose.Schema.Types.ObjectId; // Reference to the Business model
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  description: string;
  image?: string;
}

const ProductSchema: Schema<IProduct> = new Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  salePrice: { 
    type: Number, 
    min: 0,
    validate: {
      validator: function(this: IProduct, value: number | undefined | null): boolean {
        if (value === undefined || value === null) return true; // Optional field
        return value < this.price;
      },
      message: 'Sale price must be less than the regular price.'
    }
  },
  description: { type: String, required: true, trim: true },
  image: { type: String, trim: true },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
  toJSON: { virtuals: true }, // Ensure virtuals are included when converting to JSON
  toObject: { virtuals: true }
});

// Virtual for 'id'
ProductSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const ProductModel: Model<IProduct> = models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default ProductModel;
