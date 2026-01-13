import Blog from '../models/Blog.js';
import Comment from '../models/Comment.js';

// @desc    Get all blogs with filtering and pagination
// @route   GET /api/blogs
// @access  Public
export const getAllBlogs = async (req, res) => {
  try {
    const {
      category,
      featured,
      page = 1,
      limit = 10,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
      admin = 'false'
    } = req.query;

    // Build filter object - show all blogs for admin, only published for public
    const filter = admin === 'true' ? {} : { status: 'published' };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (featured !== undefined) {
      filter.featured = featured === 'true';
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    const blogs = await Blog.find(filter)
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content'); // Exclude content for listing

    const total = await Blog.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        current: parseInt(page),
        pages: totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blogs',
      error: error.message
    });
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug, status: 'published' });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment views
    await blog.incrementViews();

    // Get comments count
    const commentsCount = await Comment.countDocuments({ 
      blog: blog._id, 
      status: 'approved' 
    });

    const blogData = blog.toObject();
    blogData.commentsCount = commentsCount;

    res.status(200).json({
      success: true,
      data: blogData
    });
  } catch (error) {
    console.error('Get blog by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog post',
      error: error.message
    });
  }
};

// @desc    Get featured blogs
// @route   GET /api/blogs/featured
// @access  Public
export const getFeaturedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.getFeatured();

    res.status(200).json({
      success: true,
      data: blogs
    });
  } catch (error) {
    console.error('Get featured blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured blogs',
      error: error.message
    });
  }
};

// @desc    Get popular blogs
// @route   GET /api/blogs/popular
// @access  Public
export const getPopularBlogs = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const blogs = await Blog.getPopular(parseInt(limit));

    res.status(200).json({
      success: true,
      data: blogs
    });
  } catch (error) {
    console.error('Get popular blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular blogs',
      error: error.message
    });
  }
};

// @desc    Get blogs by category
// @route   GET /api/blogs/category/:category
// @access  Public
export const getBlogsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const blogs = await Blog.find({ 
      category, 
      status: 'published' 
    })
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('-content');

    const total = await Blog.countDocuments({ category, status: 'published' });

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        current: parseInt(page),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get blogs by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blogs by category',
      error: error.message
    });
  }
};

// @desc    Get related blogs
// @route   GET /api/blogs/:id/related
// @access  Public
export const getRelatedBlogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 3 } = req.query;

    const currentBlog = await Blog.findById(id);
    
    if (!currentBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const relatedBlogs = await Blog.getRelated(
      id,
      currentBlog.category,
      currentBlog.tags,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: relatedBlogs
    });
  } catch (error) {
    console.error('Get related blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching related blogs',
      error: error.message
    });
  }
};

// @desc    Search blogs
// @route   GET /api/blogs/search
// @access  Public
export const searchBlogs = async (req, res) => {
  try {
    const { q, category, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const filter = { 
      status: 'published',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    const skip = (page - 1) * limit;

    const blogs = await Blog.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content');

    const total = await Blog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        current: parseInt(page),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching blogs',
      error: error.message
    });
  }
};

// @desc    Upload blog image to Cloudinary
// @route   POST /api/blogs/upload-image
// @access  Private/Admin
export const uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: req.file.path,
      publicId: req.file.filename
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
};

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private/Admin
export const createBlog = async (req, res) => {
  try {
    const blogData = req.body;

    // Handle uploaded image from Cloudinary
    if (req.file) {
      blogData.featuredImage = {
        url: req.file.path,
        alt: blogData.featuredImage?.alt || '',
        caption: blogData.featuredImage?.caption || ''
      };
    }

    // Validate required author field
    if (!blogData.author || !blogData.author.name) {
      return res.status(400).json({
        success: false,
        message: 'Author name is required'
      });
    }

    // Generate slug if not provided
    if (!blogData.slug && blogData.title) {
      blogData.slug = blogData.title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    const blog = new Blog(blogData);
    await blog.save();

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Blog with this slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating blog',
      error: error.message
    });
    console.log(res)
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private/Admin
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const blog = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating blog',
      error: error.message
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Also delete associated comments
    await Comment.deleteMany({ blog: id });

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting blog',
      error: error.message
    });
  }
};

// @desc    Increment blog views
// @route   PATCH /api/blogs/:id/views
// @access  Public
export const incrementBlogViews = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    await blog.incrementViews();

    res.status(200).json({
      success: true,
      message: 'View count updated',
      views: blog.views
    });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating view count',
      error: error.message
    });
  }
};

// @desc    Like a blog
// @route   PATCH /api/blogs/:id/like
// @access  Public
export const likeBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    blog.likes += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      message: 'Blog liked successfully',
      likes: blog.likes
    });
  } catch (error) {
    console.error('Like blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking blog',
      error: error.message
    });
  }
};