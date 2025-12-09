import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  featuredImage: {
    url: {
      type: String,
      default: ''
    },
    alt: {
      type: String,
      default: ''
    },
    caption: {
      type: String,
      default: ''
    }
  },
  author: {
    name: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    bio: {
      type: String,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Structural Engineering',
      'Piping Systems', 
      'Mechanical Works',
      'Electrical Systems',
      'Safety Standards',
      'Industry Insights',
      'Construction',
      'Technology',
      'Sustainability'
    ]
  },
  tags: [{
    type: String,
    trim: true
  }],
  readingTime: {
    type: Number,
    required: [true, 'Reading time is required'],
    min: [1, 'Reading time must be at least 1 minute']
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  }
}, {
  timestamps: true
});

// Indexes for better performance
blogSchema.index({ slug: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ views: -1 });
blogSchema.index({ likes: -1 });
blogSchema.index({ tags: 1 });

// Virtual for formatted date
blogSchema.virtual('formattedDate').get(function() {
  return this.publishedAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Method to increment views
blogSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

// Method to like/unlike blog
blogSchema.methods.toggleLike = async function() {
  this.likes += 1;
  return this.save();
};

// Static method to get featured blogs
blogSchema.statics.getFeatured = function() {
  return this.find({ 
    featured: true, 
    status: 'published' 
  }).sort({ publishedAt: -1 });
};

// Static method to get blogs by category
blogSchema.statics.getByCategory = function(category) {
  return this.find({ 
    category, 
    status: 'published' 
  }).sort({ publishedAt: -1 });
};

// Static method to get popular blogs
blogSchema.statics.getPopular = function(limit = 5) {
  return this.find({ 
    status: 'published' 
  })
  .sort({ views: -1, likes: -1 })
  .limit(limit);
};

// Static method to get related blogs
blogSchema.statics.getRelated = function(blogId, category, tags, limit = 3) {
  return this.find({
    _id: { $ne: blogId },
    category,
    status: 'published',
    tags: { $in: tags }
  })
  .limit(limit)
  .sort({ views: -1, publishedAt: -1 });
};

// Middleware to generate slug from title before saving
blogSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;