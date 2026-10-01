import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a product description'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please add a product price'],
      min: [0, 'Price cannot be negative'],
    },
    slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    discountPrice: { type: Number, min: 0 },
    mrp: {
      type: Number,
      min: [0, 'MRP cannot be negative'],
      validate: {
        validator(value) {
          const price = this.get('price');
          return value === undefined || price === undefined || value >= price;
        },
        message: 'MRP cannot be less than price',
      },
    },
    sold: {
      type: Number,
      min: [0, 'Sold count cannot be negative'],
      default: 0,
    },
    freeDelivery: {
      type: Boolean,
      default: false,
    },
    drops: {
      type: Boolean,
      default: false,
    },
    stock: {
      type: Number,
      min: [0, 'Stock cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be an integer',
      },
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Please add a product category'],
      trim: true,
      lowercase: true,
    },
    categoryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    brand: {
      type: String,
      trim: true,
    },
    colors: {
      type: [String],
      default: [],
    },
    sizes: {
      type: [String],
      default: [],
    },
    imageFocus: {
      type: String,
      default: '50% 50%',
      trim: true,
    },
    images: {
      type: [
        {
          type: String,
          validate: {
            validator: (value) => {
              if (/^\/images\/products\/(?!.*\.\.\/)[\w-]+\.jpe?g$/i.test(value)) return true;
              try {
                const url = new URL(value);
                return url.protocol === 'http:' || url.protocol === 'https:';
              } catch {
                return false;
              }
            },
            message: 'Images must be valid HTTP or HTTPS URLs',
          },
        },
      ],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isFeatured: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ categoryRef: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ colors: 1 });
productSchema.index({ sizes: 1 });
productSchema.index({ price: 1 });
productSchema.index({ sold: -1 });

const Product = mongoose.model('Product', productSchema);

export default Product;