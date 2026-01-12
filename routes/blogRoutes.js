import express from 'express';
import {
  getAllBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  getFeaturedBlogs,
  getBlogsByCategory,
  getPopularBlogs,
  getRelatedBlogs,
  incrementBlogViews,
  likeBlog,
  searchBlogs,
  uploadBlogImage
} from '../controllers/blogController.js';

import {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  addReply
} from '../controllers/commentController.js';

import { blogImageUpload } from '../config/cloudinary.js';

const router = express.Router();

// Blog routes
router.get('/', getAllBlogs);
router.get('/featured', getFeaturedBlogs);
router.get('/popular', getPopularBlogs);
router.get('/search', searchBlogs);
router.get('/category/:category', getBlogsByCategory);
router.get('/:slug', getBlogBySlug);
router.get('/related/:id', getRelatedBlogs);
router.post('/upload-image', blogImageUpload.single('image'), uploadBlogImage);
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);

// Blog interactions
router.patch('/:id/views', incrementBlogViews);
router.patch('/:id/like', likeBlog);

// Comment routes
router.get('/:blogId/comments', getComments);
router.post('/:blogId/comments', addComment);
router.put('/comments/:commentId', updateComment);
router.delete('/comments/:commentId', deleteComment);
router.post('/comments/:commentId/reply', addReply);

export default router;