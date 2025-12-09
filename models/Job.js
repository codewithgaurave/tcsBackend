import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Job type is required'],
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  experience: {
    type: String,
    required: [true, 'Experience is required'],
    trim: true
  },
  salary: {
    type: String,
    required: [true, 'Salary information is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true
  },
  requirements: [{
    type: String,
    required: true,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'draft', 'closed'],
    default: 'draft'
  },
  color: {
    type: String,
    default: 'from-blue-500 to-blue-600'
  },
  applications: {
    type: Number,
    default: 0
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better search performance
jobSchema.index({ title: 'text', description: 'text', department: 'text' });
jobSchema.index({ status: 1 });
jobSchema.index({ createdAt: -1 });

// Virtual for formatted date
jobSchema.virtual('posted').get(function() {
  return this.createdAt;
});

// Method to increment applications count
jobSchema.methods.incrementApplications = function() {
  this.applications += 1;
  return this.save();
};

// Static method to get active jobs
jobSchema.statics.getActiveJobs = function() {
  return this.find({ status: 'active' }).sort({ createdAt: -1 });
};

// Static method to get jobs with applications count
jobSchema.statics.getJobsWithStats = function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'applications',
        localField: '_id',
        foreignField: 'position',
        as: 'applications'
      }
    },
    {
      $addFields: {
        applicationsCount: { $size: '$applications' }
      }
    },
    {
      $project: {
        applications: 0
      }
    }
  ]);
};

const Job = mongoose.model('Job', jobSchema);

export default Job;