import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IProduct extends Document {
  businessId: mongoose.Schema.Types.ObjectId;
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  description: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
  id?: string; // virtual
}

const ProductSchema: Schema<IProduct> = new Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    salePrice: {
      type: Number,
      min: 0,
      validate: {
        validator: function (this: IProduct, value: number | undefined | null): boolean {
          if (value === undefined || value === null) return true;
          return value < this.price;
        },
        message: 'Sale price must be less than the regular price.',
      },
    },
    description: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for 'id' (for frontend use)
ProductSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const ProductModel: Model<IProduct> =
  models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default ProductModel;
