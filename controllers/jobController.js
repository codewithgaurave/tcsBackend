import Job from '../models/Job.js';
import Application from '../models/Application.js';

// @desc    Get all jobs with filtering and pagination
// @route   GET /api/jobs
// @access  Private
export const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      department,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (department && department !== 'all') {
      filter.department = department;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const jobs = await Job.find(filter)
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await Job.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
};

// @desc    Get active jobs for career page
// @route   GET /api/jobs/active
// @access  Public
export const getActiveJobs = async (req, res) => {
  try {
    const jobs = await Job.getActiveJobs();
    
    res.status(200).json({
      success: true,
      data: jobs,
      count: jobs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active jobs',
      error: error.message
    });
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Private
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get applications count for this job
    const applicationsCount = await Application.countDocuments({ jobId: job._id });

    res.status(200).json({
      success: true,
      data: {
        ...job.toObject(),
        applications: applicationsCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching job',
      error: error.message
    });
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private
export const createJob = async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      // Ensure requirements is an array
      requirements: Array.isArray(req.body.requirements) 
        ? req.body.requirements 
        : [req.body.requirements]
    };

    const job = await Job.create(jobData);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating job',
      error: error.message
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating job',
      error: error.message
    });
  }
};

// @desc    Update job status
// @route   PATCH /api/jobs/:id/status
// @access  Private
export const updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'draft', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Job status updated to ${status}`,
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating job status',
      error: error.message
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if job has applications
    const applicationsCount = await Application.countDocuments({ jobId: job._id });
    
    if (applicationsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete job with existing applications'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting job',
      error: error.message
    });
  }
};

// @desc    Get job statistics
// @route   GET /api/jobs/stats
// @access  Private
export const getJobStats = async (req, res) => {
  try {
    const stats = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalApplications: { $sum: '$applications' }
        }
      }
    ]);

    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'active' });

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        total: totalJobs,
        active: activeJobs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching job statistics',
      error: error.message
    });
  }
};