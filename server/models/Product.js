import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is mandatory.'],
      trim: true,
      maxlength: [120, 'Product name cannot exceed 120 characters.'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    brand: {
      type: String,
      default: 'AXT',
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product must belong to an established category.'],
    },
    description: {
      type: String,
      required: [true, 'Product description is mandatory.'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Base catalog price must be specified.'],
      min: [0, 'Base price cannot be negative.'],
    },
    discountPrice: {
      type: Number,
      validate: {
        validator: function (val) {
          // 'this' only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) must be strictly lower than the standard catalog price.',
      },
    },
    sizes: {
      type: [String],
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      required: true,
    },
    colors: [
      {
        name: { type: String, required: true },
        hex: { type: String, required: true },
      },
    ],
    images: {
      type: [String],
      validate: {
        validator: function (val) {
          return val.length > 0;
        },
        message: 'A premium product listing requires at least one high-resolution showcase image.',
      },
    },
    stock: {
      type: Number,
      required: [true, 'Inventory asset inventory metric required.'],
      min: [0, 'Stock volume values cannot fall below zero.'],
      default: 10,
    },
    sku: {
      type: String,
      required: [true, 'Unique Stock Keeping Unit identifier required.'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be at least 1.0'],
      max: [5, 'Rating cannot exceed 5.0'],
      set: (val) => Math.round(val * 10) / 10, // Rounds 4.6666 to 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Optimizing Search & Filtering Architectures via Database Level Indexing
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text' }, {
  weights: { name: 10, brand: 5, description: 1 },
  name: 'ProductTextSearchIndex',
});

// Dynamic Virtuals: Determine live active product availability status
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// Automatic generation of clean URL routing structures
productSchema.pre('validate', function (next) {
  if (this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;