import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  blog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: [true, 'Blog reference is required']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  replies: [{
    name: String,
    email: String,
    comment: String,
    repliedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
commentSchema.index({ blog: 1, createdAt: -1 });
commentSchema.index({ status: 1 });
commentSchema.index({ email: 1 });

// Static method to get approved comments for a blog
commentSchema.statics.getApprovedComments = function(blogId) {
  return this.find({ 
    blog: blogId, 
    status: 'approved' 
  }).sort({ createdAt: -1 });
};

// Method to add reply
commentSchema.methods.addReply = function(replyData) {
  this.replies.push(replyData);
  return this.save();
};

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;