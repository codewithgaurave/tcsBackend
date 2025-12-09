import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
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
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required']
  },
  experience: {
    type: String,
    required: [true, 'Experience is required'],
    trim: true
  },
  currentCompany: {
    type: String,
    trim: true
  },
  expectedSalary: {
    type: String,
    required: [true, 'Expected salary is required'],
    trim: true
  },
  noticePeriod: {
    type: String,
    required: [true, 'Notice period is required'],
    trim: true
  },
  resume: {
    filename: String,
    originalName: String,
    path: String,
    size: Number
  },
  coverLetter: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  education: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'reviewed', 'interview', 'rejected', 'hired'],
    default: 'new'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
applicationSchema.index({ email: 1 });
applicationSchema.index({ position: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ jobId: 1 });

// Compound index for unique applications (prevent duplicate applications)
applicationSchema.index({ email: 1, jobId: 1 }, { unique: true });

// Virtual for formatted date
applicationSchema.virtual('date').get(function() {
  return this.createdAt;
});

// Method to update status
applicationSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

// Static method to get applications by status
applicationSchema.statics.getByStatus = function(status) {
  return this.find({ status }).populate('jobId', 'title department').sort({ createdAt: -1 });
};

// Static method to get application statistics
applicationSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

const Application = mongoose.model('Application', applicationSchema);

export default Application;