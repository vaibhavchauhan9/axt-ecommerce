import mongoose from 'mongoose';
import Product from './Product.js';

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review text summary commentary cannot be left empty.'],
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must point to an associated asset model.'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must originate from an authenticated user.'],
    },
  },
  { timestamps: true }
);

// Enforce a strict constraint: one user can post only one review per unique product resource
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static Aggregation Method: Computes dynamic rating metrics automatically on the catalog index
reviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5, // Reset defaults
    });
  }
};

// Fire aggregation logic after a new review document is written
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.product);
});

// Capture baseline context data right before execution calls update or delete operations
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.clone().findOne();
  next();
});

// Fire aggregation update triggers immediately following update or delete write cycles
reviewSchema.post(/^findOneAnd/, async function () {
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.product);
  }
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;