import Application from '../models/Application.js';
import Job from '../models/Job.js';
import path from 'path';
import fs from 'fs/promises';

// @desc    Get all applications with filtering
// @route   GET /api/applications
// @access  Private
export const getApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      position,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (position && position !== 'all') {
      filter.position = position;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const applications = await Application.find(filter)
      .populate('jobId', 'title department')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await Application.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// @desc    Get single application by ID
// @route   GET /api/applications/:id
// @access  Private
export const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('jobId');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
};

// @desc    Create new application
// @route   POST /api/applications
// @access  Public
export const createApplication = async (req, res) => {
  try {
    // Check if job exists and is active
    const job = await Job.findOne({ 
      _id: req.body.jobId, 
      status: 'active' 
    });

    if (!job) {
      return res.status(400).json({
        success: false,
        message: 'Job not found or not active'
      });
    }

    // Check for duplicate application
    const existingApplication = await Application.findOne({
      email: req.body.email,
      jobId: req.body.jobId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this position'
      });
    }

    // Handle file upload
    let resumeData = null;
    if (req.file) {
      resumeData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size
      };
    }

    const applicationData = {
      ...req.body,
      resume: resumeData,
      position: job.title,
      // Ensure skills is an array
      skills: Array.isArray(req.body.skills) 
        ? req.body.skills 
        : req.body.skills?.split(',').map(skill => skill.trim()) || []
    };

    const application = await Application.create(applicationData);

    // Increment applications count in job
    await job.incrementApplications();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
};

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private
export const updateApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('jobId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: application
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating application',
      error: error.message
    });
  }
};

// @desc    Update application status
// @route   PATCH /api/applications/:id/status
// @access  Private
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'reviewed', 'interview', 'rejected', 'hired'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('jobId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      data: application
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private
export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Delete resume file if exists
    if (application.resume && application.resume.path) {
      try {
        await fs.unlink(application.resume.path);
      } catch (fileError) {
        console.error('Error deleting resume file:', fileError);
      }
    }

    await Application.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting application',
      error: error.message
    });
  }
};

// @desc    Download resume
// @route   GET /api/applications/:id/resume
// @access  Private
export const downloadResume = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application || !application.resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    const filePath = application.resume.path;
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found on server'
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${application.resume.originalName}"`);
    
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error downloading resume',
      error: error.message
    });
  }
};

// @desc    Get application statistics
// @route   GET /api/applications/stats
// @access  Private
export const getApplicationStats = async (req, res) => {
  try {
    const stats = await Application.getStats();
    
    const totalApplications = await Application.countDocuments();
    const newApplications = await Application.countDocuments({ status: 'new' });

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        total: totalApplications,
        new: newApplications
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching application statistics',
      error: error.message
    });
  }
};