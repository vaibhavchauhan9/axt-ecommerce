import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is mandatory.'],
      unique: true,
      trim: true,
      maxlength: [32, 'Category name cannot exceed 32 characters.'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Automatically compute slugs pre-validation
categorySchema.pre('validate', function (next) {
  if (this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') 
      .replace(/\s+/g, '-') 
      .replace(/-+/g, '-');
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;