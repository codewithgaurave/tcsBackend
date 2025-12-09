import Comment from '../models/Comment.js';
import Blog from '../models/Blog.js';

// @desc    Get comments for a blog
// @route   GET /api/blogs/:blogId/comments
// @access  Public
export const getComments = async (req, res) => {
  try {
    const { blogId } = req.params;

    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const comments = await Comment.getApprovedComments(blogId);

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message
    });
  }
};

// @desc    Add comment to blog
// @route   POST /api/blogs/:blogId/comments
// @access  Public
export const addComment = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { name, email, comment, rating } = req.body;

    // Check if blog exists and allows comments
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    if (!blog.allowComments) {
      return res.status(400).json({
        success: false,
        message: 'Comments are disabled for this blog post'
      });
    }

    const newComment = new Comment({
      blog: blogId,
      name,
      email,
      comment,
      rating: rating || 5
    });

    await newComment.save();

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// @desc    Update comment
// @route   PUT /api/blogs/comments/:commentId
// @access  Private/Admin
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const updateData = req.body;

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment',
      error: error.message
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/blogs/comments/:commentId
// @access  Private/Admin
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findByIdAndDelete(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message
    });
  }
};

// @desc    Add reply to comment
// @route   POST /api/blogs/comments/:commentId/reply
// @access  Private/Admin
export const addReply = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { name, email, comment } = req.body;

    const commentDoc = await Comment.findById(commentId);

    if (!commentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    await commentDoc.addReply({
      name,
      email,
      comment
    });

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      data: commentDoc
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reply',
      error: error.message
    });
  }
};